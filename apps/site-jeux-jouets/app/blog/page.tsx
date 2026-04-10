import Link from "next/link";
import { listBlogArticles } from "@affiliate/product-engine";
import { siteId } from "../../lib/site";

type BlogListItem = Awaited<ReturnType<typeof listBlogArticles>>["items"][number];

export const revalidate = 3600;

export default async function BlogIndexPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "1"));
  let items: BlogListItem[] = [];
  let total = 0;
  let pageSize = 24;
  try {
    const r = await listBlogArticles(siteId, page);
    items = r.items;
    total = r.total;
    pageSize = r.pageSize;
  } catch {
    /* même comportement que la home : base absente ou injoignable */
  }

  return (
    <div>
      <h1>Blog</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((a) => (
          <li key={a.id} style={{ marginBottom: 16 }}>
            <Link href={`/blog/${a.slug}`} style={{ fontWeight: 600 }}>
              {a.title}
            </Link>
            {a.excerpt ? <p style={{ margin: "4px 0 0" }}>{a.excerpt}</p> : null}
          </li>
        ))}
      </ul>
      <p style={{ opacity: 0.8 }}>
        {total} article(s) — page {page} / {Math.max(1, Math.ceil(total / pageSize))}
      </p>
    </div>
  );
}
