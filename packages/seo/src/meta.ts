import type { Metadata } from "next";
import type { ArticleMetaInput, CategoryMetaInput, ProductMetaInput, SiteConfig } from "./types";

export function generateProductMeta(product: ProductMetaInput, site: SiteConfig): Metadata {
  return {
    title: product.metaTitle ?? `${product.title} | ${site.seo.siteName}`,
    description: product.metaDesc ?? product.description ?? undefined,
    robots: product.inStock ? "index, follow" : "noindex, follow",
    openGraph: {
      title: product.title,
      description: product.description ?? undefined,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
      siteName: site.seo.siteName,
      locale: site.locale,
      type: "website",
    },
    alternates: {
      canonical: `${site.domain}/produit/${product.slug}`,
    },
  };
}

export function generateCategoryMeta(category: CategoryMetaInput, site: SiteConfig): Metadata {
  return {
    title: category.metaTitle ?? `${category.name} | ${site.seo.siteName}`,
    description: category.metaDesc ?? category.description ?? undefined,
    robots: category.description ? "index, follow" : "noindex, follow",
    alternates: {
      canonical: `${site.domain}/categorie/${category.path}`,
    },
  };
}

export function generateCategoryFilteredMeta(site: SiteConfig, categoryPath: string): Metadata {
  return {
    robots: "noindex, follow",
    alternates: {
      canonical: `${site.domain}/categorie/${categoryPath}`,
    },
  };
}

export function categoryPageMetadata(
  site: SiteConfig,
  categoryPath: string,
  categoryName: string,
  categoryDescription: string | null,
  categoryMetaTitle: string | null,
  categoryMetaDesc: string | null,
  hasFilters: boolean
): Metadata {
  if (hasFilters) {
    return generateCategoryFilteredMeta(site, categoryPath);
  }
  return generateCategoryMeta(
    {
      name: categoryName,
      path: categoryPath,
      description: categoryDescription,
      metaTitle: categoryMetaTitle,
      metaDesc: categoryMetaDesc,
    },
    site
  );
}

export function generateArticleMeta(article: ArticleMetaInput, site: SiteConfig, path: string): Metadata {
  return {
    title: `${article.title} | ${site.seo.siteName}`,
    description: article.excerpt ?? undefined,
    alternates: {
      canonical: `${site.domain}${path}`,
    },
    openGraph: article.imageUrl
      ? {
          title: article.title,
          description: article.excerpt ?? undefined,
          images: [{ url: article.imageUrl }],
          siteName: site.seo.siteName,
          locale: site.locale,
          type: "article",
        }
      : undefined,
  };
}

export function homeMetadata(site: SiteConfig): Metadata {
  return {
    title: site.seo.defaultTitle,
    description: site.seo.defaultDescription,
    alternates: { canonical: site.domain },
    openGraph: {
      siteName: site.seo.siteName,
      locale: site.locale,
      title: site.seo.defaultTitle,
      description: site.seo.defaultDescription,
      type: "website",
    },
  };
}
