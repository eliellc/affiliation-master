import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

/** Réutilise le client sur globalThis en prod (Vercel serverless) pour limiter les connexions au pooler. */
globalForPrisma.prisma = prisma;
