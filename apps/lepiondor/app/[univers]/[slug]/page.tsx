import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductPageTemplate } from "@affiliate/ui";
import {
  buildBreadcrumb,
  getProductByRootAndSlug,
  listCategoriesForSite,
  productPublicPath,
} from "@affiliate/product-engine";
import { markdownToHtml } from "@affiliate/content-engine";
import {
  breadcrumbSchema,
  categoryListPublicPath,
  generateProductMeta,
  JsonLd,
  productSchema,
} from "@affiliate/seo";
import { siteConfig } from "../../../config";
import { siteId } from "../../../lib/site";

export const dynamicParams = true;
/** Redondant avec `app/[univers]/layout.tsx` ; garde la route explicitement dynamique. */
export const dynamic = "force-dynamic";

const domain = siteConfig.domain.replace(/\/$/, "");

type Props = { params: Promise<{ univers: string; slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductByRootAndSlug(siteId, params.univers, params.slug);
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

export default async function ProductPageNested(props: Props) {
  const params = await props.params;
  const product = await getProductByRootAndSlug(siteId, params.univers, params.slug);
  if (!product) notFound();

  const html =
    product.content && product.content.length > 0 ? await markdownToHtml(product.content) : "";

  const crumbPath = product.categories[0]?.category.path ?? "";
  const publicPath = productPublicPath(product.slug, crumbPath);
  const allCats = await listCategoriesForSite(siteId);
  const segments = crumbPath ? buildBreadcrumb(crumbPath) : [];
  const catRows = segments.map((pth) => {
    const c = allCats.find((x) => x.path === pth);
    return { path: pth, name: c?.name ?? pth };
  });

  return (
    <article>
      <JsonLd
        data={productSchema(
          {
            slug: product.slug,
            title: product.title,
            description: product.description,
            images: product.images,
            brand: product.brand,
            price: product.price,
            currency: product.currency,
            inStock: product.inStock,
            rating: product.rating,
            reviewCount: product.reviewCount,
            productUrl: `${domain}${publicPath}`,
          },
          siteConfig
        )}
      />
      {crumbPath ? (
        <>
          <JsonLd data={breadcrumbSchema(crumbPath, siteConfig, catRows)} />
        </>
      ) : null}
      <ProductPageTemplate
        title={product.title}
        brand={product.brand}
        description={product.description}
        price={product.price}
        currency={product.currency}
        rating={product.rating}
        images={product.images}
        ctaHref={`/api/go/${product.slug}`}
        breadcrumb={catRows.map((c) => ({ label: c.name, href: categoryListPublicPath(c.path) }))}
        richContentHtml={html}
        shortReview={product.description ?? undefined}
        disclaimer="Cette page contient des liens d'affiliation."
      />
    </article>
  );
}
