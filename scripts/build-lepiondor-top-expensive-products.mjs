#!/usr/bin/env node
/**
 * Sélectionne les produits Lepiondor les plus chers depuis
 * INPUT-DATA-ELIE/lepiondor/data-fiches-produits.
 *
 * Sortie: data/lepiondor/top-expensive-products.json
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const INPUT_DIR = join(repoRoot, "INPUT-DATA-ELIE", "lepiondor", "data-fiches-produits");
const OUTPUT_DIR = join(repoRoot, "data", "lepiondor");
const OUTPUT_FILE = join(OUTPUT_DIR, "top-expensive-products.json");
const TARGET_COUNT = 800;

function parsePrice(raw) {
  if (raw == null) return undefined;
  const normalized = String(raw).replace(/\s/g, "").replace("€", "").replace(",", ".");
  const match = normalized.match(/[\d.]+/);
  if (!match) return undefined;
  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function normalizeRootSlug(rawSlug) {
  if (typeof rawSlug !== "string") return undefined;
  const trimmed = rawSlug.trim();
  if (!trimmed) return undefined;
  const withoutEdges = trimmed.replace(/^\/+|\/+$/g, "");
  if (!withoutEdges) return undefined;
  const rootSegment = withoutEdges.split("/")[0];
  if (!rootSegment) return undefined;
  return `/${rootSegment}/`;
}

function extractBreadcrumbLevel1(raw) {
  const breadcrumbs = Array.isArray(raw?.breadcrumbs) ? raw.breadcrumbs : [];
  if (breadcrumbs.length === 0) return undefined;
  const first = breadcrumbs[0];
  const slug = typeof first?.slug === "string" ? first.slug : undefined;
  return normalizeRootSlug(slug);
}

function normalizeProductSlug(raw) {
  if (typeof raw?.slug !== "string") return undefined;
  const slug = raw.slug.trim().replace(/^\/+|\/+$/g, "");
  if (!slug) return undefined;
  return slug;
}

function buildFinalUrl(breadcrumbLevel1, slug) {
  const base = breadcrumbLevel1.replace(/\/+$/g, "");
  return `${base}/${slug}`;
}

function toComparableEan(raw) {
  if (raw == null) return "";
  return String(raw).trim();
}

async function main() {
  const names = (await readdir(INPUT_DIR))
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  const candidates = [];
  const stats = {
    total_files: names.length,
    valid_candidates: 0,
    excluded_no_price: 0,
    excluded_invalid_breadcrumb: 0,
    excluded_invalid_slug: 0,
    excluded_parse_error: 0,
    selected: 0,
  };

  for (const fileName of names) {
    try {
      const content = await readFile(join(INPUT_DIR, fileName), "utf-8");
      const raw = JSON.parse(content);
      const price = parsePrice(raw?.price);
      if (price == null) {
        stats.excluded_no_price += 1;
        continue;
      }

      const breadcrumbLevel1 = extractBreadcrumbLevel1(raw);
      if (!breadcrumbLevel1) {
        stats.excluded_invalid_breadcrumb += 1;
        continue;
      }

      const slug = normalizeProductSlug(raw);
      if (!slug) {
        stats.excluded_invalid_slug += 1;
        continue;
      }

      const entry = {
        ean: raw?.ean != null ? String(raw.ean).trim() : undefined,
        title: typeof raw?.title === "string" ? raw.title.trim() : undefined,
        slug,
        price,
        breadcrumb_level1: breadcrumbLevel1,
        final_url: buildFinalUrl(breadcrumbLevel1, slug),
        source_file: fileName,
      };
      candidates.push(entry);
    } catch {
      stats.excluded_parse_error += 1;
    }
  }

  stats.valid_candidates = candidates.length;

  candidates.sort((a, b) => {
    if (b.price !== a.price) return b.price - a.price;
    const eanA = toComparableEan(a.ean);
    const eanB = toComparableEan(b.ean);
    if (eanA !== eanB) return eanA.localeCompare(eanB);
    return a.slug.localeCompare(b.slug);
  });

  let thresholdPrice = null;
  let selected = candidates;
  if (candidates.length > TARGET_COUNT) {
    thresholdPrice = candidates[TARGET_COUNT - 1].price;
    selected = candidates.filter((candidate) => candidate.price >= thresholdPrice);
  } else if (candidates.length > 0) {
    thresholdPrice = candidates[candidates.length - 1].price;
  }

  stats.selected = selected.length;

  const output = {
    site: "lepiondor",
    type: "top_expensive_products",
    generated_at: new Date().toISOString(),
    selection: {
      target: TARGET_COUNT,
      include_ties: true,
      threshold_price: thresholdPrice,
    },
    stats,
    preview_urls: selected.slice(0, 10).map((entry) => entry.final_url),
    products: selected,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        output: OUTPUT_FILE,
        selected: stats.selected,
        threshold_price: thresholdPrice,
        stats,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
