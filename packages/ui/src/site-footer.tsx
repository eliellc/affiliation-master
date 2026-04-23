import type { SiteConfig } from "@affiliate/seo";
import styles from "./site-footer.module.css";

export function SiteFooter(props: { site: SiteConfig }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.disclaimer}>{props.site.affiliate.disclaimer}</p>
      </div>
    </footer>
  );
}
