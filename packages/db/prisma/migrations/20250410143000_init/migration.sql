-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "price" DOUBLE PRECISION,
    "price_old" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "affiliate_url" TEXT NOT NULL,
    "images" TEXT[],
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION,
    "review_count" INTEGER,
    "brand" TEXT,
    "ean" TEXT,
    "meta_title" TEXT,
    "meta_desc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "meta_title" TEXT,
    "meta_desc" TEXT,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "product_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'article',
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "blocks" JSONB,
    "image_url" TEXT,
    "meta_title" TEXT,
    "meta_desc" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "article_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id","tag_id")
);

-- CreateTable
CREATE TABLE "affiliate_clicks" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_logs" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "inserted" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_site_id_idx" ON "products"("site_id");

-- CreateIndex
CREATE INDEX "products_site_id_in_stock_idx" ON "products"("site_id", "in_stock");

-- CreateIndex
CREATE INDEX "products_site_id_rating_idx" ON "products"("site_id", "rating");

-- CreateIndex
CREATE INDEX "products_site_id_brand_idx" ON "products"("site_id", "brand");

-- CreateIndex
CREATE UNIQUE INDEX "products_site_id_slug_key" ON "products"("site_id", "slug");

-- CreateIndex
CREATE INDEX "categories_site_id_idx" ON "categories"("site_id");

-- CreateIndex
CREATE INDEX "categories_site_id_path_idx" ON "categories"("site_id", "path");

-- CreateIndex
CREATE UNIQUE INDEX "categories_site_id_path_key" ON "categories"("site_id", "path");

-- CreateIndex
CREATE INDEX "articles_site_id_idx" ON "articles"("site_id");

-- CreateIndex
CREATE INDEX "articles_site_id_type_idx" ON "articles"("site_id", "type");

-- CreateIndex
CREATE INDEX "articles_site_id_published_at_idx" ON "articles"("site_id", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "articles_site_id_slug_key" ON "articles"("site_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_site_id_slug_key" ON "tags"("site_id", "slug");

-- CreateIndex
CREATE INDEX "affiliate_clicks_site_id_idx" ON "affiliate_clicks"("site_id");

-- CreateIndex
CREATE INDEX "affiliate_clicks_site_id_product_id_idx" ON "affiliate_clicks"("site_id", "product_id");

-- CreateIndex
CREATE INDEX "affiliate_clicks_site_id_timestamp_idx" ON "affiliate_clicks"("site_id", "timestamp");

-- CreateIndex
CREATE INDEX "import_logs_site_id_idx" ON "import_logs"("site_id");

-- Prefix queries on category path (LIKE 'foo%')
CREATE INDEX "idx_category_path_prefix" ON "categories" ("site_id", "path" text_pattern_ops);

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
