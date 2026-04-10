import Image from "next/image";
import type { SiteConfig } from "@affiliate/seo";

export type ProductCardProduct = {
  slug: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  images: string[];
  rating: number | null;
};

export function ProductCard(props: { product: ProductCardProduct; site: SiteConfig }) {
  const { product, site } = props;
  const img = product.images[0];
  return (
    <article
      style={{
        border: `1px solid ${site.theme.secondaryColor}33`,
        borderRadius: 8,
        padding: 12,
        maxWidth: 320,
      }}
    >
      {img ? (
        <Image
          src={img}
          alt={product.title}
          width={280}
          height={280}
          style={{ objectFit: "cover", borderRadius: 4, width: "100%", height: "auto" }}
          priority={false}
        />
      ) : null}
      <h3 style={{ margin: "8px 0 4px", color: site.theme.secondaryColor }}>{product.title}</h3>
      {product.description ? (
        <p style={{ margin: "0 0 8px", fontSize: 14, opacity: 0.9 }}>{product.description}</p>
      ) : null}
      {product.price != null ? (
        <p style={{ fontWeight: 600, color: site.theme.primaryColor }}>
          {product.price.toFixed(2)} {product.currency}
        </p>
      ) : null}
      {product.rating != null ? <p style={{ fontSize: 14 }}>★ {product.rating.toFixed(1)}</p> : null}
      <p style={{ marginTop: 8 }}>
        <a
          href={`/api/go/${product.slug}`}
          rel="nofollow sponsored"
          target="_blank"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ color: site.theme.primaryColor, fontWeight: 600 }}
        >
          Voir le prix
        </a>
      </p>
    </article>
  );
}
