export function FaqBlock(props: { items: { question: string; answer: string }[] }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ marginBottom: 16 }}>FAQ</h2>
      <dl>
        {props.items.map((item) => (
          <div key={item.question} style={{ marginBottom: 16 }}>
            <dt style={{ fontWeight: 700 }}>{item.question}</dt>
            <dd style={{ margin: "8px 0 0 0", opacity: 0.95 }}>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
