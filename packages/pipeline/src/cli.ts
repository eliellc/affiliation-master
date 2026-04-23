#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { prisma } from "@affiliate/db";
import { importProducts } from "./import-products";
import { importArticles } from "./import-articles";
import { reindexSiteProducts } from "./index-site";
import { writeImportLog } from "./import-log";
import { ProductsFileSchema, ArticlesFileSchema } from "./schemas";
import { productsJsonPath, articlesJsonPath } from "./paths";
import { wipeSiteCatalog } from "./wipe-catalog";

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a?.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function errorRate(errors: number, records: number): number {
  if (records === 0) return 0;
  return errors / records;
}

async function cmdValidate(site: string) {
  const pPath = productsJsonPath(site);
  const aPath = articlesJsonPath(site);
  const pRaw = await readFile(pPath, "utf-8").catch(() => null);
  const aRaw = await readFile(aPath, "utf-8").catch(() => null);
  if (pRaw) {
    ProductsFileSchema.parse(JSON.parse(pRaw));
  }
  if (aRaw) {
    ArticlesFileSchema.parse(JSON.parse(aRaw));
  }
  if (!pRaw && !aRaw) {
    throw new Error(`No products.json or articles.json under data/${site}/`);
  }
}

function pickCommand(argv: string[]): string | undefined {
  const known = new Set(["import", "validate", "index", "wipe"]);
  return argv.find((a) => known.has(a));
}

function argsAfterCommand(argv: string[], cmd: string): string[] {
  const i = argv.indexOf(cmd);
  if (i < 0) return argv;
  return [...argv.slice(0, i), ...argv.slice(i + 1)];
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = pickCommand(argv);
  if (!cmd) {
    throw new Error("Usage: pipeline <import|validate|index|wipe> [--site id] ...");
  }
  const rest = argsAfterCommand(argv, cmd);
  const args = parseArgs(rest);

  const site = args.site;
  if (typeof site !== "string" || !site) {
    throw new Error("Missing --site <siteId>");
  }

  const dryRun = args["dry-run"] === true;
  const skipSearch = args["skip-search"] === true;
  const skipRevalidate = args["skip-revalidate"] === true;
  const source = args.source === "fiches" || args.source === "json" ? args.source : undefined;
  const limit =
    typeof args.limit === "string" && Number.isFinite(Number.parseInt(args.limit, 10))
      ? Number.parseInt(args.limit, 10)
      : undefined;

  if (cmd === "validate") {
    await cmdValidate(site);
    return;
  }

  if (cmd === "index") {
    const n = await reindexSiteProducts(prisma, site);
    console.log(`Indexed ${n} products for ${site}`);
    return;
  }

  if (cmd === "wipe") {
    if (dryRun) {
      console.log(JSON.stringify({ site, wipe: "dry-run (no changes)" }, null, 2));
      return;
    }
    await wipeSiteCatalog(prisma, site);
    console.log(JSON.stringify({ site, wiped: true }, null, 2));
    return;
  }

  if (cmd !== "import") {
    throw new Error(`Unknown command: ${cmd}`);
  }

  const type = args.type;
  if (typeof type !== "string" || !["products", "articles", "all"].includes(type)) {
    throw new Error('import requires --type products|articles|all');
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;
  let records = 0;
  const details: Record<string, unknown> = {};

  if (type === "products" || type === "all") {
    const r = await importProducts(prisma, site, {
      dryRun,
      skipSearch: dryRun || skipSearch,
      skipRevalidate: dryRun || skipRevalidate,
      source,
      limit,
    });
    inserted += r.inserted;
    updated += r.updated;
    errors += r.errors;
    records += r.records;
    details.products = r;
  }

  if (type === "articles" || type === "all") {
    const r = await importArticles(prisma, site, { dryRun, skipRevalidate: dryRun });
    inserted += r.inserted;
    updated += r.updated;
    errors += r.errors;
    records += r.records;
    details.articles = r;
  }

  const status: "success" | "partial" | "error" =
    errorRate(errors, records) > 0.1 ? "error" : errors > 0 ? "partial" : "success";

  if (!dryRun) {
    await writeImportLog(prisma, {
      siteId: site,
      filename: `${type}.json`,
      status,
      inserted,
      updated,
      errors,
      details,
    });
  }

  console.log(
    JSON.stringify(
      {
        site,
        type,
        dryRun,
        inserted,
        updated,
        errors,
        records,
        status,
      },
      null,
      2
    )
  );

  if (errorRate(errors, records) > 0.1) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
