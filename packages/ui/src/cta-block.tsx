import Link from "next/link";

export function CtaBlock(props: { text: string; url: string }) {
  return (
    <p style={{ margin: "24px 0" }}>
      <Link
        href={props.url}
        style={{
          display: "inline-block",
          padding: "12px 20px",
          background: "#111",
          color: "#fff",
          borderRadius: 6,
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        {props.text}
      </Link>
    </p>
  );
}
