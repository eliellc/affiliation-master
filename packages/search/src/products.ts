import { createSearchClient, PRODUCTS_INDEX } from "./client";

export type ProductSearchDoc = {
  id: string;
  siteId: string;
  slug: string;
  /** Premier segment du chemin catégorie (URL publique `/{univers}/{slug}`). */
  univers: string;
  title: string;
  description: string | null;
  brand: string | null;
  price: number | null;
  rating: number | null;
  images: string[];
  categories: string[];
  inStock: boolean;
  createdAt: string;
};

export type ProductLikeForIndex = {
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
  categoryPaths: string[];
};

export async function ensureProductIndexSettings() {
  const client = createSearchClient();
  const index = client.index(PRODUCTS_INDEX);
  try {
    await client.getIndex(PRODUCTS_INDEX);
  } catch {
    await client.createIndex(PRODUCTS_INDEX, { primaryKey: "id" });
  }
  await index.updateSettings({
    filterableAttributes: ["siteId", "categories", "inStock", "brand"],
    sortableAttributes: ["price", "rating", "createdAt"],
    searchableAttributes: ["title", "description", "brand"],
  });
}

function universFromCategoryPaths(paths: string[]): string {
  const first = paths[0];
  return first?.split("/").filter(Boolean)[0] ?? "";
}

function toDoc(p: ProductLikeForIndex): ProductSearchDoc {
  return {
    id: p.id,
    siteId: p.siteId,
    slug: p.slug,
    univers: universFromCategoryPaths(p.categoryPaths),
    title: p.title,
    description: p.description,
    brand: p.brand,
    price: p.price,
    rating: p.rating,
    images: p.images,
    categories: p.categoryPaths,
    inStock: p.inStock,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function syncProductsToIndex(products: ProductLikeForIndex[]) {
  if (products.length === 0) return;
  await ensureProductIndexSettings();
  const client = createSearchClient();
  const index = client.index(PRODUCTS_INDEX);
  const docs = products.map(toDoc);
  await index.addDocuments(docs);
}

export async function deleteSiteProductsFromIndex(productIds: string[]) {
  if (productIds.length === 0) return;
  const client = createSearchClient();
  const index = client.index(PRODUCTS_INDEX);
  await index.deleteDocuments(productIds);
}

export async function searchProducts(siteId: string, query: string, limit = 20) {
  const client = createSearchClient();
  const index = client.index(PRODUCTS_INDEX);
  return index.search(query, {
    filter: `siteId = "${siteId}"`,
    attributesToRetrieve: ["slug", "univers", "title", "price", "images", "rating"],
    limit,
  });
}
