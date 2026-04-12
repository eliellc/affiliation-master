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
  categoryPageMetadata,
  JsonLd,
  PaginationLinks,
  breadcrumbSchema,
} from "@affiliate/seo";
import { siteConfig } from "../../../config";
import { logDbError } from "../../../lib/log-db-error";
import { siteId } from "../../../lib/site";

export const revalidate = 3600;

const FILTER_KEYS = ["brand", "price", "rating", "sort"];

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
    return categoryPageMetadata(
      siteConfig,
      category.path,
      category.name,
      category.description,
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
      <div>
        <nav style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Accueil</Link>
          {catRows.map((c) => (
            <span key={c.path}>
              {" "}
              / <Link href={`/categorie/${c.path}`}>{c.name}</Link>
            </span>
          ))}
        </nav>
        <JsonLd data={breadcrumbSchema(path, siteConfig, catRows)} />
        <h1 style={{ color: siteConfig.theme.secondaryColor }}>{displayName}</h1>
        <p style={{ opacity: 0.85, maxWidth: 560 }}>
          Le catalogue ne peut pas être chargé (erreur de connexion à la base ou configuration). Vérifiez
          sur Vercel que <code>DATABASE_URL</code> pointe vers le pooler Supabase (port 6543) avec{" "}
          <code>pgbouncer=true</code> et <code>connection_limit=1</code>, puis consultez les journaux de
          déploiement (recherche <code>[lepiondor:db:</code>) pour le message d’erreur exact.
        </p>
        <ProductList products={[]} site={siteConfig} />
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
  const products = items.map((p) => toCardProduct(p));

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
  const canonicalPath = `/categorie/${path}`;

  return (
    <div>
      <PaginationLinks
        prev={
          !hasFilters && page > 1 ? `${canonicalPath}?page=${page - 1}` : undefined
        }
        next={
          !hasFilters && page < totalPages ? `${canonicalPath}?page=${page + 1}` : undefined
        }
      />
      <nav style={{ marginBottom: 16, fontSize: 14 }}>
        <Link href="/">Accueil</Link>
        {catRows.map((c) => (
          <span key={c.path}>
            {" "}
            / <Link href={`/categorie/${c.path}`}>{c.name}</Link>
          </span>
        ))}
      </nav>
      <JsonLd data={breadcrumbSchema(path, siteConfig, catRows)} />
      <h1 style={{ color: siteConfig.theme.secondaryColor }}>{category!.name}</h1>
      {category!.description ? <p>{category!.description}</p> : null}
      <ProductList products={products} site={siteConfig} />
      <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
        {page > 1 ? (
          <Link href={`${canonicalPath}?page=${page - 1}`}>Page précédente</Link>
        ) : null}
        {page < totalPages ? (
          <Link href={`${canonicalPath}?page=${page + 1}`}>Page suivante</Link>
        ) : null}
      </div>
    </div>
  );
}
