import type { SiteConfig } from "@affiliate/seo";

export const siteConfig: SiteConfig = {
  id: "site-jeux-jouets",
  name: "MonSiteJeux",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "http://localhost:3000",
  locale: "fr_FR",
  language: "fr",

  theme: {
    primaryColor: "#FF5733",
    secondaryColor: "#2C3E50",
    font: "Inter",
    logo: "/logo.svg",
    favicon: "/logo.svg",
  },


  nav: [
    { label: "Jeux de société", slug: "jeux-de-societe" },
    { label: "Jeux vidéo", slug: "jeux-video" },
    { label: "LEGO", slug: "jeux/lego/technic" },
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
