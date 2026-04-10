import { searchProducts } from "@affiliate/search";
import { limitOrThrow } from "@/lib/rate-limit";
import { siteId } from "@/lib/site";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Plus généreux que /api/go : la recherche peut solliciter souvent (debounce côté client).
    await limitOrThrow(
      `search:${req.headers.get("x-forwarded-for") ?? "local"}`,
      200,
      60
    );
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ hits: [] });
  }
  const res = await searchProducts(siteId, q, 20);
  return NextResponse.json(res);
}
