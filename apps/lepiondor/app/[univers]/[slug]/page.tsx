import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
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

  const primary = product.images[0];
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
          <nav style={{ marginBottom: 16, fontSize: 14 }}>
            <Link href="/">Accueil</Link>
            {catRows.map((c) => (
              <span key={c.path}>
                {" "}
                / <Link href={categoryListPublicPath(c.path)}>{c.name}</Link>
              </span>
            ))}
          </nav>
          <JsonLd data={breadcrumbSchema(crumbPath, siteConfig, catRows)} />
        </>
      ) : null}

      <h1 style={{ color: siteConfig.theme.secondaryColor }}>{product.title}</h1>
      {primary ? (
        <Image
          src={primary}
          alt={product.title}
          width={640}
          height={640}
          priority
          style={{ maxWidth: "100%", height: "auto", borderRadius: 8 }}
        />
      ) : null}
      {product.description ? <p>{product.description}</p> : null}
      {product.price != null ? (
        <p style={{ fontWeight: 700 }}>
          {product.price.toFixed(2)} {product.currency}
        </p>
      ) : null}
      <p>
        <a
          href={`/api/go/${product.slug}`}
          rel="nofollow sponsored"
          target="_blank"
          referrerPolicy="no-referrer-when-downgrade"
        >
          Voir le prix
        </a>
      </p>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} style={{ marginTop: 24 }} />
      ) : null}
    </article>
  );
}
