import {
  countProductsForSitemap,
  listProductsSitemapChunk,
  productPublicPath,
} from "@affiliate/product-engine";
import { renderUrlSet } from "@affiliate/seo";
import { siteConfig } from "../../../config";
import { siteId } from "../../../lib/site";

const CHUNK = 50000;

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ n: string }> }
) {
  const params = await ctx.params;
  const page = Number(params.n);
  if (!Number.isFinite(page) || page < 1) {
    return new Response("Not found", { status: 404 });
  }

  const total = await countProductsForSitemap(siteId, true);
  const maxPage = Math.max(1, Math.ceil(total / CHUNK));
  if (page > maxPage) {
    return new Response("Not found", { status: 404 });
  }

  const products = await listProductsSitemapChunk(siteId, page, CHUNK, true);
  const domain = siteConfig.domain.replace(/\/$/, "");
  const xml = renderUrlSet(
    products.map((p) => ({
      loc: `${domain}${productPublicPath(p.slug, p.categories[0]?.category.path)}`,
      lastmod: p.updatedAt.toISOString(),
      changefreq: "weekly",
      priority: "0.8",
    }))
  );

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
