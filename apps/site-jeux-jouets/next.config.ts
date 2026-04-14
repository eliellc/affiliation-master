import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
/** Permet d’utiliser le `.env` / `.env.local` à la racine du monorepo (comme `.env.example`). */
loadEnvConfig(repoRoot);

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source:
          "/:path((?!api|_next|blog|comparatif|produit|recherche|categorie|robots\\.txt|sitemap\\.xml|sitemap-categories\\.xml|sitemap-articles\\.xml|sitemap-products|favicon\\.ico)[^/]+)",
        destination: "/categorie/:path",
      },
      {
        source: "/sitemap-products-:chunk.xml",
        destination: "/sitemap-products/:chunk",
      },
    ];
  },
  transpilePackages: [
    "@affiliate/db",
    "@affiliate/seo",
    "@affiliate/ui",
    "@affiliate/product-engine",
    "@affiliate/content-engine",
    "@affiliate/search",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "cdn.example.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
