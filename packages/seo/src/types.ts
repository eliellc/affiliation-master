export type NavItem = { label: string; slug: string };

export type SiteConfig = {
  id: string;
  name: string;
  domain: string;
  locale: string;
  language: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    font: string;
    logo: string;
    favicon: string;
  };
  affiliate: {
    network: string;
    tag: string;
    disclaimer: string;
  };
  nav: NavItem[];
  seo: {
    siteName: string;
    defaultTitle: string;
    defaultDescription: string;
    twitterHandle?: string;
  };
  features: {
    search: boolean;
    blog: boolean;
    comparatifs: boolean;
    ratings: boolean;
  };
};

export type CategoryMetaInput = {
  name: string;
  path: string;
  description: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
};

export type ProductMetaInput = {
  slug: string;
  title: string;
  description: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  inStock: boolean;
  images: string[];
  /** Chemin canonique sans domaine, ex. `/accessoires/de-vierge-bois-6cm`. */
  canonicalPath?: string;
};

export type ArticleMetaInput = {
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
};