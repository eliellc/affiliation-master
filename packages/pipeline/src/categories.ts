import type { PrismaClient } from "@prisma/client";

function humanizeSegment(seg: string): string {
  return seg
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function ensureCategoryPaths(
  prisma: PrismaClient,
  siteId: string,
  paths: Iterable<string>
): Promise<void> {
  for (const fullPath of paths) {
    const segments = fullPath.split("/").filter(Boolean);
    let parentId: string | null = null;
    let currentPath = "";
    for (const seg of segments) {
      currentPath = currentPath ? `${currentPath}/${seg}` : seg;
      const row = await prisma.category.upsert({
        where: {
          siteId_path: { siteId, path: currentPath },
        },
        create: {
          siteId,
          slug: seg,
          name: humanizeSegment(seg),
          path: currentPath,
          parentId,
        },
        update: {
          parentId,
        },
      });
      parentId = row.id;
    }
  }
}

export async function resolveCategoryIdsByPaths(
  prisma: PrismaClient,
  siteId: string,
  paths: string[]
): Promise<string[]> {
  const rows = await prisma.category.findMany({
    where: { siteId, path: { in: paths } },
    select: { id: true, path: true },
  });
  const byPath = new Map(rows.map((r) => [r.path, r.id]));
  return paths.map((p) => {
    const id = byPath.get(p);
    if (!id) throw new Error(`Category path not found after upsert: ${p}`);
    return id;
  });
}
