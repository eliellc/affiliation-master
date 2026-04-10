import { countProductsForSitemap } from "@affiliate/product-engine";
import { renderSitemapIndex } from "@affiliate/seo";
import { siteConfig } from "../../config";
import { siteId } from "../../lib/site";

export const dynamic = "force-dynamic";

const CHUNK = 50000;

export async function GET() {
  const totalProducts = await countProductsForSitemap(siteId, true);
  const totalSitemaps = Math.max(1, Math.ceil(totalProducts / CHUNK));
  const domain = siteConfig.domain.replace(/\/$/, "");

  const sitemaps = [
    { loc: `${domain}/sitemap-categories.xml` },
    { loc: `${domain}/sitemap-articles.xml` },
    ...Array.from({ length: totalSitemaps }, (_, i) => ({
      loc: `${domain}/sitemap-products-${i + 1}.xml`,
    })),
  ];

  const xml = renderSitemapIndex(sitemaps);
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
