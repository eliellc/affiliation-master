export async function triggerRevalidate(paths: string[]): Promise<void> {
  const base = process.env.REVALIDATE_BASE_URL ?? process.env.SITE_DOMAIN ?? "";
  const secret = process.env.REVALIDATE_SECRET ?? "";
  if (!base || !secret) {
    return;
  }
  const url = `${base.replace(/\/$/, "")}/api/revalidate`;
  for (const path of paths) {
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": secret,
        },
        body: JSON.stringify({ path }),
      });
    } catch {
      /* optional */
    }
  }
}
