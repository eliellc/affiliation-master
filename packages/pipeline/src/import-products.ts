import type { Prisma, PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { ProductsFileSchema, ProductSchema } from "./schemas";
import { ensureCategoryPaths, resolveCategoryIdsByPaths } from "./categories";
import { productsJsonPath } from "./paths";
import { syncProductsToIndex, type ProductLikeForIndex } from "@affiliate/search";
import { triggerRevalidate } from "./revalidate";

function productPathsToRevalidate(slug: string, primaryCategoryPath: string | undefined): string[] {
  const root = primaryCategoryPath?.split("/").filter(Boolean)[0];
  const out = [`/produit/${slug}`];
  if (root) out.push(`/${root}/${slug}`);
  return out;
}

export type ImportProductsResult = {
  inserted: number;
  updated: number;
  errors: number;
  records: number;
  /** Produits du site passés à in_stock=false car absents du JSON (ou fichier vide → tout le catalogue). */
  marked_obsolete: number;
};

function toIndexDoc(row: {
  id: string;
  siteId: string;
  slug: string;
  title: string;
  description: string | null;
  brand: string | null;
  price: number | null;
  rating: number | null;
  images: string[];
  inStock: boolean;
  createdAt: Date;
  categories: { category: { path: string } }[];
}): ProductLikeForIndex {
  return {
    id: row.id,
    siteId: row.siteId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    brand: row.brand,
    price: row.price,
    rating: row.rating,
    images: row.images,
    inStock: row.inStock,
    createdAt: row.createdAt,
    categoryPaths: row.categories.map((c) => c.category.path),
  };
}

export async function importProducts(
  prisma: PrismaClient,
  siteId: string,
  options: { dryRun?: boolean; skipSearch?: boolean; skipRevalidate?: boolean } = {}
): Promise<ImportProductsResult> {
  const raw = await readFile(productsJsonPath(siteId), "utf-8");
  const parsed = ProductsFileSchema.parse(JSON.parse(raw));
  if (parsed.site !== siteId) {
    throw new Error(`File site mismatch: expected ${siteId}, got ${parsed.site}`);
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;
  const records = parsed.products.length;

  const allCategoryPaths = new Set<string>();
  for (const p of parsed.products) {
    for (const c of p.categories) {
      allCategoryPaths.add(c);
    }
  }

  if (options.dryRun) {
    for (const p of parsed.products) {
      const r = ProductSchema.safeParse(p);
      if (!r.success) errors += 1;
    }
    return { inserted: 0, updated: 0, errors, records, marked_obsolete: 0 };
  }

  await ensureCategoryPaths(prisma, siteId, allCategoryPaths);

  const touchedSlugs: string[] = [];

  for (const p of parsed.products) {
    const check = ProductSchema.safeParse(p);
    if (!check.success) {
      errors += 1;
      continue;
    }
    const data = check.data;

    const existing = await prisma.product.findFirst({
      where: { siteId, slug: data.slug },
      select: { id: true },
    });

    const categoryIds = await resolveCategoryIdsByPaths(prisma, siteId, data.categories);

    const productRow = await prisma.product.upsert({
      where: { siteId_slug: { siteId, slug: data.slug } },
      create: {
        siteId,
        slug: data.slug,
        title: data.title,
        description: data.description ?? null,
        content: data.content ?? null,
        price: data.price ?? null,
        priceOld: data.price_old ?? null,
        currency: data.currency,
        affiliateUrl: data.affiliate_url,
        images: data.images,
        inStock: data.in_stock,
        rating: data.rating ?? null,
        reviewCount: data.review_count ?? null,
        brand: data.brand ?? null,
        ean: data.ean ?? null,
        metaTitle: data.meta_title ?? null,
        metaDesc: data.meta_desc ?? null,
      },
      update: {
        title: data.title,
        description: data.description ?? null,
        content: data.content ?? null,
        price: data.price ?? null,
        priceOld: data.price_old ?? null,
        currency: data.currency,
        affiliateUrl: data.affiliate_url,
        images: data.images,
        inStock: data.in_stock,
        rating: data.rating ?? null,
        reviewCount: data.review_count ?? null,
        brand: data.brand ?? null,
        ean: data.ean ?? null,
        metaTitle: data.meta_title ?? null,
        metaDesc: data.meta_desc ?? null,
      },
    });

    await prisma.productCategory.deleteMany({ where: { productId: productRow.id } });
    await prisma.productCategory.createMany({
      data: categoryIds.map((categoryId) => ({
        productId: productRow.id,
        categoryId,
      })),
    });

    if (existing) updated += 1;
    else inserted += 1;

    touchedSlugs.push(data.slug);
  }

  /**
   * Produits en base mais plus dans le flux JSON → inStock false (évite fiches actives + liens morts).
   * Garde-fou : si le fichier contient des entrées mais aucune n’est valide, on n’écrase pas tout le catalogue.
   */
  let marked_obsolete = 0;
  let obsoleteWhere: Prisma.ProductWhereInput | null = null;
  if (parsed.products.length === 0) {
    obsoleteWhere = { siteId };
  } else if (touchedSlugs.length > 0) {
    obsoleteWhere = { siteId, slug: { notIn: touchedSlugs } };
  }

  if (obsoleteWhere) {
    const up = await prisma.product.updateMany({
      where: obsoleteWhere,
      data: { inStock: false },
    });
    marked_obsolete = up.count;

    if (marked_obsolete > 0 && !options.skipSearch) {
      const staleRows = await prisma.product.findMany({
        where: obsoleteWhere,
        include: { categories: { include: { category: true } } },
      });
      await syncProductsToIndex(staleRows.map(toIndexDoc));
    }
  }

  if (!options.skipSearch && touchedSlugs.length > 0) {
    const fullRows = await prisma.product.findMany({
      where: { siteId, slug: { in: touchedSlugs } },
      include: { categories: { include: { category: true } } },
    });
    await syncProductsToIndex(fullRows.map(toIndexDoc));
  }

  if (!options.skipRevalidate) {
    const paths = new Set<string>(["/", "/sitemap.xml"]);
    if (obsoleteWhere && marked_obsolete > 0) {
      const obsoleteRows = await prisma.product.findMany({
        where: obsoleteWhere,
        select: {
          slug: true,
          categories: {
            take: 1,
            select: { category: { select: { path: true } } },
          },
        },
      });
      for (const r of obsoleteRows) {
        for (const p of productPathsToRevalidate(
          r.slug,
          r.categories[0]?.category.path
        )) {
          paths.add(p);
        }
      }
    }
    await triggerRevalidate([...paths]);
  }

  return { inserted, updated, errors, records, marked_obsolete };
}
