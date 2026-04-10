import type { SiteConfig } from "@affiliate/seo";

export function SiteFooter(props: { site: SiteConfig }) {
  return (
    <footer
      style={{
        marginTop: 48,
        padding: 24,
        borderTop: "1px solid #ddd",
        fontSize: 13,
        opacity: 0.85,
      }}
    >
      <p>{props.site.affiliate.disclaimer}</p>
    </footer>
  );
}
