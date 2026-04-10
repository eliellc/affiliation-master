import type { PrismaClient } from "@prisma/client";
import { ensureProductIndexSettings, syncProductsToIndex, type ProductLikeForIndex } from "@affiliate/search";

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

export async function reindexSiteProducts(prisma: PrismaClient, siteId: string): Promise<number> {
  await ensureProductIndexSettings();
  const fullRows = await prisma.product.findMany({
    where: { siteId },
    include: { categories: { include: { category: true } } },
  });
  const docs = fullRows.map(toIndexDoc);
  if (docs.length > 0) {
    await syncProductsToIndex(docs);
  }
  return docs.length;
}
