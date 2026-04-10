import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@affiliate/db";

const DEFAULT_PAGE_SIZE = 24;

export type ProductSort = "rating" | "price" | "createdAt";

function productOrderBy(sort: ProductSort | undefined): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price":
      return { price: "asc" };
    case "createdAt":
      return { createdAt: "desc" };
    case "rating":
    default:
      return { rating: "desc" };
  }
}

export function getProduct(siteId: string, slug: string) {
  return unstable_cache(
    async () => {
      return prisma.product.findFirst({
        where: { siteId, slug },
        include: { categories: { include: { category: true } } },
      });
    },
    ["product", siteId, slug],
    { revalidate: 86400 }
  )();
}

export function getProductsByCategory(
  siteId: string,
  categoryPath: string,
  options: { page?: number; sort?: ProductSort; inStockOnly?: boolean; limit?: number } = {}
) {
  const page = options.page ?? 1;
  const sort = options.sort ?? "rating";
  const inStockOnly = options.inStockOnly ?? true;
  const pageSize = options.limit ?? DEFAULT_PAGE_SIZE;

  return unstable_cache(
    async () => {
      const where: Prisma.ProductWhereInput = {
        siteId,
        ...(inStockOnly ? { inStock: true } : {}),
        categories: {
          some: { category: { path: { startsWith: categoryPath } } },
        },
      };
      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: productOrderBy(sort),
        }),
        prisma.product.count({ where }),
      ]);
      return { items, total, pageSize };
    },
    [
      "products-category",
      siteId,
      categoryPath,
      String(page),
      sort,
      String(inStockOnly),
      String(pageSize),
    ],
    { revalidate: 3600 }
  )();
}

export function getProductsBySlugs(siteId: string, slugs: string[]) {
  const keySlugs = [...slugs].sort().join(",");

  return unstable_cache(
    async () => {
      if (slugs.length === 0) return [];
      return prisma.product.findMany({
        where: { siteId, slug: { in: slugs }, inStock: true },
        include: { categories: { include: { category: true } } },
      });
    },
    ["products-by-slugs", siteId, keySlugs],
    { revalidate: 3600 }
  )();
}

export async function getCategoryByPath(siteId: string, path: string) {
  return prisma.category.findFirst({
    where: { siteId, path },
  });
}

export async function getChildCategories(siteId: string, pathPrefix: string) {
  return prisma.category.findMany({
    where: {
      siteId,
      path: { startsWith: pathPrefix },
      NOT: { path: pathPrefix },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listCategoriesForSite(siteId: string) {
  return prisma.category.findMany({
    where: { siteId },
    select: { path: true, name: true },
    orderBy: { path: "asc" },
  });
}

export async function countProductsForSitemap(siteId: string, inStockOnly: boolean) {
  return prisma.product.count({
    where: { siteId, ...(inStockOnly ? { inStock: true } : {}) },
  });
}

export async function listProductsSitemapChunk(
  siteId: string,
  page: number,
  take: number,
  inStockOnly: boolean
) {
  return prisma.product.findMany({
    where: { siteId, ...(inStockOnly ? { inStock: true } : {}) },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take,
    skip: (page - 1) * take,
  });
}

export async function listArticlesForSitemap(siteId: string) {
  return prisma.article.findMany({
    where: { siteId, publishedAt: { not: null } },
    select: { slug: true, type: true, updatedAt: true },
  });
}

export async function getTopProductSlugs(siteId: string, take: number) {
  const rows = await prisma.product.findMany({
    where: { siteId, inStock: true },
    orderBy: { rating: "desc" },
    take,
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getTopComparatifSlugs(siteId: string, take: number) {
  const rows = await prisma.article.findMany({
    where: { siteId, type: "comparatif", publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take,
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getRecentArticleSlugs(siteId: string, take: number) {
  const rows = await prisma.article.findMany({
    where: { siteId, type: "article", publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take,
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export function getArticle(siteId: string, slug: string, type?: "article" | "comparatif" | "guide") {
  return unstable_cache(
    async () => {
      return prisma.article.findFirst({
        where: {
          siteId,
          slug,
          publishedAt: { not: null },
          ...(type ? { type } : {}),
        },
        include: { tags: { include: { tag: true } } },
      });
    },
    ["article", siteId, slug, type ?? "any"],
    { revalidate: 86400 }
  )();
}

export function listBlogArticles(siteId: string, page: number) {
  const pageSize = 24;
  return unstable_cache(
    async () => {
      const where = { siteId, type: "article" as const, publishedAt: { not: null } };
      const [items, total] = await Promise.all([
        prisma.article.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          take: pageSize,
          skip: (page - 1) * pageSize,
        }),
        prisma.article.count({ where }),
      ]);
      return { items, total, pageSize };
    },
    ["blog-list", siteId, String(page)],
    { revalidate: 3600 }
  )();
}
