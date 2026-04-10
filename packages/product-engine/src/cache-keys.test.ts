import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const file = join(dirname(fileURLToPath(import.meta.url)), "queries.ts");

describe("unstable_cache keys", () => {
  it("always includes siteId in cache key tuples", () => {
    const src = readFileSync(file, "utf-8");
    expect(src).toContain('["product", siteId, slug]');
    expect(src).toMatch(/"products-category",\s*\n\s*siteId,/);
    expect(src).toContain('["products-by-slugs", siteId,');
    expect(src).toContain('["article", siteId,');
    expect(src).toContain('["blog-list", siteId,');
  });
});
