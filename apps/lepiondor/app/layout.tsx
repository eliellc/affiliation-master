import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import { siteConfig } from "../config";
import { SiteHeader, SiteFooter } from "@affiliate/ui";
import { homeMetadata } from "@affiliate/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = homeMetadata(siteConfig);

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable} data-site={siteConfig.id}>
      <body className={styles.body}>
        <SiteHeader site={siteConfig} />
        <main className={styles.main}>{props.children}</main>
        <SiteFooter site={siteConfig} />
      </body>
    </html>
  );
}
