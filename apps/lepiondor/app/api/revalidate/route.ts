import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { limitOrThrow } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    await limitOrThrow("revalidate", 30, 60);
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const secret = req.headers.get("x-revalidate-secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { path?: string } | null;
  const path = body?.path;
  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true });
}
