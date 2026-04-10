/** Fil d'Ariane depuis le path hiérarchique. */
export function buildBreadcrumb(path: string): string[] {
  const segments = path.split("/").filter(Boolean);
  return segments.map((_, i) => segments.slice(0, i + 1).join("/"));
}
