import Link from "next/link";
import Image from "next/image";
import type { SiteConfig } from "@affiliate/seo";
import { categoryListPublicPath } from "@affiliate/seo";
import styles from "./site-header.module.css";

export function SiteHeader(props: { site: SiteConfig }) {
  const { site } = props;
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <Link href="/" className={styles.brand}>
            <Image className={styles.brandMark} src={site.theme.logo} alt={site.name} width={40} height={40} />
            <div>
              <strong className={styles.brandName}>{site.name}</strong>
              <p className={styles.tagline}>Comparateur, tests et avis</p>
            </div>
          </Link>
        </div>
        <nav className={styles.navRow}>
          {site.nav.map((item) => (
            <Link key={item.slug} href={categoryListPublicPath(item.slug)} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
          {site.features.search ? (
            <Link href="/recherche" className={styles.navLink}>
              Recherche
            </Link>
          ) : null}
          {site.features.blog ? (
            <Link href="/blog" className={styles.navLink}>
              Blog
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
