import { describe, it, expect } from "vitest";
import { Marked } from "marked";
import { escapeHtml } from "../../src/lib/seo";

/** Same sanitized Marked config as src/index.tsx */
function createSafeMarked() {
  const m = new Marked();
  m.use({
    renderer: {
      html(token) {
        return escapeHtml(token.text);
      },
    },
  });
  return m;
}

describe("markdown XSS prevention", () => {
  const safeMarked = createSafeMarked();

  it("escapes script tags in README markdown", async () => {
    const html = await safeMarked.parse('<script>alert("xss")</script>');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes img onerror payloads", async () => {
    const html = await safeMarked.parse('<img onerror="alert(1)" src="x">');
    // Raw HTML is escaped: <img becomes &lt;img — browser won't execute the tag
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("escapes event handler attributes in raw HTML", async () => {
    const html = await safeMarked.parse('<div onmouseover="alert(1)">hover</div>');
    // The entire raw HTML block is escaped, so no actual <div> tag is rendered
    expect(html).not.toContain("<div");
    expect(html).toContain("&lt;div");
  });

  it("preserves normal markdown rendering", async () => {
    const html = await safeMarked.parse("# Hello\n\nThis is **bold** and [a link](https://example.com).");
    expect(html).toContain("<h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://example.com"');
  });

  it("renders code blocks normally", async () => {
    const html = await safeMarked.parse("```js\nconsole.log('hello');\n```");
    expect(html).toContain("<pre><code");
    expect(html).toContain("console.log");
  });
});
