import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticle, getRecentArticleSlugs } from "@affiliate/product-engine";
import { markdownToHtml, parseBlocks, renderBlocks } from "@affiliate/content-engine";
import { articleSchema, generateArticleMeta, JsonLd } from "@affiliate/seo";
import { siteConfig } from "../../../config";
import { siteId } from "../../../lib/site";

export const revalidate = 86400;

export async function generateStaticParams() {
  try {
    const slugs = await getRecentArticleSlugs(siteId, 200);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  let article = null;
  try {
    article = await getArticle(siteId, params.slug, "article");
  } catch {
    return { title: "Article" };
  }
  if (!article) return { title: "Article" };
  return generateArticleMeta(
    {
      title: article.title,
      excerpt: article.excerpt,
      imageUrl: article.imageUrl,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
    },
    siteConfig,
    `/blog/${article.slug}`
  );
}

export default async function BlogArticlePage(props: Props) {
  const params = await props.params;
  let article = null;
  try {
    article = await getArticle(siteId, params.slug, "article");
  } catch {
    notFound();
  }
  if (!article) notFound();

  const html = await markdownToHtml(article.content);
  const blocks = parseBlocks(article.blocks);

  return (
    <article>
      <JsonLd data={articleSchema(article, siteConfig, `/blog/${article.slug}`)} />
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
              name: "Blog",
              item: `${siteConfig.domain}/blog`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: article.title,
              item: `${siteConfig.domain}/blog/${article.slug}`,
            },
          ],
        }}
      />
      <nav style={{ marginBottom: 16 }}>
        <Link href="/">Accueil</Link> / <Link href="/blog">Blog</Link>
      </nav>
      <h1>{article.title}</h1>
      {article.excerpt ? <p>{article.excerpt}</p> : null}
      <div dangerouslySetInnerHTML={{ __html: html }} style={{ marginBottom: 24 }} />
      {await renderBlocks(blocks, siteId, siteConfig)}
    </article>
  );
}
