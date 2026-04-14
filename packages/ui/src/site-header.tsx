import Link from "next/link";
import Image from "next/image";
import type { SiteConfig } from "@affiliate/seo";

export function SiteHeader(props: { site: SiteConfig }) {
  const { site } = props;
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "16px 24px",
        borderBottom: `2px solid ${site.theme.primaryColor}`,
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Image src={site.theme.logo} alt={site.name} width={40} height={40} />
        <strong style={{ color: site.theme.secondaryColor }}>{site.name}</strong>
      </Link>
      <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {site.nav.map((item) => (
          <Link
            key={item.slug}
            href={`/${item.slug}`}
            style={{ color: site.theme.secondaryColor }}
          >
            {item.label}
          </Link>
        ))}
        {site.features.search ? (
          <Link href="/recherche" style={{ color: site.theme.secondaryColor }}>
            Recherche
          </Link>
        ) : null}
        {site.features.blog ? (
          <Link href="/blog" style={{ color: site.theme.secondaryColor }}>
            Blog
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
