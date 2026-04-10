import Link from "next/link";
import { getProductsByCategory } from "@affiliate/product-engine";
import { ProductList, type ProductCardProduct } from "@affiliate/ui";
import { toCardProduct } from "@affiliate/content-engine";
import { siteConfig } from "../config";
import { siteId } from "../lib/site";

export const revalidate = 3600;

export default async function HomePage() {
  const firstNav = siteConfig.nav[0];
  let products: ProductCardProduct[] = [];
  try {
    const { items } = await getProductsByCategory(siteId, firstNav?.slug ?? "jeux", {
      limit: 8,
      page: 1,
      inStockOnly: true,
    });
    products = items.map((p) => toCardProduct(p));
  } catch {
    products = [];
  }

  return (
    <div>
      <h1 style={{ color: siteConfig.theme.secondaryColor }}>{siteConfig.seo.defaultTitle}</h1>
      <p style={{ maxWidth: 640 }}>{siteConfig.seo.defaultDescription}</p>
      <h2 style={{ marginTop: 32 }}>Sélection</h2>
      <ProductList products={products} site={siteConfig} />
      {firstNav ? (
        <p style={{ marginTop: 16 }}>
          <Link href={`/categorie/${firstNav.slug}`}>Voir la catégorie « {firstNav.label} »</Link>
        </p>
      ) : null}
    </div>
  );
}
