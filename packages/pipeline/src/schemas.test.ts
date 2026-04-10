import { describe, expect, it } from "vitest";
import { ProductSchema, ProductsFileSchema } from "./schemas";

describe("ProductSchema", () => {
  it("accepts a valid product", () => {
    const r = ProductSchema.safeParse({
      slug: "lego-test",
      title: "Test",
      affiliate_url: "https://example.com/x",
      images: ["https://example.com/i.jpg"],
      categories: ["jeux/test"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid slug", () => {
    const r = ProductSchema.safeParse({
      slug: "Bad_Slug",
      title: "Test",
      affiliate_url: "https://example.com/x",
      images: ["https://example.com/i.jpg"],
      categories: ["jeux/test"],
    });
    expect(r.success).toBe(false);
  });
});

describe("ProductsFileSchema", () => {
  it("parses envelope", () => {
    const r = ProductsFileSchema.safeParse({
      site: "site-a",
      type: "products",
      products: [],
    });
    expect(r.success).toBe(true);
  });
});
