import type { CSSProperties } from "react";

/** Autorise seulement http(s) absolu ou chemin relatif same-origin (pas de `//` ambigu). */
export function safeProductImageSrc(src: string): string | null {
  const t = src.trim();
  if (!t || t.startsWith("//")) return null;
  if (t.startsWith("/")) return t;
  try {
    const u = new URL(t);
    if (u.protocol === "https:" || u.protocol === "http:") return t;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Image produit depuis un marchand (URL arbitraire). Utilise `<img>` natif pour éviter
 * la liste `images.remotePatterns` de `next/image`, qui ne peut pas couvrir tous les domaines.
 */
export function RemoteProductImage(props: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
  priority?: boolean;
}) {
  const { src, alt, width, height, style, priority } = props;
  const safe = safeProductImageSrc(src);
  if (!safe) return null;
  return (
    <img
      src={safe}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      style={style}
    />
  );
}
