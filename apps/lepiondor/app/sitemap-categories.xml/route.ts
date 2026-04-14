import { listCategoriesForSite } from "@affiliate/product-engine";
import { categoryListPublicPath, renderUrlSet } from "@affiliate/seo";
import { siteConfig } from "../../config";
import { siteId } from "../../lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const cats = await listCategoriesForSite(siteId);
  const domain = siteConfig.domain.replace(/\/$/, "");
  const xml = renderUrlSet(
    cats.map((c) => ({
      loc: `${domain}${categoryListPublicPath(c.path)}`,
      changefreq: "weekly",
      priority: "0.6",
    }))
  );
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
