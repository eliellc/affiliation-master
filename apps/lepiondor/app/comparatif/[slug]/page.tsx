import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getArticle, getTopComparatifSlugs } from "@affiliate/product-engine";
import { markdownToHtml, parseBlocks, renderBlocks } from "@affiliate/content-engine";
import type { ContentBlock } from "@affiliate/content-engine";
import { articleSchema, faqSchema, generateArticleMeta, JsonLd } from "@affiliate/seo";
import { siteConfig } from "../../../config";
import { siteId } from "../../../lib/site";

export const revalidate = 86400;

export async function generateStaticParams() {
  try {
    const slugs = await getTopComparatifSlugs(siteId, 200);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

function faqFromBlocks(blocks: ContentBlock[]) {
  for (const b of blocks) {
    if (b.type === "faq") return b.items;
  }
  return null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  let article = null;
  try {
    article = await getArticle(siteId, params.slug, "comparatif");
  } catch {
    return { title: "Comparatif" };
  }
  if (!article) return { title: "Comparatif" };
  return generateArticleMeta(
    {
      title: article.title,
      excerpt: article.excerpt,
      imageUrl: article.imageUrl,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
    },
    siteConfig,
    `/comparatif/${article.slug}`
  );
}

export default async function ComparatifPage(props: Props) {
  const params = await props.params;
  let article = null;
  try {
    article = await getArticle(siteId, params.slug, "comparatif");
  } catch {
    notFound();
  }
  if (!article) notFound();

  const html = await markdownToHtml(article.content);
  const blocks = parseBlocks(article.blocks);
  const faqItems = faqFromBlocks(blocks);

  return (
    <article>
      <JsonLd
        data={articleSchema(article, siteConfig, `/comparatif/${article.slug}`)}
      />
      {faqItems ? <JsonLd data={faqSchema(faqItems)} /> : null}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Accueil",
              item: siteConfig.domain,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: article.title,
              item: `${siteConfig.domain}/comparatif/${article.slug}`,
            },
          ],
        }}
      />
      <nav style={{ marginBottom: 16 }}>
        <Link href="/">Accueil</Link> / <span>Comparatifs</span>
      </nav>
      <h1>{article.title}</h1>
      {article.excerpt ? <p>{article.excerpt}</p> : null}
      <div dangerouslySetInnerHTML={{ __html: html }} style={{ marginBottom: 24 }} />
      {await renderBlocks(blocks, siteId, siteConfig)}
    </article>
  );
}
