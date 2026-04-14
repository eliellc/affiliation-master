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
  outputFileTracingIncludes: {
    "/*": [
      "../../node_modules/.prisma/client/**/*",
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**/*",
    ],
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/jeux-de-cartes",
        destination: "/jeux-de-cartes-a-collectionner",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source:
          "/:path((?!api|_next|blog|comparatif|produit|recherche|categorie|robots\\.txt|sitemap\\.xml|sitemap-categories\\.xml|sitemap-articles\\.xml|sitemap-products|favicon\\.ico).+)",
        destination: "/categorie/:path",
      },
      {
        source:
          "/:path1((?!api|_next|blog|comparatif|produit|recherche|categorie|robots\\.txt|sitemap\\.xml|sitemap-categories\\.xml|sitemap-articles\\.xml|sitemap-products|favicon\\.ico)[^/]+)/:path2*",
        destination: "/categorie/:path1/:path2*",
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
      { protocol: "https", hostname: "cdn1.philibertnet.com" },
      { protocol: "https", hostname: "cdn2.philibertnet.com" },
      { protocol: "https", hostname: "cdn3.philibertnet.com" },
      { protocol: "https", hostname: "cdn4.philibertnet.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
