# Cahier des Charges Technique — Plateforme Multi-Sites d'Affiliation SEO

> **Version** : 6.0 — finale  
> **Date** : Avril 2026  
> **Destination** : Développeur / Agence technique

---

## Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Contraintes techniques](#2-contraintes-techniques)
3. [Vue d'ensemble de l'architecture](#3-vue-densemble-de-larchitecture)
4. [Structure du monorepo](#4-structure-du-monorepo)
5. [Configuration par site](#5-configuration-par-site)
6. [Base de données](#6-base-de-données)
7. [Format des fichiers JSON](#7-format-des-fichiers-json)
8. [Pipeline d'import](#8-pipeline-dimport)
9. [Moteur de contenu et blocs dynamiques](#9-moteur-de-contenu-et-blocs-dynamiques)
10. [Pages à générer](#10-pages-à-générer)
11. [SEO technique](#11-seo-technique)
12. [Sécurité](#12-sécurité)
13. [Performance et cache](#13-performance-et-cache)
14. [Déploiement et infrastructure](#14-déploiement-et-infrastructure)
15. [CI/CD](#15-cicd)
16. [Conventions de développement](#16-conventions-de-développement)
17. [Stack technique récapitulatif](#17-stack-technique-récapitulatif)
18. [Coûts estimés](#18-coûts-estimés)
19. [Phases de développement](#19-phases-de-développement)
20. [Évolutions futures](#20-évolutions-futures)

---

## 1. Contexte et objectifs

Le projet consiste à créer et opérer **une dizaine de sites d'affiliation** couvrant des univers produits variés (jeux, jouets, électroménager, décoration, jardin, etc.). L'acquisition de trafic est exclusivement basée sur le **référencement naturel (SEO)**.

### Objectifs techniques

- Développer et maintenir les 10 sites **en parallèle** depuis une base de code unique
- Permettre l'ajout d'un nouveau site **en moins d'une heure**
- Supporter des catalogues allant de **100 à 50 000+ produits** par site
- Atteindre jusqu'à **400 000 produits** et **50 000 pages SEO** sur l'ensemble de la plateforme
- Garantir des performances optimales (**Core Web Vitals**)
- Assurer une **scalabilité horizontale** sans refonte architecturale

---

## 2. Contraintes techniques

### Ce qui est explicitement exclu

- Pas de WordPress ni CMS classique
- Pas de CMS headless (Strapi, Directus, Contentful, etc.)
- Pas de fichiers MDX

### Sources de données

Une seule et unique source : **des fichiers JSON**.

- Les produits sont décrits en JSON
- Le contenu éditorial (articles, guides, comparatifs) est en JSON avec le corps du texte en **Markdown**
- Ces fichiers JSON sont versionnés dans Git sous `/data/`

Le pipeline importe ces fichiers JSON vers PostgreSQL. Next.js lit exclusivement la base de données — jamais les fichiers JSON directement.

---

## 3. Vue d'ensemble de l'architecture

```
┌──────────────────────────────────────────────────────┐
│               /data/ (Git)                           │
│   JSON produits + JSON articles (contenu Markdown)   │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│           Pipeline d'import (Node.js / TypeScript)   │
│      Validation Zod → Transformation → Upsert        │
└──────────┬───────────────────────────────────────────┘
           │                        │
           ▼                        ▼
┌──────────────────┐   ┌────────────────────────────────┐
│   PostgreSQL     │   │         Meilisearch             │
│   (Supabase)     │   │  1 index global "products"     │
│   isolé par      │   │  filtré par siteId             │
│   site_id        │   └────────────────────────────────┘
└──────────┬───────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│               Next.js — App Router                   │
│   SSG (pages prioritaires) + ISR (reste du catalogue)│
│   unstable_cache — clés préfixées par siteId         │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                    Vercel                             │
│        10 projets — CDN global — domaines            │
└──────────────────────────────────────────────────────┘
```

---

## 4. Structure du monorepo

### Outil : Turborepo + pnpm

```
affiliate-platform/
│
├── apps/
│   ├── site-jeux-jouets/
│   ├── site-electromenager/
│   ├── site-deco/
│   ├── site-jardin/
│   └── ... (x10)
│
├── packages/
│   ├── ui/                  # Composants React partagés
│   ├── seo/                 # Meta, structured data, sitemap, robots
│   ├── db/                  # Schéma Prisma + requêtes partagées
│   ├── content-engine/      # Parser Markdown + moteur de blocs
│   ├── product-engine/      # Logique produits, filtres, tri
│   ├── pipeline/            # Script d'import JSON → PostgreSQL
│   └── search/              # Intégration Meilisearch
│
├── data/
│   ├── jeux-jouets/
│   │   ├── products.json
│   │   └── articles.json
│   ├── electromenager/
│   │   ├── products.json
│   │   └── articles.json
│   └── ...
│
├── scripts/
│   ├── import-products.ts
│   ├── validate-content.ts
│   └── build-search-index.ts
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Principe de chaque app

```
apps/site-jeux-jouets/
├── config.ts         # L'ADN du site — seul fichier obligatoire
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── next.config.js
└── package.json
```

Tout le code métier réside dans `/packages/`. Ajouter un nouveau site = créer ce dossier et remplir `config.ts`.

---

## 5. Configuration par site

```typescript
// apps/site-jeux-jouets/config.ts

export const siteConfig = {
  id: "site-jeux-jouets",
  name: "MonSiteJeux",
  domain: "https://www.monsite-jeux.fr",
  locale: "fr_FR",
  language: "fr",

  theme: {
    primaryColor: "#FF5733",
    secondaryColor: "#2C3E50",
    font: "Inter",
    logo: "/logo.svg",
    favicon: "/favicon.ico",
  },

  affiliate: {
    network: "amazon",
    tag: "monsite-jeux-21",
    disclaimer: "En tant que partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises.",
  },

  nav: [
    { label: "Jeux de société", slug: "jeux-de-societe" },
    { label: "Jeux vidéo", slug: "jeux-video" },
    { label: "Comparatifs", slug: "comparatifs" },
    { label: "Blog", slug: "blog" },
  ],

  seo: {
    siteName: "MonSiteJeux",
    defaultTitle: "MonSiteJeux — Les meilleurs jeux sélectionnés",
    defaultDescription: "Découvrez notre sélection de jeux testés et approuvés.",
    twitterHandle: "@monsite_jeux",
  },

  features: {
    search: true,
    blog: true,
    comparatifs: true,
    ratings: true,
  },
};
```

---

## 6. Base de données

### Moteur : PostgreSQL via Supabase

Une seule instance PostgreSQL pour tous les sites. L'isolation est assurée par le champ `site_id` présent dans chaque table et chaque requête sans exception.

### Schéma Prisma

```prisma
// packages/db/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id           String   @id @default(cuid())
  siteId       String   @map("site_id")
  slug         String
  title        String
  description  String?  @db.Text
  content      String?  @db.Text
  price        Float?
  priceOld     Float?   @map("price_old")
  currency     String   @default("EUR")
  affiliateUrl String   @map("affiliate_url")
  images       String[]
  inStock      Boolean  @default(true) @map("in_stock")
  rating       Float?
  reviewCount  Int?     @map("review_count")
  brand        String?
  ean          String?
  metaTitle    String?  @map("meta_title")
  metaDesc     String?  @map("meta_desc")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  categories   ProductCategory[]
  clicks       AffiliateClick[]

  @@unique([siteId, slug])
  @@index([siteId])
  @@index([siteId, inStock])
  @@index([siteId, rating])
  @@index([siteId, brand])
  @@map("products")
}

model Category {
  id          String   @id @default(cuid())
  siteId      String   @map("site_id")
  slug        String
  name        String
  // Chemin hiérarchique — ex: "jeux/lego/technic"
  // Index text_pattern_ops requis pour les requêtes LIKE/startsWith
  path        String
  description String?  @db.Text
  parentId    String?  @map("parent_id")
  metaTitle   String?  @map("meta_title")
  metaDesc    String?  @map("meta_desc")
  imageUrl    String?  @map("image_url")
  sortOrder   Int      @default(0) @map("sort_order")

  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  products    ProductCategory[]

  @@unique([siteId, slug])
  @@index([siteId])
  @@index([siteId, path])
  @@map("categories")
}

model ProductCategory {
  productId  String @map("product_id")
  categoryId String @map("category_id")

  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([productId, categoryId])
  @@map("product_categories")
}

model Article {
  id          String    @id @default(cuid())
  siteId      String    @map("site_id")
  type        String    @default("article")  // "article" | "comparatif" | "guide"
  slug        String
  title       String
  excerpt     String?
  content     String    @db.Text
  blocks      Json?
  imageUrl    String?   @map("image_url")
  metaTitle   String?   @map("meta_title")
  metaDesc    String?   @map("meta_desc")
  publishedAt DateTime? @map("published_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  tags        ArticleTag[]

  @@unique([siteId, slug])
  @@index([siteId])
  @@index([siteId, type])
  @@index([siteId, publishedAt])
  @@map("articles")
}

model Tag {
  id       String     @id @default(cuid())
  siteId   String     @map("site_id")
  slug     String
  name     String
  articles ArticleTag[]

  @@unique([siteId, slug])
  @@map("tags")
}

model ArticleTag {
  articleId String @map("article_id")
  tagId     String @map("tag_id")

  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([articleId, tagId])
  @@map("article_tags")
}

// Tracking des clics affiliés
// Volume estimé : ~3,6M rows/an à 10k clics/jour
// Partitionner par mois si le volume dépasse 10M rows
model AffiliateClick {
  id        String   @id @default(cuid())
  siteId    String   @map("site_id")
  productId String   @map("product_id")
  timestamp DateTime @default(now())
  referrer  String?
  userAgent String?  @map("user_agent")

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([siteId])
  @@index([siteId, productId])
  @@index([siteId, timestamp])  // permet les agrégations par période
  @@map("affiliate_clicks")
}

model ImportLog {
  id        String   @id @default(cuid())
  siteId    String   @map("site_id")
  filename  String
  status    String   // "success" | "partial" | "error"
  inserted  Int      @default(0)
  updated   Int      @default(0)
  errors    Int      @default(0)
  details   Json?
  createdAt DateTime @default(now()) @map("created_at")

  @@index([siteId])
  @@map("import_logs")
}
```

### Index supplémentaire — obligatoire après migration Prisma

L'index standard de Prisma sur `path` ne supporte pas les requêtes de préfixe (`LIKE 'jeux/lego%'` ou `startsWith`). Un index `text_pattern_ops` doit être créé manuellement via une migration SQL :

```sql
-- Migration à jouer après prisma migrate
CREATE INDEX idx_category_path_prefix
ON categories (site_id, path text_pattern_ops);
```

Sans cet index, PostgreSQL effectue un scan complet de la table sur toute requête hiérarchique, ce qui devient critique à 50 000 catégories.

### Utilisation du champ `path`

```typescript
// Toutes les sous-catégories de "jeux/lego"
const subcategories = await prisma.category.findMany({
  where: { siteId, path: { startsWith: "jeux/lego" } },
});

// Fil d'Ariane depuis le path
function buildBreadcrumb(path: string): string[] {
  // "jeux/lego/technic" → ["jeux", "jeux/lego", "jeux/lego/technic"]
  return path.split("/").map((_, i, arr) => arr.slice(0, i + 1).join("/"));
}
```

---

## 7. Format des fichiers JSON

### Produits — `data/{site}/products.json`

```json
{
  "site": "site-jeux-jouets",
  "type": "products",
  "version": "1.0",
  "generated_at": "2026-04-10T12:00:00Z",
  "products": [
    {
      "slug": "lego-technic-bugatti",
      "title": "LEGO Technic Bugatti Chiron",
      "description": "Description courte visible dans les listings.",
      "content": "## Présentation\n\nLe set LEGO Technic Bugatti Chiron est...",
      "price": 129.99,
      "price_old": 149.99,
      "currency": "EUR",
      "affiliate_url": "https://amzn.to/xxxxx",
      "images": ["https://cdn.example.com/lego-bugatti-1.jpg"],
      "in_stock": true,
      "rating": 4.7,
      "review_count": 230,
      "brand": "LEGO",
      "ean": "5702016370379",
      "categories": ["jeux/lego/technic", "jeux/construction"],
      "meta_title": "LEGO Technic Bugatti Chiron — Prix & Avis | MonSiteJeux",
      "meta_desc": "Découvrez le LEGO Technic Bugatti Chiron à partir de 129,99€."
    }
  ]
}
```

### Articles — `data/{site}/articles.json`

```json
{
  "site": "site-jeux-jouets",
  "type": "articles",
  "articles": [
    {
      "slug": "meilleurs-jeux-5-ans",
      "type": "article",
      "title": "Les meilleurs jeux pour enfants de 5 ans",
      "excerpt": "Choisir un jeu pour un enfant de 5 ans peut être difficile...",
      "content": "## Comment choisir\n\nVoici les critères importants...",
      "blocks": [
        { "type": "product_list", "category": "jeux/enfants/5-ans", "limit": 10, "sort": "rating" },
        { "type": "cta_block", "text": "Voir toute la sélection", "url": "/categorie/jeux/enfants/5-ans" }
      ],
      "image_url": "https://cdn.example.com/jeux-5-ans.jpg",
      "published_at": "2026-03-15T08:00:00Z",
      "tags": ["enfants", "5-ans"],
      "meta_title": "Top Jeux Enfant 5 Ans 2026",
      "meta_desc": "Découvrez les meilleurs jeux pour enfants de 5 ans."
    },
    {
      "slug": "meilleurs-lego-technic",
      "type": "comparatif",
      "title": "Meilleurs LEGO Technic — Comparatif 2026",
      "excerpt": "Notre comparatif des meilleurs sets LEGO Technic.",
      "content": "## Notre méthodologie\n\nNous avons testé...",
      "blocks": [
        {
          "type": "comparison_table",
          "products": ["lego-technic-bugatti", "lego-technic-ford-gt"],
          "criteria": ["prix", "nombre_de_pieces", "difficulte", "age_recommande"]
        },
        {
          "type": "faq",
          "items": [
            { "question": "Quel LEGO Technic pour débutant ?", "answer": "Nous recommandons le set 42154..." },
            { "question": "À partir de quel âge ?", "answer": "La plupart des sets Technic sont recommandés dès 10 ans." }
          ]
        }
      ],
      "image_url": "https://cdn.example.com/lego-technic.jpg",
      "published_at": "2026-04-01T08:00:00Z",
      "tags": ["lego", "technic", "comparatif"],
      "meta_title": "Meilleurs LEGO Technic 2026 — Comparatif",
      "meta_desc": "Quel LEGO Technic choisir en 2026 ? Notre comparatif complet."
    }
  ]
}
```

---

## 8. Pipeline d'import

### Localisation : `packages/pipeline/`

### Commandes disponibles

```bash
pnpm pipeline import --site site-jeux-jouets --type products
pnpm pipeline import --site site-jeux-jouets --type articles
pnpm pipeline import --site site-jeux-jouets --type all
pnpm pipeline import --site site-jeux-jouets --type all --dry-run
pnpm pipeline validate --site site-jeux-jouets
pnpm pipeline index --site site-jeux-jouets
```

### Comportement attendu

1. Lire le fichier JSON depuis `/data/{site}/`
2. Valider la structure avec **Zod**
3. Transformer les données au format Prisma
4. **Upsert** dans PostgreSQL
5. Ré-indexer dans **Meilisearch**
6. Déclencher la **revalidation ISR** via `/api/revalidate`
7. Logger dans `import_logs`

### Gestion des erreurs

- Un enregistrement invalide ne bloque pas les autres
- Code de retour non-zéro si taux d'erreur > 10%
- Rapport final : `X insérés, Y mis à jour, Z erreurs`

### Validation Zod

```typescript
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

export const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("product_list"), category: z.string(), limit: z.number().int().positive(), sort: z.string().optional() }),
  z.object({ type: z.literal("product_grid"), category: z.string(), limit: z.number().int().positive() }),
  z.object({ type: z.literal("comparison_table"), products: z.array(z.string()), criteria: z.array(z.string()) }),
  z.object({ type: z.literal("cta_block"), text: z.string(), url: z.string() }),
  z.object({ type: z.literal("faq"), items: z.array(FaqItemSchema).min(1) }),
]);
```

---

## 9. Moteur de contenu et blocs dynamiques

### Localisation : `packages/content-engine/`

### Pipeline de rendu

```
Article (JSON en base)
  → Parsing Markdown → HTML sanitisé
  → Interprétation des blocs dynamiques
  → Injection des données produits depuis PostgreSQL
  → Assemblage des composants React
  → Page HTML finale générée côté serveur
```

### Types de blocs supportés

| Type | Description |
|---|---|
| `product_list` | Liste de produits d'une catégorie, triés et limités |
| `product_grid` | Grille visuelle de produits |
| `comparison_table` | Tableau comparatif de produits sélectionnés |
| `cta_block` | Bouton d'appel à l'action |
| `faq` | Questions/Réponses — génère aussi le structured data FAQPage |

```typescript
export async function renderBlock(block: Block, siteId: string) {
  switch (block.type) {
    case "product_list":
      const products = await getProductsByCategory(siteId, block.category, {
        limit: block.limit,
        sort: block.sort ?? "rating",
        inStockOnly: true,
      });
      return <ProductList products={products} />;

    case "comparison_table":
      const compared = await getProductsBySlugs(siteId, block.products);
      return <ComparisonTable products={compared} criteria={block.criteria} />;

    case "faq":
      return <FaqBlock items={block.items} />;

    case "cta_block":
      return <CtaBlock text={block.text} url={block.url} />;

    default:
      return null;
  }
}
```

---

## 10. Pages à générer

| Route | Type | Revalidation | Description |
|---|---|---|---|
| `/` | SSG | ISR 1h | Page d'accueil |
| `/categorie/[...path]` | SSG + ISR | voir §13 | Catégorie et sous-catégories |
| `/categorie/[...path]?page=N` | ISR | 1h | Pagination |
| `/produit/[slug]` | SSG + ISR | voir §13 | Fiche produit |
| `/comparatif/[slug]` | SSG | ISR 24h | Page comparatif |
| `/blog` | SSG | ISR 1h | Liste des articles |
| `/blog/[slug]` | SSG | ISR 24h | Article |
| `/recherche` | Client | — | Résultats Meilisearch |
| `/sitemap.xml` | Dynamique | — | Index des sitemaps |
| `/sitemap-products-[n].xml` | Dynamique | — | Sitemap produits paginé |
| `/sitemap-categories.xml` | Dynamique | — | Sitemap catégories |
| `/sitemap-articles.xml` | Dynamique | — | Sitemap articles |
| `/robots.txt` | Dynamique | — | Robots |

### Pagination SEO — rel=prev/next obligatoire

```typescript
export async function generateMetadata({ params, searchParams }) {
  const page = Number(searchParams.page ?? 1);
  const slug = params.path.join("/");
  return {
    alternates: {
      canonical: `${site.domain}/categorie/${slug}`,
      ...(page > 1 && { prev: `/categorie/${slug}?page=${page - 1}` }),
      ...(hasNextPage && { next: `/categorie/${slug}?page=${page + 1}` }),
    },
  };
}
```

---

## 11. SEO technique

### Balises meta dynamiques

```typescript
export function generateProductMeta(product: Product, site: SiteConfig) {
  return {
    title: product.metaTitle ?? `${product.title} | ${site.seo.siteName}`,
    description: product.metaDesc ?? product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: [{ url: product.images[0] }],
      siteName: site.seo.siteName,
      locale: site.locale,
      type: "website",
    },
    robots: product.inStock ? "index, follow" : "noindex, follow",
    alternates: {
      canonical: `${site.domain}/produit/${product.slug}`,
    },
  };
}
```

### Canonical catégories

La canonical d'une page catégorie pointe toujours vers son propre path. Pas de logique d'extraction ou de redirection vers un parent — chaque URL canonicalise sur elle-même :

```typescript
export function generateCategoryMeta(category: Category, site: SiteConfig) {
  return {
    title: category.metaTitle ?? `${category.name} | ${site.seo.siteName}`,
    description: category.metaDesc ?? category.description,
    robots: category.description ? "index, follow" : "noindex, follow",
    alternates: {
      // Canonical = l'URL actuelle, toujours
      canonical: `${site.domain}/categorie/${category.path}`,
    },
  };
}
```

### Filtres en noindex — obligatoire

Les URLs avec paramètres de filtre (`?brand=lego`, `?price=50-100`, `?rating=4`) doivent être en `noindex` avec canonical vers la catégorie parente. Sans cette règle, Google indexe des milliers de combinaisons qui cannibalisent les vraies pages catégories.

```typescript
export async function generateMetadata({ params, searchParams }) {
  const hasFilters = Object.keys(searchParams).some((key) =>
    ["brand", "price", "rating", "sort"].includes(key)
  );

  if (hasFilters) {
    return {
      robots: "noindex, follow",
      alternates: {
        canonical: `${site.domain}/categorie/${params.path.join("/")}`,
      },
    };
  }
  // meta normales si pas de filtres
}
```

### Structured Data (Schema.org)

#### Product

```typescript
export function productSchema(product: Product, site: SiteConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${site.domain}/produit/${product.slug}`,
    },
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
    }),
  };
}
```

#### BreadcrumbList — obligatoire sur toutes les pages

```typescript
export function breadcrumbSchema(
  path: string,
  site: SiteConfig,
  categories: Category[]
) {
  // path = "jeux/lego/technic"
  // → génère 3 niveaux de breadcrumb
  const segments = buildBreadcrumb(path); // ["jeux", "jeux/lego", "jeux/lego/technic"]

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: site.domain,
      },
      ...segments.map((seg, i) => {
        const cat = categories.find((c) => c.path === seg);
        return {
          "@type": "ListItem",
          position: i + 2,
          name: cat?.name ?? seg,
          item: `${site.domain}/categorie/${seg}`,
        };
      }),
    ],
  };
}
```

#### FAQPage — pour comparatifs et guides

Généré automatiquement quand un article contient un bloc `faq` :

```typescript
export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
```

#### Article

```typescript
export function articleSchema(article: Article, site: SiteConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.imageUrl,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    publisher: {
      "@type": "Organization",
      name: site.seo.siteName,
      url: site.domain,
    },
  };
}
```

### Sitemap paginé

Google limite chaque fichier sitemap à **50 000 URLs**. Les sitemaps produits sont obligatoirement découpés et numérotés. Chaque entrée inclut `<lastmod>` pour indiquer à Google la date de dernière modification.

```typescript
// app/sitemap.xml/route.ts — index des sitemaps
export async function GET() {
  const totalProducts = await prisma.product.count({ where: { siteId } });
  const totalSitemaps = Math.ceil(totalProducts / 50000);

  const sitemaps = [
    { loc: `${site.domain}/sitemap-categories.xml` },
    { loc: `${site.domain}/sitemap-articles.xml` },
    ...Array.from({ length: totalSitemaps }, (_, i) => ({
      loc: `${site.domain}/sitemap-products-${i + 1}.xml`,
    })),
  ];

  return new Response(renderSitemapIndex(sitemaps), {
    headers: { "Content-Type": "application/xml" },
  });
}

// app/sitemap-products-[n].xml/route.ts
export async function GET(request: Request, { params }) {
  const page = Number(params.n);
  const products = await prisma.product.findMany({
    where: { siteId, inStock: true },
    select: { slug: true, updatedAt: true },
    take: 50000,
    skip: (page - 1) * 50000,
    orderBy: { updatedAt: "desc" },
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${products.map((p) => `
  <url>
    <loc>${site.domain}/produit/${p.slug}</loc>
    <lastmod>${p.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
```

---

## 12. Sécurité

### Variables d'environnement

```bash
# .env.local — jamais commité dans Git
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
MEILISEARCH_HOST="https://..."
MEILISEARCH_API_KEY="..."
REVALIDATE_SECRET="token-aleatoire-minimum-32-caracteres"
```

Un fichier `.env.example` avec des valeurs vides est commité à la place.

### Endpoint de revalidation sécurisé

```typescript
// app/api/revalidate/route.ts
export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { path } = await request.json();
  revalidatePath(path);
  return Response.json({ revalidated: true });
}
```

### Protection et tracking des liens affiliés

Les URLs d'affiliation ne sont **jamais exposées dans le HTML source** :

```typescript
// app/api/go/[slug]/route.ts
export async function GET(request: Request, { params }) {
  const product = await getProductBySlug(siteId, params.slug);
  if (!product) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.affiliateClick.create({
    data: {
      siteId,
      productId: product.id,
      referrer: request.headers.get("referer") ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
    },
  });

  return Response.redirect(product.affiliateUrl, 302);
}
```

```html
<a href="/api/go/lego-technic-bugatti"
   rel="nofollow sponsored"
   target="_blank"
   referrerpolicy="no-referrer-when-downgrade">
  Voir le prix
</a>
```

### Sanitisation du Markdown

```typescript
import { remark } from "remark";
import remarkHtml from "remark-html";
import sanitizeHtml from "sanitize-html";

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(remarkHtml).process(markdown);
  return sanitizeHtml(result.toString(), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt"],
    },
  });
}
```

### Headers de sécurité HTTP

```javascript
// next.config.js
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

module.exports = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

### Rate limiting

Les endpoints `/api/go/` et `/api/revalidate` sont protégés par **Upstash Rate Limit**.

### Proxy et CDN des images produits

**Option A — Next.js `remotePatterns` (recommandé pour démarrer)**

```javascript
module.exports = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "cdn.example.com" },
    ],
  },
};
```

**Option B — CDN propre via BunnyCDN ou Cloudflare (recommandé à grande échelle)**

Les images sont servies depuis `cdn.tonsite.com`. Protège des rate limits et des URLs expirées des CDN affilieurs.

---

## 13. Performance et cache

### Objectifs Core Web Vitals

| Métrique | Cible |
|---|---|
| LCP | < 2.5s |
| INP | < 100ms |
| CLS | < 0.1 |

### Stratégie de build à grande échelle

Générer 50 000 pages au build est impraticable. La stratégie est la suivante :

**Au build — SSG uniquement sur les pages prioritaires :**

```typescript
// app/produit/[slug]/page.tsx
export async function generateStaticParams() {
  // Pre-générer uniquement les 500 produits les mieux notés
  // Le reste sera généré à la première visite par ISR
  const topProducts = await prisma.product.findMany({
    where: { siteId, inStock: true },
    orderBy: { rating: "desc" },
    take: 500,
    select: { slug: true },
  });
  return topProducts.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = true; // autorise les slugs non pré-générés
export const revalidate = 86400;   // ISR 24h pour tout le reste
```

Cette stratégie divise le temps de build par 100 pour un catalogue de 50 000 produits.

### Cache DB — règle critique : siteId dans toutes les clés

Deux sites qui partagent une clé de cache identique se retrouvent à servir les données de l'autre. Le `siteId` doit être présent dans **toutes les clés sans exception**.

```typescript
// packages/db/src/queries.ts
import { unstable_cache } from "next/cache";

export const getProduct = unstable_cache(
  async (siteId: string, slug: string) => {
    return prisma.product.findFirst({
      where: { siteId, slug, inStock: true },
      include: { categories: { include: { category: true } } },
    });
  },
  // ✅ siteId dans la clé — isolation garantie entre sites
  ["product", siteId, slug],
  { revalidate: 86400 }
);

export const getProductsByCategory = unstable_cache(
  async (siteId: string, categoryPath: string, page: number) => {
    return prisma.product.findMany({
      where: {
        siteId,
        inStock: true,
        categories: {
          some: { category: { path: { startsWith: categoryPath } } },
        },
      },
      take: 24,
      skip: (page - 1) * 24,
      orderBy: { rating: "desc" },
    });
  },
  // ✅ siteId + categoryPath + page dans la clé
  ["products-category", siteId, categoryPath, String(page)],
  { revalidate: 3600 }
);

// ❌ NE JAMAIS FAIRE — clé sans siteId
// ["product", slug] → slug identique sur deux sites = données mélangées
```

### Règles images

- Toujours via `next/image` — jamais de `<img>` native
- Attribut `priority` sur la première image visible
- Dimensions toujours spécifiées pour éviter le CLS

### Règles scripts et polices

- `next/font` uniquement — jamais d'import CSS externe
- Scripts tiers en `strategy="lazyOnload"` via `next/script`

### Meilisearch — index global

```typescript
export async function searchProducts(siteId: string, query: string) {
  return index.search(query, {
    filter: `siteId = "${siteId}"`,
    attributesToRetrieve: ["slug", "title", "price", "images", "rating"],
    limit: 20,
  });
}
```

```typescript
await index.updateSettings({
  filterableAttributes: ["siteId", "categories", "inStock", "brand"],
  sortableAttributes: ["price", "rating", "createdAt"],
  searchableAttributes: ["title", "description", "brand"],
});
```

---

## 14. Déploiement et infrastructure

### Principe

Un seul monorepo → **10 projets Vercel distincts**. Turborepo gère les builds incrémentaux.

```
GitHub (monorepo)
  ├── Vercel "site-jeux"    → apps/site-jeux    → jeux.fr
  ├── Vercel "site-deco"    → apps/site-deco    → deco.fr
  └── ...
```

### Configuration Vercel par projet

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=site-jeux",
  "outputDirectory": "apps/site-jeux/.next",
  "installCommand": "pnpm install"
}
```

### Services

| Service | Usage | Hébergement |
|---|---|---|
| PostgreSQL | Base de données centrale | Supabase |
| Meilisearch | Index de recherche global | Railway (self-hosted) |
| Rate limiting | Protection API | Upstash |
| CDN images | Proxy images produits | BunnyCDN ou Cloudflare |
| Frontend x10 | Sites Next.js | Vercel |
| CI/CD | Automatisation | GitHub Actions |

---

## 15. CI/CD

### Workflow de déploiement

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:migrate:deploy
        env:
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
      - run: pnpm turbo build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Workflow d'import manuel

```yaml
# .github/workflows/import.yml
name: Import JSON

on:
  workflow_dispatch:
    inputs:
      site:
        description: "Site ID (ex: site-jeux)"
        required: true
      type:
        description: "products | articles | all"
        default: "all"

jobs:
  import:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm pipeline import --site ${{ inputs.site }} --type ${{ inputs.type }}
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          MEILISEARCH_HOST: ${{ secrets.MEILISEARCH_HOST }}
          MEILISEARCH_API_KEY: ${{ secrets.MEILISEARCH_API_KEY }}
          REVALIDATE_SECRET: ${{ secrets.REVALIDATE_SECRET }}
```

---

## 16. Conventions de développement

### Linting et formatage

```bash
pnpm lint
pnpm format
```

```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn"
  }
}
```

### Conventions de commits

Format **Conventional Commits** obligatoire :

```
feat(pipeline): add dry-run mode
fix(seo): correct canonical on paginated pages
chore(deps): update Next.js to 14.2
```

Types : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`

### Tests

Tests unitaires avec **Vitest**. Couverture minimale obligatoire sur :

- `packages/pipeline/` — validation Zod et transformations
- `packages/seo/` — meta, canonicals, structured data (Product, BreadcrumbList, FAQPage)
- `packages/content-engine/` — rendu des blocs, dont le bloc `faq`
- `packages/db/` — vérification que toutes les clés cache contiennent `siteId`

### TypeScript strict

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

---

## 17. Stack technique récapitulatif

| Couche | Technologie | Rôle |
|---|---|---|
| Monorepo | Turborepo + pnpm | Builds incrémentaux, packages partagés |
| Framework | Next.js 14+ App Router | SSG + ISR + routing |
| Langage | TypeScript strict | Typage fort partout |
| Base de données | PostgreSQL (Supabase) | Données centralisées multi-sites |
| ORM | Prisma | Schémas, migrations, requêtes |
| Cache DB | unstable_cache (clés avec siteId) | Protection PostgreSQL, isolation sites |
| Validation | Zod | Validation des JSON entrants |
| Recherche | Meilisearch (Railway) | Index global filtré par siteId |
| Markdown | remark + rehype + sanitize-html | Rendu et sanitisation |
| CDN images | BunnyCDN / Cloudflare | Proxy indépendant des affilieurs |
| Déploiement | Vercel | ISR natif, CDN global |
| Rate limiting | Upstash | Protection endpoints |
| CI/CD | GitHub Actions | Builds, imports, migrations |
| Tests | Vitest | Tests unitaires packages critiques |
| Linting | ESLint + Prettier | Qualité et cohérence du code |

---

## 18. Coûts estimés

| Service | Plan | Coût mensuel |
|---|---|---|
| Vercel | Pro | ~20 $ |
| Supabase | Pro | ~25 $ |
| Meilisearch | Self-hosted Railway | ~10 $ |
| BunnyCDN | Pay-as-you-go | ~5 $ |
| Upstash | Pay-as-you-go | ~5 $ |
| GitHub | Free | 0 $ |
| **Total** | | **~65 $/mois** |

---

## 19. Phases de développement

### Étape 1 — Fondations
- Setup monorepo Turborepo + pnpm + TypeScript strict
- Configuration ESLint, Prettier, Vitest partagés
- Schéma Prisma complet + migrations initiales
- Index `text_pattern_ops` sur `categories.path`
- Pipeline d'import JSON avec validation Zod
- Premier site pilote bootstrappé

### Étape 2 — Template universel
- Composants UI partagés (ProductCard, CategoryGrid, ComparisonTable, FaqBlock, etc.)
- Pages types : accueil, catégorie avec `[...path]`, fiche produit, comparatif, blog, article
- Pagination SEO avec `rel=prev/next`
- Moteur de blocs dynamiques incluant le bloc `faq`
- Package SEO : meta, canonicals, structured data (Product, BreadcrumbList, FAQPage, Article), sitemap paginé avec `<lastmod>`, robots.txt

### Étape 3 — Recherche, sécurité et performance
- Intégration Meilisearch (index global filtré par siteId)
- Headers HTTP de sécurité
- Endpoint `/api/go/` avec tracking `affiliate_clicks` et rate limiting
- Cache DB avec `unstable_cache` — siteId dans toutes les clés
- Règles noindex sur URLs filtrées
- Stratégie build SSG partiel (top 500) + ISR pour le reste
- Setup CDN images
- Audit Core Web Vitals + Lighthouse

### Étape 4 — Déploiement et CI/CD
- Setup des 10 projets Vercel
- GitHub Actions (build + deploy + import)
- Variables d'environnement par environnement (dev / staging / prod)
- Test de charge pipeline (import 50 000 produits)

### Étape 5 — Déploiement des 10 sites
- Création des `config.ts` pour chaque site
- Import des catalogues JSON initiaux
- Vérification SEO (Search Console, Lighthouse)
- Go live progressif site par site

---

## 20. Évolutions futures

### Architecture multi-domain

L'architecture actuelle (1 app par site) est optimale jusqu'à 15-20 sites. Au-delà, migrer vers une architecture **multi-domain** : une seule app Next.js détecte le site actif via le domaine dans le middleware.

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const siteId = resolveSiteFromDomain(host);
  const response = NextResponse.next();
  response.headers.set("x-site-id", siteId);
  return response;
}
```

L'architecture monorepo actuelle facilite cette migration sans refonte.

### Partitionnement de la table AffiliateClick

À partir de 10M de rows (environ 3 ans à 10k clics/jour), envisager un partitionnement par mois pour maintenir les performances des agrégations analytics.

### Analytics affiliate

La table `affiliate_clicks` constitue la base d'un tableau de bord interne : produits les plus cliqués, taux de clic par catégorie, évolution dans le temps.

---

*Document de référence technique v6.0 — finale. Toute question architecturale doit être soulevée avant le démarrage du développement.*