/**
 * rel=prev/next pour la pagination SEO (HTML5: balises link autorisées dans le body).
 */
export function PaginationLinks(props: { prev?: string; next?: string }) {
  const { prev, next } = props;
  if (!prev && !next) return null;
  return (
    <>
      {prev ? <link rel="prev" href={prev} /> : null}
      {next ? <link rel="next" href={next} /> : null}
    </>
  );
}
