import { prisma } from "@affiliate/db";
import { NextResponse } from "next/server";
import { limitOrThrow } from "@/lib/rate-limit";
import { siteId } from "@/lib/site";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    await limitOrThrow(`go:${req.headers.get("x-forwarded-for") ?? "local"}`, 120, 60);
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const params = await ctx.params;
  const product = await prisma.product.findFirst({
    where: { siteId, slug: params.slug },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.affiliateClick.create({
    data: {
      siteId,
      productId: product.id,
      referrer: req.headers.get("referer") ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
    },
  });

  return NextResponse.redirect(product.affiliateUrl, 302);
}
