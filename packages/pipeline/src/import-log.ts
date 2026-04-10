import type { PrismaClient } from "@prisma/client";

export async function writeImportLog(
  prisma: PrismaClient,
  input: {
    siteId: string;
    filename: string;
    status: "success" | "partial" | "error";
    inserted: number;
    updated: number;
    errors: number;
    details?: unknown;
  }
): Promise<void> {
  await prisma.importLog.create({
    data: {
      siteId: input.siteId,
      filename: input.filename,
      status: input.status,
      inserted: input.inserted,
      updated: input.updated,
      errors: input.errors,
      details: input.details === undefined ? undefined : (input.details as object),
    },
  });
}
