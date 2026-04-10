import { Prisma } from "@affiliate/db";
import type { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { ArticlesFileSchema, ArticleItemSchema } from "./schemas";
import { articlesJsonPath } from "./paths";
import { triggerRevalidate } from "./revalidate";

function slugifyTag(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type ImportArticlesResult = {
  inserted: number;
  updated: number;
  errors: number;
  records: number;
};

export async function importArticles(
  prisma: PrismaClient,
  siteId: string,
  options: { dryRun?: boolean; skipRevalidate?: boolean } = {}
): Promise<ImportArticlesResult> {
  const raw = await readFile(articlesJsonPath(siteId), "utf-8");
  const parsed = ArticlesFileSchema.parse(JSON.parse(raw));
  if (parsed.site !== siteId) {
    throw new Error(`File site mismatch: expected ${siteId}, got ${parsed.site}`);
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;
  const records = parsed.articles.length;

  if (options.dryRun) {
    for (const a of parsed.articles) {
      if (!ArticleItemSchema.safeParse(a).success) errors += 1;
    }
    return { inserted: 0, updated: 0, errors, records };
  }

  for (const a of parsed.articles) {
    const check = ArticleItemSchema.safeParse(a);
    if (!check.success) {
      errors += 1;
      continue;
    }
    const data = check.data;

    const existing = await prisma.article.findFirst({
      where: { siteId, slug: data.slug },
      select: { id: true },
    });

    const publishedAt = data.published_at ? new Date(data.published_at) : null;

    const blocksJson: Prisma.InputJsonValue | typeof Prisma.DbNull =
      data.blocks === undefined
        ? Prisma.DbNull
        : (data.blocks as Prisma.InputJsonValue);

    const articleRow = await prisma.article.upsert({
      where: { siteId_slug: { siteId, slug: data.slug } },
      create: {
        siteId,
        type: data.type,
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? null,
        content: data.content,
        blocks: blocksJson,
        imageUrl: data.image_url ?? null,
        metaTitle: data.meta_title ?? null,
        metaDesc: data.meta_desc ?? null,
        publishedAt,
      },
      update: {
        type: data.type,
        title: data.title,
        excerpt: data.excerpt ?? null,
        content: data.content,
        blocks: blocksJson,
        imageUrl: data.image_url ?? null,
        metaTitle: data.meta_title ?? null,
        metaDesc: data.meta_desc ?? null,
        publishedAt,
      },
    });

    await prisma.articleTag.deleteMany({ where: { articleId: articleRow.id } });

    const tagNames = data.tags ?? [];
    for (const tagName of tagNames) {
      const tagSlug = slugifyTag(tagName);
      if (!tagSlug) continue;
      const tag = await prisma.tag.upsert({
        where: { siteId_slug: { siteId, slug: tagSlug } },
        create: { siteId, slug: tagSlug, name: tagName },
        update: { name: tagName },
      });
      await prisma.articleTag.create({
        data: { articleId: articleRow.id, tagId: tag.id },
      });
    }

    if (existing) updated += 1;
    else inserted += 1;
  }

  if (!options.skipRevalidate) {
    await triggerRevalidate(["/blog", "/sitemap.xml"]);
  }

  return { inserted, updated, errors, records };
}
