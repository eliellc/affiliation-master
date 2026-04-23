import type { SiteConfig } from "@affiliate/seo";
import { ProductCard, type ProductCardProduct } from "./product-card";
import styles from "./product-list.module.css";

export function ProductList(props: { products: ProductCardProduct[]; site: SiteConfig }) {
  return (
    <div className={styles.grid}>
      {props.products.map((p) => (
        <ProductCard key={p.slug} product={p} site={props.site} />
      ))}
    </div>
  );
}
