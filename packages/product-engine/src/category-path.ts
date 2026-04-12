/** Fil d'Ariane depuis le path hiérarchique. */
export function buildBreadcrumb(path: string): string[] {
  const segments = path.split("/").filter(Boolean);
  return segments.map((_, i) => segments.slice(0, i + 1).join("/"));
}

/**
 * URL publique fiche produit : `/{premier_segment_du_path_catégorie}/{slug}`.
 * Sans catégorie utilisable, retombe sur `/produit/{slug}`.
 */
export function productPublicPath(slug: string, primaryCategoryPath: string | null | undefined): string {
  const root = primaryCategoryPath?.split("/").filter(Boolean)[0];
  if (!root) return `/produit/${slug}`;
  return `/${root}/${slug}`;
}
