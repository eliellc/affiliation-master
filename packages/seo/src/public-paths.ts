/**
 * URL publique d’une page liste catégorie.
 * Un seul segment (`jeux-de-societe`) reste à la racine (rewrite → `/categorie/...`).
 * Les chemins hiérarchiques (`jeux/lego/technic`) passent par `/categorie/...` pour ne pas
 * entrer en conflit avec les fiches produit `/{racine}/{slug}`.
 */
export function categoryListPublicPath(path: string): string {
  const normalized = path.split("/").filter(Boolean).join("/");
  if (!normalized) return "/";
  if (!normalized.includes("/")) return `/${normalized}`;
  return `/categorie/${normalized}`;
}
