import type { SiteConfig } from "@affiliate/seo";

export const siteConfig: SiteConfig = {
  id: "lepiondor",
  name: "Le Pion d'Or",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "http://localhost:3001",
  locale: "fr_FR",
  language: "fr",

  theme: {
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    font: "Inter",
    logo: "/logo.svg",
    favicon: "/logo.svg",
  },

  nav: [],

  seo: {
    siteName: "Le Pion d'Or",
    defaultTitle: "Le Pion d'Or",
    defaultDescription: "",
    twitterHandle: "",
  },

  features: {
    search: true,
    blog: true,
    comparatifs: true,
    ratings: true,
  },
};
