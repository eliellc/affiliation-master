import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import {
  buildBreadcrumb,
  getProduct,
  getTopProductSlugs,
  listCategoriesForSite,
} from "@affiliate/product-engine";
import { markdownToHtml } from "@affiliate/content-engine";
import {
  breadcrumbSchema,
  generateProductMeta,
  JsonLd,
  productSchema,
} from "@affiliate/seo";
import { siteConfig } from "../../../config";
import { siteId } from "../../../lib/site";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getTopProductSlugs(siteId, 500);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(siteId, params.slug);
  if (!product) return { title: "Produit" };
  return generateProductMeta(
    {
      slug: product.slug,
      title: product.title,
      description: product.description,
      metaTitle: product.metaTitle,
      metaDesc: product.metaDesc,
      inStock: product.inStock,
      images: product.images,
    },
    siteConfig
  );
}

export default async function ProductPage(props: Props) {
  const params = await props.params;
  const product = await getProduct(siteId, params.slug);
  if (!product) notFound();

  const primary = product.images[0];
  const html =
    product.content && product.content.length > 0 ? await markdownToHtml(product.content) : "";

  const crumbPath = product.categories[0]?.category.path ?? "";
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
                / <Link href={`/categorie/${c.path}`}>{c.name}</Link>
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
