import Link from "next/link";
import type { SiteConfig } from "@affiliate/seo";
import { RemoteProductImage } from "./remote-product-image";
import styles from "./product-card.module.css";

export type ProductCardProduct = {
  slug: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  images: string[];
  rating: number | null;
  /** Chemin canonique fiche produit, ex. `/jeux-de-societe/mon-jeu` ou `/produit/mon-jeu`. */
  productHref?: string;
};

export function ProductCard(props: { product: ProductCardProduct; site: SiteConfig }) {
  const { product } = props;
  const img = product.images[0];
  return (
    <article className={styles.card}>
      {img ? (
        <RemoteProductImage
          src={img}
          alt={product.title}
          width={280}
          height={280}
          style={{ objectFit: "cover", borderRadius: 8, width: "100%", height: "auto" }}
        />
      ) : null}
      <h3 className={styles.title}>{product.title}</h3>
      {product.description ? <p className={styles.description}>{product.description}</p> : null}
      {product.price != null ? (
        <p className={styles.price}>
          {product.price.toFixed(2)} {product.currency}
        </p>
      ) : null}
      {product.rating != null ? <p className={styles.rating}>★ {product.rating.toFixed(1)}</p> : null}
      <Link className={styles.cta} href={product.productHref ?? `/produit/${product.slug}`}>
        Voir le produit
      </Link>
    </article>
  );
}
