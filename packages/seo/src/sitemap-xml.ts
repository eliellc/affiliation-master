export type SitemapIndexEntry = { loc: string };

export function renderSitemapIndex(sitemaps: SitemapIndexEntry[]): string {
  const body = sitemaps
    .map(
      (s) => `
  <sitemap>
    <loc>${escapeXml(s.loc)}</loc>
  </sitemap>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</sitemapindex>`;
}

export type UrlEntry = { loc: string; lastmod?: string; changefreq?: string; priority?: string };

export function renderUrlSet(urls: UrlEntry[]): string {
  const body = urls
    .map((u) => {
      const lastmod = u.lastmod ? `\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : "";
      const cf = u.changefreq ? `\n    <changefreq>${escapeXml(u.changefreq)}</changefreq>` : "";
      const pr = u.priority ? `\n    <priority>${escapeXml(u.priority)}</priority>` : "";
      return `
  <url>
    <loc>${escapeXml(u.loc)}</loc>${lastmod}${cf}${pr}
  </url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function robotsTxtContent(args: { domain: string; sitemapUrl: string }): string {
  return `User-agent: *
Allow: /

Sitemap: ${args.sitemapUrl}
`;
}
