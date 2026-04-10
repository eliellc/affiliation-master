export type ContentBlock =
  | { type: "product_list"; category: string; limit: number; sort?: string }
  | { type: "product_grid"; category: string; limit: number }
  | { type: "comparison_table"; products: string[]; criteria: string[] }
  | { type: "cta_block"; text: string; url: string }
  | { type: "faq"; items: { question: string; answer: string }[] };

export function parseBlocks(raw: unknown): ContentBlock[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw as ContentBlock[];
}
