import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductPageTemplate } from "@affiliate/ui";
import {
  buildBreadcrumb,
  getProduct,
  getTopProductSlugs,
  listCategoriesForSite,
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
  const editorial = (product as typeof product & { editorial?: Record<string, unknown> | null }).editorial ?? null;

  const html =
    product.content && product.content.length > 0 ? await markdownToHtml(product.content) : "";

  const crumbPath = product.categories[0]?.category.path ?? "";
  const allCats = await listCategoriesForSite(siteId);
  const segments = crumbPath ? buildBreadcrumb(crumbPath) : [];
  const catRows = segments.map((pth) => {
    const c = allCats.find((x) => x.path === pth);
    return { path: pth, name: c?.name ?? pth };
  });
  const scoring = (editorial?.scoring as { global?: number; criteria?: Array<{ label?: string; score?: number }> } | undefined) ?? undefined;
  const criteria = Array.isArray(scoring?.criteria)
    ? scoring.criteria
        .filter((c): c is { label: string; score: number } => !!c && typeof c.label === "string" && typeof c.score === "number")
        .map((c) => ({ label: c.label, score: c.score, outOf: 10 }))
    : [];
  const pros = Array.isArray(editorial?.pros) ? editorial.pros.filter((x): x is string => typeof x === "string") : [];
  const cons = Array.isArray(editorial?.cons) ? editorial.cons.filter((x): x is string => typeof x === "string") : [];
  const specs = Array.isArray(editorial?.specs)
    ? editorial.specs
        .filter((s): s is { section?: string; rows?: Array<{ label?: string; value?: string }> } => !!s && typeof s === "object")
        .map((s) => ({
          title: typeof s.section === "string" ? s.section : "Détails",
          items: Array.isArray(s.rows)
            ? s.rows
                .filter((r): r is { label: string; value: string } => !!r && typeof r.label === "string" && typeof r.value === "string")
                .map((r) => ({ label: r.label, value: r.value }))
            : [],
        }))
        .filter((s) => s.items.length > 0)
    : [];
  const verdictProfiles = Array.isArray(editorial?.verdict_profiles)
    ? editorial.verdict_profiles.filter(
        (v): v is { label?: string; match?: string } => !!v && typeof v === "object" && typeof v.label === "string"
      )
    : [];
  const faq = Array.isArray(editorial?.faq)
    ? editorial.faq
        .filter(
          (f): f is { question?: string; answer?: string } =>
            !!f && typeof f === "object" && typeof f.question === "string" && typeof f.answer === "string"
        )
        .map((f) => ({ question: f.question as string, answer: f.answer as string }))
    : [];

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
        shortReview={
          typeof editorial?.avis_30s === "string"
            ? editorial.avis_30s
            : typeof editorial?.accroche === "string"
              ? editorial.accroche
              : product.description ?? undefined
        }
        criteria={criteria}
        prosCons={pros.length > 0 || cons.length > 0 ? { pros, cons } : undefined}
        specs={specs}
        verdict={
          typeof scoring?.global === "number" || typeof editorial?.avis === "string" || verdictProfiles.length > 0
            ? {
                score: typeof scoring?.global === "number" ? scoring.global : product.rating ?? 0,
                outOf: 10,
                text: typeof editorial?.avis === "string" ? editorial.avis : undefined,
                audiences: verdictProfiles.map((v) => ({
                  label: v.label as string,
                  recommended: typeof v.match === "string" ? ["excellent", "bon", "good", "ok"].includes(v.match.toLowerCase()) : false,
                })),
              }
            : undefined
        }
        faq={faq}
        faqTitle={typeof editorial?.faq_title === "string" ? editorial.faq_title : undefined}
        disclaimer=""
      />
    </article>
  );
}
