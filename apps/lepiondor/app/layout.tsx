import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "../config";
import { SiteHeader, SiteFooter } from "@affiliate/ui";
import { homeMetadata } from "@affiliate/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = homeMetadata(siteConfig);

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <SiteHeader site={siteConfig} />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>{props.children}</main>
        <SiteFooter site={siteConfig} />
      </body>
    </html>
  );
}
