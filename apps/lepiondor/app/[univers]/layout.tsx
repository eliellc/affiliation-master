/**
 * Toute l’arborescence sous /[univers]/… est rendue uniquement à la requête,
 * pour éviter le pré-rendu parallèle au build (Prisma + pooler → P2024).
 */
export const dynamic = "force-dynamic";

export default function UniversSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
