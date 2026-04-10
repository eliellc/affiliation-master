import type { SiteConfig } from "@affiliate/seo";
import { ProductCard, type ProductCardProduct } from "./product-card";

export function ProductList(props: { products: ProductCardProduct[]; site: SiteConfig }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 16,
      }}
    >
      {props.products.map((p) => (
        <ProductCard key={p.slug} product={p} site={props.site} />
      ))}
    </div>
  );
}
