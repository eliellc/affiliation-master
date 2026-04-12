import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getProduct, productPublicPath } from "@affiliate/product-engine";
import { generateProductMeta } from "@affiliate/seo";
import { siteConfig } from "../../../config";
import { siteId } from "../../../lib/site";

export const revalidate = 86400;
export const dynamicParams = true;
/** Évite tout pré-rendu au build (sinon Prisma + pooler 1 connexion → P2024 sur Vercel). */
export const dynamic = "force-dynamic";

/** Ancienne URL : redirection au runtime uniquement. */
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(siteId, params.slug);
  if (!product) return { title: "Produit" };
  const crumbPath = product.categories[0]?.category.path ?? "";
  const canonicalPath = productPublicPath(product.slug, crumbPath);
  return generateProductMeta(
    {
      slug: product.slug,
      title: product.title,
      description: product.description,
      metaTitle: product.metaTitle,
      metaDesc: product.metaDesc,
      inStock: product.inStock,
      images: product.images,
      canonicalPath,
    },
    siteConfig
  );
}

export default async function LegacyProductRedirect(props: Props) {
  const params = await props.params;
  const product = await getProduct(siteId, params.slug);
  if (!product) notFound();
  const crumbPath = product.categories[0]?.category.path ?? "";
  permanentRedirect(productPublicPath(product.slug, crumbPath));
}
