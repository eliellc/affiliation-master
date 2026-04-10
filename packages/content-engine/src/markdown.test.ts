import { describe, expect, it } from "vitest";
import { markdownToHtml } from "./markdown";

describe("markdownToHtml", () => {
  it("renders heading and strips script", async () => {
    const html = await markdownToHtml("## Hi\n\n<script>evil()</script>");
    expect(html).toContain("<h2");
    expect(html).not.toContain("script");
  });
});
