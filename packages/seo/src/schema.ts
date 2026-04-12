import type { SiteConfig } from "./types";

export type ProductSchemaInput = {
  slug: string;
  title: string;
  description: string | null;
  images: string[];
  brand: string | null;
  price: number | null;
  currency: string;
  inStock: boolean;
  rating: number | null;
  reviewCount: number | null;
  /** URL absolue ou chemin sous domaine du site pour l’offre. */
  productUrl?: string;
};

export function productSchema(product: ProductSchemaInput, site: SiteConfig): object {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images,
    ...(product.brand
      ? {
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: product.productUrl ?? `${site.domain}/produit/${product.slug}`,
    },
    ...(product.rating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount ?? 0,
          },
        }
      : {}),
  };
}

export type CategoryRow = { path: string; name: string };

export function breadcrumbSchema(path: string, site: SiteConfig, categories: CategoryRow[]): object {
  const segments = path.split("/").filter(Boolean);
  const crumbs = segments.map((_, i) => segments.slice(0, i + 1).join("/"));

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
      ...crumbs.map((seg, i) => {
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

export function faqSchema(items: { question: string; answer: string }[]): object {
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

export function articleSchema(
  article: {
    title: string;
    excerpt: string | null;
    imageUrl: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
  },
  site: SiteConfig,
  canonicalPath: string
): object {
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
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${site.domain}${canonicalPath}`,
    },
  };
}
