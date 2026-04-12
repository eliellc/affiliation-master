/** Journalise une erreur DB côté serveur (visible dans Vercel → Logs). Ne loggue pas les secrets. */
export function logDbError(scope: string, err: unknown): void {
  if (err instanceof Error) {
    const code = "code" in err && typeof (err as { code?: string }).code === "string"
      ? (err as { code: string }).code
      : undefined;
    console.error(`[lepiondor:db:${scope}]`, err.name, code ?? "", err.message);
    return;
  }
  console.error(`[lepiondor:db:${scope}]`, err);
}
