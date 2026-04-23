import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import type { Prisma, PrismaClient } from "@prisma/client";
import { ProductSchema } from "./schemas";
import { ensureCategoryPaths, resolveCategoryIdsByPaths } from "./categories";
import { lepiondorFichesDir, productsImportManifestPath } from "./paths";
import { syncProductsToIndex, type ProductLikeForIndex } from "@affiliate/search";
import { triggerRevalidate } from "./revalidate";

type ImportOptions = { dryRun?: boolean; skipSearch?: boolean; skipRevalidate?: boolean; limit?: number };
type ImportProductsResult = { inserted: number; updated: number; errors: number; records: number; marked_obsolete: number };

type ManifestEntry = { signature: string; slug: string };
type Manifest = { version: 1; entries: Record<string, ManifestEntry> };

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

function slugifySegment(text: string): string {
  const n = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return n || "x";
}

function categoryPathsFromBreadcrumbs(raw: Record<string, unknown>): string[] {
  const breadcrumbs = Array.isArray(raw.breadcrumbs) ? raw.breadcrumbs : [];
  if (breadcrumbs.length === 0) return ["non-classe"];
  const root = breadcrumbs[0] as { slug?: string; name?: string } | string;
  if (typeof root === "object" && root && typeof root.slug === "string") {
    const cleaned = root.slug.replace(/^\/+|\/+$/g, "");
    const first = cleaned.split("/")[0];
    if (first) return [first];
  }
  if (typeof root === "object" && root && typeof root.name === "string") return [slugifySegment(root.name)];
  if (typeof root === "string") return [slugifySegment(root)];
  return ["non-classe"];
}

function parsePrice(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  const first = Array.isArray(raw) ? raw[0] : raw;
  const s = String(first).replace(/\s/g, "").replace("€", "").replace(",", ".");
  const m = s.match(/[\d.]+/);
  if (!m) return undefined;
  const n = Number.parseFloat(m[0]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function truncate(str: unknown, max: number): string | undefined {
  if (typeof str !== "string") return undefined;
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + "…";
}

function mapFiche(raw: Record<string, unknown>) {
  const images = Array.isArray(raw["product-images"])
    ? raw["product-images"].filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u))
    : [];
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const slug = typeof raw.slug === "string" ? slugifySegment(raw.slug) : slugifySegment(title || "produit");
  const url = Array.isArray(raw.urls)
    ? raw.urls.find((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u))
    : undefined;
  const price = parsePrice(raw.price);
  if (!title || !slug || !url || images.length === 0 || price == null) return null;

  const categories = categoryPathsFromBreadcrumbs(raw);
  const breadcrumbTail = Array.isArray(raw.breadcrumbs) ? raw.breadcrumbs[raw.breadcrumbs.length - 1] : undefined;
  const brand =
    typeof breadcrumbTail === "object" && breadcrumbTail && "name" in breadcrumbTail
      ? String((breadcrumbTail as { name?: unknown }).name ?? "").trim() || undefined
      : undefined;

  return ProductSchema.parse({
    slug,
    title,
    description:
      typeof raw.accroche === "string"
        ? raw.accroche.trim()
        : typeof raw.meta_description === "string"
          ? raw.meta_description.trim()
          : undefined,
    content: typeof raw.description_long === "string" ? raw.description_long.trim() : undefined,
    price,
    currency: "EUR",
    affiliate_url: url,
    images,
    in_stock: true,
    brand,
    ean: raw.ean != null ? String(raw.ean).trim() : undefined,
    editorial: raw,
    categories,
    meta_title: truncate(raw.meta_title, 70),
    meta_desc: truncate(raw.meta_description, 160),
  });
}

function signatureFor(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function readManifest(siteId: string): Promise<Manifest> {
  const path = productsImportManifestPath(siteId);
  try {
    const raw = await readFile(path, "utf-8");
    const parsed = JSON.parse(raw) as Manifest;
    if (parsed.version === 1 && parsed.entries && typeof parsed.entries === "object") return parsed;
  } catch {
    // ignore
  }
  return { version: 1, entries: {} };
}

async function writeManifest(siteId: string, manifest: Manifest): Promise<void> {
  await writeFile(productsImportManifestPath(siteId), JSON.stringify(manifest), "utf-8");
}

export async function importProductsFromLepiondorFiches(
  prisma: PrismaClient,
  siteId: string,
  options: ImportOptions = {}
): Promise<ImportProductsResult> {
  const dir = lepiondorFichesDir();
  const names = (await readdir(dir)).filter((n) => n.endsWith(".json")).sort((a, b) => a.localeCompare(b));
  const limit = options.limit && options.limit > 0 ? options.limit : undefined;
  const selectedNames = limit ? names.slice(0, limit) : names;
  const records = selectedNames.length;

  let inserted = 0;
  let updated = 0;
  let errors = 0;
  const touchedSlugs: string[] = [];
  const changedProducts: Array<ReturnType<typeof mapFiche>> = [];
  const categories = new Set<string>();

  const oldManifest = await readManifest(siteId);
  const newManifest: Manifest = { version: 1, entries: {} };

  for (const name of selectedNames) {
    const fullPath = `${dir}/${name}`;
    try {
      await stat(fullPath);
      const content = await readFile(fullPath, "utf-8");
      const sig = signatureFor(content);
      const prev = oldManifest.entries[name];
      if (prev && prev.signature === sig) {
        newManifest.entries[name] = prev;
        touchedSlugs.push(prev.slug);
        continue;
      }
      const raw = JSON.parse(content) as Record<string, unknown>;
      const product = mapFiche(raw);
      if (!product) {
        continue;
      }
      changedProducts.push(product);
      touchedSlugs.push(product.slug);
      newManifest.entries[name] = { signature: sig, slug: product.slug };
      for (const c of product.categories) categories.add(c);
    } catch {
      errors += 1;
    }
  }

  if (options.dryRun) {
    return { inserted: 0, updated: 0, errors, records, marked_obsolete: 0 };
  }

  await ensureCategoryPaths(prisma, siteId, categories);
  for (const data of changedProducts) {
    const existing = await prisma.product.findFirst({ where: { siteId, slug: data.slug }, select: { id: true } });
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
        editorial: data.editorial ?? null,
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
        editorial: data.editorial ?? null,
        metaTitle: data.meta_title ?? null,
        metaDesc: data.meta_desc ?? null,
      },
    });
    await prisma.productCategory.deleteMany({ where: { productId: productRow.id } });
    await prisma.productCategory.createMany({ data: categoryIds.map((categoryId) => ({ productId: productRow.id, categoryId })) });
    if (existing) updated += 1;
    else inserted += 1;
  }

  const obsoleteWhere: Prisma.ProductWhereInput = touchedSlugs.length > 0 ? { siteId, slug: { notIn: touchedSlugs } } : { siteId };
  const up = await prisma.product.updateMany({ where: obsoleteWhere, data: { inStock: false } });
  const marked_obsolete = up.count;

  if (!options.skipSearch && changedProducts.length > 0) {
    const fullRows = await prisma.product.findMany({
      where: { siteId, slug: { in: changedProducts.map((p) => p.slug) } },
      include: { categories: { include: { category: true } } },
    });
    await syncProductsToIndex(fullRows.map(toIndexDoc));
  }

  if (!options.skipRevalidate) {
    const paths = new Set<string>(["/", "/sitemap.xml"]);
    await triggerRevalidate([...paths]);
  }

  await writeManifest(siteId, newManifest);
  return { inserted, updated, errors, records, marked_obsolete };
}
