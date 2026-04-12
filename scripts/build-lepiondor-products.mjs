#!/usr/bin/env node
/**
 * Agrège INPUT-DATA-ELIE/lepiondor/fiches-jeux/*-article.json
 * → data/lepiondor/products.json (format pipeline).
 *
 * Usage : node scripts/build-lepiondor-products.mjs [--limit 1000]
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const INPUT_DIR = join(repoRoot, "INPUT-DATA-ELIE", "lepiondor", "fiches-jeux");
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

function categoryPathsFromBreadcrumb(breadcrumb) {
  if (!Array.isArray(breadcrumb) || breadcrumb.length === 0) {
    return ["non-classe"];
  }
  const segments = breadcrumb.map((b) => slugifySegment(String(b))).filter(Boolean);
  if (segments.length === 0) return ["non-classe"];
  const paths = [];
  let acc = "";
  for (const seg of segments) {
    acc = acc ? `${acc}/${seg}` : seg;
    paths.push(acc);
  }
  return [paths[paths.length - 1]];
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
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (images.length === 0) throw new Error("pas d’image https");
  if (!url || !/^https?:\/\//i.test(url)) throw new Error("url manquante ou invalide");
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) throw new Error("title vide");

  const slug = productSlug(raw, usedSlugs);
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`slug invalide: ${slug}`);

  const categories = categoryPathsFromBreadcrumb(raw.breadcrumb);
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
    Array.isArray(raw.breadcrumb) && raw.breadcrumb.length > 0
      ? String(raw.breadcrumb[raw.breadcrumb.length - 1]).trim()
      : undefined;

  return {
    slug,
    title,
    description,
    content,
    price: parsePrice(raw.price),
    currency: "EUR",
    affiliate_url: url,
    images,
    in_stock: true,
    brand: brand || undefined,
    ean: raw.ean != null ? String(raw.ean).trim() : undefined,
    categories,
    meta_title: truncate(raw.meta_title, 70),
    meta_desc: truncate(raw.meta_description, 160),
  };
}

function parseLimit() {
  const i = process.argv.indexOf("--limit");
  if (i === -1 || process.argv[i + 1] === undefined) return Infinity;
  const n = Number.parseInt(process.argv[i + 1], 10);
  return Number.isFinite(n) && n > 0 ? n : Infinity;
}

async function main() {
  const limit = parseLimit();

  let names;
  try {
    names = await readdir(INPUT_DIR);
  } catch (e) {
    console.error("Dossier introuvable:", INPUT_DIR);
    console.error("Vérifie que INPUT-DATA-ELIE/lepiondor/fiches-jeux existe.");
    process.exit(1);
  }

  const jsonFiles = names.filter((n) => n.endsWith(".json")).sort((a, b) => a.localeCompare(b));
  const products = [];
  const errors = [];
  const usedSlugs = new Set();
  let n = 0;

  for (const name of jsonFiles) {
    if (Number.isFinite(limit) && products.length >= limit) break;
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

  await mkdir(OUTPUT_DIR, { recursive: true });
  const out = {
    site: "lepiondor",
    type: "products",
    generated_at: new Date().toISOString(),
    ...(Number.isFinite(limit) ? { limit } : {}),
    products,
  };
  await writeFile(OUTPUT_FILE, JSON.stringify(out, null, 0), "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        products: products.length,
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
