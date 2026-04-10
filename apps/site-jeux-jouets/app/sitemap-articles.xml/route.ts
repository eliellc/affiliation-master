import { listArticlesForSitemap } from "@affiliate/product-engine";
import { renderUrlSet } from "@affiliate/seo";
import { siteConfig } from "../../config";
import { siteId } from "../../lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await listArticlesForSitemap(siteId);
  const domain = siteConfig.domain.replace(/\/$/, "");
  const xml = renderUrlSet(
    articles.map((a) => {
      const base =
        a.type === "comparatif"
          ? `${domain}/comparatif/${a.slug}`
          : `${domain}/blog/${a.slug}`;
      return {
        loc: base,
        lastmod: a.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: a.type === "comparatif" ? "0.75" : "0.65",
      };
    })
  );
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
