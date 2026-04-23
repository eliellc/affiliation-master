import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  buildBreadcrumb,
  getCategoryByPath,
  getProductsByCategory,
  listCategoriesForSite,
} from "@affiliate/product-engine";
import { ProductList } from "@affiliate/ui";
import { toCardProduct } from "@affiliate/content-engine";
import {
  categoryListPublicPath,
  categoryPageMetadata,
  JsonLd,
  PaginationLinks,
  breadcrumbSchema,
} from "@affiliate/seo";
import { siteConfig } from "../../../config";
import { logDbError } from "../../../lib/log-db-error";
import { siteId } from "../../../lib/site";
import styles from "./category-page.module.css";
import categoryDescriptionRows from "../../../data/categories-lepiondor.json";

export const revalidate = 3600;

const FILTER_KEYS = ["brand", "price", "rating", "sort"];

type CategoryDescriptionRow = {
  slug: string;
  description: string;
};

function normalizeCategoryPath(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

/** Copie versionnée de INPUT-DATA-ELIE/lepiondor (dossier ignoré par git, absent en prod). */
const CATEGORY_DESCRIPTIONS_BY_PATH = new Map<string, string>(
  (categoryDescriptionRows as CategoryDescriptionRow[]).map((row) => [
    normalizeCategoryPath(row.slug),
    row.description,
  ])
);

function categoryEditorialDescription(dbPath: string): string | undefined {
  const key = normalizeCategoryPath(dbPath);
  const direct = CATEGORY_DESCRIPTIONS_BY_PATH.get(key);
  if (direct) return direct;
  const leaf = key.split("/").filter(Boolean).pop();
  if (leaf) return CATEGORY_DESCRIPTIONS_BY_PATH.get(leaf);
  return undefined;
}

function titleFromCategoryPath(categoryPath: string): string {
  const leaf = categoryPath.split("/").filter(Boolean).pop() ?? categoryPath;
  return leaf
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const path = params.path.join("/");
  const hasFilters = FILTER_KEYS.some((k) => searchParams[k] !== undefined);
  try {
    const category = await getCategoryByPath(siteId, path);
    if (!category) {
      return { title: "Catégorie" };
    }
    const customDescription =
      categoryEditorialDescription(category.path) ?? category.description;
    return categoryPageMetadata(
      siteConfig,
      category.path,
      category.name,
      customDescription,
      category.metaTitle,
      category.metaDesc,
      hasFilters
    );
  } catch (err) {
    logDbError(`metadata:${path}`, err);
    return { title: titleFromCategoryPath(path) };
  }
}

export default async function CategoryPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const path = params.path.join("/");
  const page = Math.max(1, Number(typeof searchParams.page === "string" ? searchParams.page : "1"));
  const hasFilters = FILTER_KEYS.some((k) => searchParams[k] !== undefined);

  let category: Awaited<ReturnType<typeof getCategoryByPath>> = null;
  let dbUnavailable = false;
  try {
    category = await getCategoryByPath(siteId, path);
  } catch (err) {
    logDbError(`getCategoryByPath:${path}`, err);
    dbUnavailable = true;
  }

  if (!dbUnavailable && !category) {
    notFound();
  }

  const segments = buildBreadcrumb(path);

  if (dbUnavailable) {
    const catRows = segments.map((pth) => ({
      path: pth,
      name: titleFromCategoryPath(pth.split("/").pop() ?? pth),
    }));
    const displayName = catRows.at(-1)?.name ?? titleFromCategoryPath(path);
    return (
      <div className={styles.page}>
        <JsonLd data={breadcrumbSchema(path, siteConfig, catRows)} />
        <div className={styles.heroStack}>
          <nav className={styles.bcBar} aria-label="Fil d'ariane">
            <ol className={styles.bc}>
              <li>
                <Link href="/">Accueil</Link>
              </li>
              {catRows.map((c) => (
                <li key={c.path}>
                  <Link href={categoryListPublicPath(c.path)}>{c.name}</Link>
                </li>
              ))}
            </ol>
          </nav>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>Comparatif et avis 2026</p>
            <h1 className={styles.title}>{displayName}</h1>
            <p className={styles.warning}>
              Le catalogue ne peut pas être chargé (erreur de connexion à la base ou configuration). Vérifiez
              sur Vercel que <code>DATABASE_URL</code> pointe vers le pooler Supabase (port 6543) avec{" "}
              <code>pgbouncer=true</code> et <code>connection_limit=1</code>, puis consultez les journaux de
              déploiement (recherche <code>[lepiondor:db:</code>) pour le message d’erreur exact.
            </p>
          </section>
        </div>
        <section className={styles.resultsSection}>
          <div className={styles.resultsHead}>
            <h2 className={styles.resultsTitle}>Sélection indisponible</h2>
          </div>
          <ProductList products={[]} site={siteConfig} />
        </section>
      </div>
    );
  }

  let items: Awaited<ReturnType<typeof getProductsByCategory>>["items"] = [];
  let total = 0;
  let pageSize = 24;
  try {
    const r = await getProductsByCategory(siteId, path, { page });
    items = r.items;
    total = r.total;
    pageSize = r.pageSize;
  } catch (err) {
    logDbError(`getProductsByCategory:${path}`, err);
  }
  const products = items.map((p) => toCardProduct(p, { preferredCategoryPath: path }));

  let allCats: Awaited<ReturnType<typeof listCategoriesForSite>> = [];
  try {
    allCats = await listCategoriesForSite(siteId);
  } catch (err) {
    logDbError(`listCategoriesForSite`, err);
    allCats = [];
  }

  const catRows = segments.map((pth) => {
    const c = allCats.find((x) => x.path === pth);
    return {
      path: pth,
      name: c?.name ?? titleFromCategoryPath(pth.split("/").pop() ?? pth),
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canonicalPath = categoryListPublicPath(path);

  return (
    <div className={styles.page}>
      <PaginationLinks
        prev={
          !hasFilters && page > 1 ? `${canonicalPath}?page=${page - 1}` : undefined
        }
        next={
          !hasFilters && page < totalPages ? `${canonicalPath}?page=${page + 1}` : undefined
        }
      />
      <JsonLd data={breadcrumbSchema(path, siteConfig, catRows)} />
      <div className={styles.heroStack}>
        <nav className={styles.bcBar} aria-label="Fil d'ariane">
          <ol className={styles.bc}>
            <li>
              <Link href="/">Accueil</Link>
            </li>
            {catRows.map((c) => (
              <li key={c.path}>
                <Link href={categoryListPublicPath(c.path)}>{c.name}</Link>
              </li>
            ))}
          </ol>
        </nav>
        <section className={styles.hero}>
          <h1 className={styles.title}>{category!.name}</h1>
        </section>
      </div>

      <section className={styles.toolsWrap} aria-label="Filtres visuels">
        <div className={styles.toolGroup}>
          <span className={styles.toolLabel}>Prix</span>
          <button type="button" className={styles.chip}>
            0€ - 500€
          </button>
          <button type="button" className={styles.chip}>
            500€ - 1200€
          </button>
          <button type="button" className={styles.chip}>
            1200€+
          </button>
        </div>
        <div className={styles.toolGroup}>
          <span className={styles.toolLabel}>Style</span>
          <button type="button" className={styles.chip}>
            Design
          </button>
          <button type="button" className={styles.chip}>
            Scandinave
          </button>
          <button type="button" className={styles.chip}>
            Contemporain
          </button>
        </div>
        <label className={styles.selectWrap}>
          Trier
          <select className={styles.select}>
            <option>Pertinence</option>
            <option>Prix croissant</option>
            <option>Prix decroissant</option>
          </select>
        </label>
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.resultsHead}>
          <h2 className={styles.resultsTitle}>Nos tests {category!.name}</h2>
          <p className={styles.resultsCount}>
            Page {page} sur {totalPages}
          </p>
        </div>
        <ProductList products={products} site={siteConfig} />
      </section>

      <div className={styles.pagination}>
        <p className={styles.paginationMeta}>Navigation des resultats</p>
        <div className={styles.paginationLinks}>
          {page > 1 ? (
            <Link className={styles.pagerLink} href={`${canonicalPath}?page=${page - 1}`}>
              Page precedente
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link className={styles.pagerLink} href={`${canonicalPath}?page=${page + 1}`}>
              Page suivante
            </Link>
          ) : null}
        </div>
      </div>

      <section className={styles.editorialGrid}>
        <article className={styles.editorialCard}>
          <p className={styles.editorialEyebrow}>Pourquoi choisir</p>
          <h2 className={styles.editorialTitle}>Notre analyse des {category!.name}</h2>
          <p className={styles.editorialText}>
            Nous comparons les modeles selon la qualite de fabrication, le confort sur la duree, les retours
            clients et le positionnement tarifaire pour vous aider a choisir rapidement.
          </p>
        </article>
        <article className={styles.editorialCard}>
          <p className={styles.editorialEyebrow}>Methodologie</p>
          <h2 className={styles.editorialTitle}>Comment nous notons chaque modele</h2>
          <p className={styles.editorialText}>
            Chaque fiche produit est normalisee pour isoler les points forts, les limites et la cible d'usage
            ideale. Le score final met l'accent sur l'equilibre entre style, fiabilite et prix.
          </p>
        </article>
      </section>
    </div>
  );
}
