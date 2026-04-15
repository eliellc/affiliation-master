import type { SiteConfig } from "@affiliate/seo";

export const siteConfig: SiteConfig = {
  id: "lepiondor",
  name: "Le Pion d'Or",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "http://localhost:3001",
  locale: "fr_FR",
  language: "fr",

  theme: {
    primaryColor: "#b8860b",
    secondaryColor: "#1a3d2e",
    font: "Inter",
    logo: "/logo.svg",
    favicon: "/logo.svg",
  },

  affiliate: {
    network: "amazon",
    tag: "lepiondor-21",
    disclaimer:
      "Le Pion d'Or, passionné de jeux depuis toujours.",
  },

  // Slugs = chemins racine réels dans les catégories importées (products.json → ensureCategoryPaths).
  // « jeux-de-cartes » seul n’existe pas en base ; l’arborescence catalogue utilise jeux-de-cartes-a-collectionner.
  nav: [
    { label: "Jeux de société", slug: "jeux-de-societe" },
    { label: "Jeux de cartes", slug: "jeux-de-cartes-a-collectionner" },
    { label: "Jeux pour enfants", slug: "jeux-enfants" },
  ],

  seo: {
    siteName: "Le Pion d'Or",
    defaultTitle: "Le Pion d'Or — Jeux de société et sélections",
    defaultDescription:
      "Conseils, comparatifs et idées cadeaux autour des jeux de société et des jeux de cartes.",
    twitterHandle: "@lepiondor",
  },

  features: {
    search: true,
    blog: true,
    comparatifs: true,
    ratings: true,
  },
};
