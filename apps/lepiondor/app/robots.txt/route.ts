import { robotsTxtContent } from "@affiliate/seo";
import { siteConfig } from "../../config";

export async function GET() {
  const domain = siteConfig.domain.replace(/\/$/, "");
  const body = robotsTxtContent({
    domain,
    sitemapUrl: `${domain}/sitemap.xml`,
  });
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
