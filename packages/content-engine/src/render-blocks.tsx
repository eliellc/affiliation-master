import type { ReactNode } from "react";
import type { SiteConfig } from "@affiliate/seo";
import { getProductsByCategory, getProductsBySlugs } from "@affiliate/product-engine";
import { ProductList, ComparisonTable, FaqBlock, CtaBlock } from "@affiliate/ui";
import type { ContentBlock } from "./types";
import { toCardProduct } from "./map-product";

export async function renderBlock(block: ContentBlock, siteId: string, site: SiteConfig) {
  switch (block.type) {
    case "product_list": {
      const { items } = await getProductsByCategory(siteId, block.category, {
        limit: block.limit,
        page: 1,
        sort: block.sort === "price" || block.sort === "createdAt" ? block.sort : "rating",
        inStockOnly: true,
      });
      const products = items.map((p) =>
        toCardProduct(p, { preferredCategoryPath: block.category })
      );
      return <ProductList products={products} site={site} />;
    }
    case "product_grid": {
      const { items } = await getProductsByCategory(siteId, block.category, {
        limit: block.limit,
        page: 1,
        inStockOnly: true,
      });
      const products = items.map((p) =>
        toCardProduct(p, { preferredCategoryPath: block.category })
      );
      return <ProductList products={products} site={site} />;
    }
    case "comparison_table": {
      const rows = await getProductsBySlugs(siteId, block.products);
      const products = rows.map((p) => toCardProduct(p));
      return <ComparisonTable products={products} criteria={block.criteria} />;
    }
    case "faq":
      return <FaqBlock items={block.items} />;
    case "cta_block":
      return <CtaBlock text={block.text} url={block.url} />;
    default:
      return null;
  }
}

export async function renderBlocks(blocks: ContentBlock[], siteId: string, site: SiteConfig) {
  const nodes: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    nodes.push(
      <section key={`block-${i}`}>{await renderBlock(block, siteId, site)}</section>
    );
  }
  return <>{nodes}</>;
}
