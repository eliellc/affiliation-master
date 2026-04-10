"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Hit = { slug: string; title: string; price?: number; rating?: number };

export function SearchClient() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        if (!q.trim()) {
          setHits([]);
          return;
        }
        setLoading(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
          const data = (await res.json()) as { hits?: Hit[] };
          setHits((data.hits as Hit[]) ?? []);
        } finally {
          setLoading(false);
        }
      })();
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <h1>Recherche</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un produit..."
        style={{ width: "100%", maxWidth: 480, padding: 12, fontSize: 16 }}
      />
      {loading ? <p>Chargement…</p> : null}
      <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
        {hits.map((h) => (
          <li key={h.slug} style={{ marginBottom: 12 }}>
            <Link href={`/produit/${h.slug}`} style={{ fontWeight: 600 }}>
              {h.title}
            </Link>
            {h.price != null ? <span style={{ marginLeft: 8 }}>{h.price.toFixed(2)} €</span> : null}
            {h.rating != null ? <span style={{ marginLeft: 8 }}>★ {h.rating}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
