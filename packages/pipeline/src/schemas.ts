import { z } from "zod";

export const ProductSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  content: z.string().optional(),
  price: z.number().positive().optional(),
  price_old: z.number().positive().optional(),
  currency: z.string().length(3).default("EUR"),
  affiliate_url: z.string().url(),
  images: z.array(z.string().url()).min(1),
  in_stock: z.boolean().default(true),
  rating: z.number().min(0).max(5).optional(),
  review_count: z.number().int().min(0).optional(),
  brand: z.string().optional(),
  ean: z.string().optional(),
  categories: z.array(z.string()).min(1),
  meta_title: z.string().max(70).optional(),
  meta_desc: z.string().max(160).optional(),
});

export const ProductsFileSchema = z.object({
  site: z.string().min(1),
  type: z.literal("products"),
  version: z.string().optional(),
  generated_at: z.string().optional(),
  products: z.array(ProductSchema),
});

export const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("product_list"),
    category: z.string(),
    limit: z.number().int().positive(),
    sort: z.string().optional(),
  }),
  z.object({
    type: z.literal("product_grid"),
    category: z.string(),
    limit: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("comparison_table"),
    products: z.array(z.string()),
    criteria: z.array(z.string()),
  }),
  z.object({
    type: z.literal("cta_block"),
    text: z.string(),
    url: z.string(),
  }),
  z.object({
    type: z.literal("faq"),
    items: z.array(FaqItemSchema).min(1),
  }),
]);

export const ArticleItemSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  type: z.enum(["article", "comparatif", "guide"]).default("article"),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  blocks: z.array(BlockSchema).optional(),
  image_url: z.string().url().optional(),
  published_at: z.string().optional(),
  tags: z.array(z.string()).optional(),
  meta_title: z.string().optional(),
  meta_desc: z.string().optional(),
});

export const ArticlesFileSchema = z.object({
  site: z.string().min(1),
  type: z.literal("articles").optional(),
  articles: z.array(ArticleItemSchema),
});
