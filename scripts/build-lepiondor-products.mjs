#!/usr/bin/env node
/**
 * Agrège INPUT-DATA-ELIE/lepiondor/data-fiches-produits/*.json
 * → data/lepiondor/products.json (format pipeline).
 *
 * Usage : node scripts/build-lepiondor-products.mjs [--limit 800]
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const INPUT_DIR = join(repoRoot, "INPUT-DATA-ELIE", "lepiondor", "data-fiches-produits");
const OUTPUT_DIR = join(repoRoot, "data", "lepiondor");
const OUTPUT_FILE = join(OUTPUT_DIR, "products.json");

function slugifySegment(text) {
  if (!text || typeof text !== "string") return "";
  const n = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return n || "x";
}

function normalizeCategoryRoot(breadcrumbs) {
  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
    return "non-classe";
  }

  const root = breadcrumbs[0];
  if (root && typeof root === "object" && !Array.isArray(root)) {
    if (typeof root.slug === "string") {
      const cleaned = root.slug.replace(/^\/+|\/+$/g, "");
      const firstSegment = cleaned.split("/")[0];
      if (firstSegment) return firstSegment;
    }
    if (typeof root.name === "string") {
      const fromName = slugifySegment(root.name);
      if (fromName) return fromName;
    }
  }

  if (typeof root === "string") {
    const fromString = slugifySegment(root);
    if (fromString) return fromString;
  }

  return "non-classe";
}

function categoryPathsFromBreadcrumbs(breadcrumbs) {
  const root = normalizeCategoryRoot(breadcrumbs);
  if (!root) {
    return ["non-classe"];
  }
  return [root];
}

function parsePrice(raw) {
  if (raw == null) return undefined;
  const s = String(raw).replace(/\s/g, "").replace("€", "").replace(",", ".");
  const m = s.match(/[\d.]+/);
  if (!m) return undefined;
  const n = Number.parseFloat(m[0]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Slug SEO depuis le titre ; unicité globale via `usedSlugs` (suffixe EAN ou compteur). */
function productSlug(raw, usedSlugs) {
  const base = slugifySegment(raw.title || "produit") || "produit";
  const eanRaw = raw.ean != null ? String(raw.ean).trim() : "";
  const eanSuffix = eanRaw.replace(/[^a-z0-9]/gi, "").toLowerCase();

  let candidate = base;
  if (!usedSlugs.has(candidate)) {
    usedSlugs.add(candidate);
    return candidate;
  }
  if (eanSuffix) {
    candidate = `${base}-${eanSuffix}`;
    if (!usedSlugs.has(candidate)) {
      usedSlugs.add(candidate);
      return candidate;
    }
  }
  let n = 2;
  while (usedSlugs.has(`${base}-${n}`)) n += 1;
  candidate = `${base}-${n}`;
  usedSlugs.add(candidate);
  return candidate;
}

function truncate(str, max) {
  if (str == null || str === "") return undefined;
  const t = String(str);
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function mapFiche(raw, usedSlugs) {
  const images = Array.isArray(raw["product-images"])
    ? raw["product-images"].filter((u) => typeof u === "string" && /^https?:\/\//i.test(u))
    : [];
  const url =
    (Array.isArray(raw.urls)
      ? raw.urls.find((u) => typeof u === "string" && /^https?:\/\//i.test(u))
      : undefined) ??
    (typeof raw.url === "string" && /^https?:\/\//i.test(raw.url.trim()) ? raw.url.trim() : "");
  if (images.length === 0) throw new Error("pas d’image https");
  if (!url || !/^https?:\/\//i.test(url)) throw new Error("url manquante ou invalide");
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) throw new Error("title vide");
  const price = parsePrice(raw.price);
  if (price == null) throw new Error("prix manquant ou invalide");

  const slug = productSlug(raw, usedSlugs);
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`slug invalide: ${slug}`);

  const categories = categoryPathsFromBreadcrumbs(raw.breadcrumbs);
  const description =
    typeof raw.accroche === "string"
      ? raw.accroche.trim()
      : typeof raw.meta_description === "string"
        ? raw.meta_description.trim()
        : undefined;
  const content =
    typeof raw.description_long === "string" && raw.description_long.trim()
      ? raw.description_long.trim()
      : undefined;

  const brand =
    Array.isArray(raw.breadcrumbs) && raw.breadcrumbs.length > 0
      ? String(
          typeof raw.breadcrumbs[raw.breadcrumbs.length - 1] === "object"
            ? raw.breadcrumbs[raw.breadcrumbs.length - 1].name
            : raw.breadcrumbs[raw.breadcrumbs.length - 1]
        ).trim()
      : undefined;

  return {
    slug,
    title,
    description,
    content,
    price,
    currency: "EUR",
    affiliate_url: url,
    images,
    in_stock: true,
    brand: brand || undefined,
    ean: raw.ean != null ? String(raw.ean).trim() : undefined,
    editorial: raw,
    categories,
    meta_title: truncate(raw.meta_title, 70),
    meta_desc: truncate(raw.meta_description, 160),
  };
}

function parseLimit() {
  const i = process.argv.indexOf("--limit");
  if (i === -1 || process.argv[i + 1] === undefined) return 800;
  const n = Number.parseInt(process.argv[i + 1], 10);
  return Number.isFinite(n) && n > 0 ? n : 800;
}

async function main() {
  const limit = parseLimit();

  let names;
  try {
    names = await readdir(INPUT_DIR);
  } catch (e) {
    console.error("Dossier introuvable:", INPUT_DIR);
    console.error("Vérifie que INPUT-DATA-ELIE/lepiondor/data-fiches-produits existe.");
    process.exit(1);
  }

  const jsonFiles = names.filter((n) => n.endsWith(".json")).sort((a, b) => a.localeCompare(b));
  const products = [];
  const errors = [];
  const usedSlugs = new Set();
  let n = 0;

  for (const name of jsonFiles) {
    n += 1;
    if (n % 1000 === 0) console.error(`… ${n}/${jsonFiles.length} (valides: ${products.length})`);
    try {
      const buf = await readFile(join(INPUT_DIR, name), "utf-8");
      const raw = JSON.parse(buf);
      products.push(mapFiche(raw, usedSlugs));
    } catch (e) {
      errors.push({ file: name, message: e instanceof Error ? e.message : String(e) });
    }
  }

  products.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  const selectedProducts = Number.isFinite(limit) ? products.slice(0, limit) : products;

  await mkdir(OUTPUT_DIR, { recursive: true });
  const out = {
    site: "lepiondor",
    type: "products",
    generated_at: new Date().toISOString(),
    ...(Number.isFinite(limit) ? { limit } : {}),
    products: selectedProducts,
  };
  await writeFile(OUTPUT_FILE, JSON.stringify(out, null, 0), "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        products: selectedProducts.length,
        limit: Number.isFinite(limit) ? limit : null,
        errors: errors.length,
        output: OUTPUT_FILE,
      },
      null,
      2
    )
  );
  if (errors.length > 0) {
    console.error("Exemples d’erreurs (max 15):");
    for (const e of errors.slice(0, 15)) console.error(`  ${e.file}: ${e.message}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
