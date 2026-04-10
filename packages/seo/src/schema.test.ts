import { describe, expect, it } from "vitest";
import { faqSchema, productSchema } from "./schema";
import type { SiteConfig } from "./types";

const site: SiteConfig = {
  id: "x",
  name: "T",
  domain: "https://example.com",
  locale: "fr_FR",
  language: "fr",
  theme: {
    primaryColor: "#000",
    secondaryColor: "#111",
    font: "Inter",
    logo: "/l.svg",
    favicon: "/f.svg",
  },
  affiliate: { network: "a", tag: "t", disclaimer: "d" },
  nav: [],
  seo: {
    siteName: "T",
    defaultTitle: "T",
    defaultDescription: "D",
  },
  features: { search: true, blog: true, comparatifs: true, ratings: true },
};

describe("productSchema", () => {
  it("includes offers and optional aggregateRating", () => {
    const o = productSchema(
      {
        slug: "p",
        title: "P",
        description: "D",
        images: ["https://example.com/i.jpg"],
        brand: "B",
        price: 10,
        currency: "EUR",
        inStock: true,
        rating: 4.5,
        reviewCount: 12,
      },
      site
    ) as { offers: { price: number }; aggregateRating?: { ratingValue: number } };
    expect(o.offers.price).toBe(10);
    expect(o.aggregateRating?.ratingValue).toBe(4.5);
  });
});

describe("faqSchema", () => {
  it("maps items to Question entities", () => {
    const o = faqSchema([{ question: "Q?", answer: "A." }]) as {
      mainEntity: { name: string }[];
    };
    expect(o.mainEntity[0]?.name).toBe("Q?");
  });
});
