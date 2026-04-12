/** Redirections /produit/* : pas de SSG au build (évite P2024 avec le pool Prisma). */
export const dynamic = "force-dynamic";

export default function ProduitSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
