import type { PrismaClient } from "@prisma/client";
import { deleteSiteProductsFromIndex } from "@affiliate/search";

/**
 * Supprime tous les produits du site (cascade : product_categories, affiliate_clicks),
 * retire les documents Meilisearch correspondants, puis supprime les catégories du site
 * (feuilles d’abord à cause du parent_id).
 */
export async function wipeSiteCatalog(prisma: PrismaClient, siteId: string): Promise<void> {
  const rows = await prisma.product.findMany({
    where: { siteId },
    select: { id: true },
  });
  const ids = rows.map((r) => r.id);
  if (ids.length > 0) {
    try {
      await deleteSiteProductsFromIndex(ids);
    } catch (e) {
      console.warn(
        "[wipe] Meilisearch delete skipped or failed:",
        e instanceof Error ? e.message : e
      );
    }
  }

  const deletedProducts = await prisma.product.deleteMany({ where: { siteId } });
  console.log(`[wipe] products deleted: ${deletedProducts.count}`);

  await prisma.category.updateMany({
    where: { siteId },
    data: { parentId: null },
  });
  const catDel = await prisma.category.deleteMany({ where: { siteId } });
  console.log(`[wipe] categories deleted: ${catDel.count}`);
}
