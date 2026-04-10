import type { ProductCardProduct } from "./product-card";

function criterionValue(
  product: ProductCardProduct,
  key: string
): string {
  switch (key) {
    case "prix":
      return product.price != null ? `${product.price.toFixed(2)} ${product.currency}` : "—";
    case "nombre_de_pieces":
      return "—";
    case "difficulte":
      return "—";
    case "age_recommande":
      return "—";
    default:
      return "—";
  }
}

export function ComparisonTable(props: {
  products: ProductCardProduct[];
  criteria: string[];
}) {
  const { products, criteria } = props;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ccc" }} />
            {products.map((p) => (
              <th
                key={p.slug}
                style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ccc" }}
              >
                {p.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => (
            <tr key={c}>
              <td style={{ padding: 8, fontWeight: 600, borderBottom: "1px solid #eee" }}>{c}</td>
              {products.map((p) => (
                <td key={p.slug} style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {criterionValue(p, c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
