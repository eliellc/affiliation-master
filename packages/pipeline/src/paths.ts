import path from "node:path";
import { fileURLToPath } from "node:url";

export function getRepoRoot(): string {
  return path.resolve(fileURLToPath(new URL("..", import.meta.url)), "../..");
}

export function dataDirForSite(siteId: string): string {
  return path.join(getRepoRoot(), "data", siteId);
}

export function productsJsonPath(siteId: string): string {
  return path.join(dataDirForSite(siteId), "products.json");
}

export function productsImportManifestPath(siteId: string): string {
  return path.join(dataDirForSite(siteId), ".product-import-manifest.json");
}

export function articlesJsonPath(siteId: string): string {
  return path.join(dataDirForSite(siteId), "articles.json");
}

export function lepiondorFichesDir(): string {
  return path.join(getRepoRoot(), "INPUT-DATA-ELIE", "lepiondor", "data-fiches-produits");
}
