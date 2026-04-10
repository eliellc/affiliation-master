import { MeiliSearch, type MeiliSearch as MeiliSearchType } from "meilisearch";

export function createSearchClient(): MeiliSearchType {
  const host = process.env.MEILISEARCH_HOST ?? "http://127.0.0.1:7700";
  const apiKey = process.env.MEILISEARCH_API_KEY ?? "";
  return new MeiliSearch({ host, apiKey });
}

export const PRODUCTS_INDEX = "products";
