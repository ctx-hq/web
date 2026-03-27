import { describe, it, expect } from "vitest";
import { Marked } from "marked";
import { escapeHtml } from "../../src/lib/seo";

/** Only allow safe URL schemes in markdown links/images — mirrors src/index.tsx. */
function sanitizeUrl(href: string): string {
  try {
    const url = new URL(href, "https://placeholder.invalid");
    if (url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:") {
      return href;
    }
  } catch { /* invalid URL */ }
  return "";
}

/** Same sanitized Marked config as src/index.tsx */
function createSafeMarked() {
  const m = new Marked();
  m.use({
    renderer: {
      html(token) {
        return escapeHtml(token.text);
      },
      link(token) {
        const href = sanitizeUrl(token.href);
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        return href
          ? `<a href="${escapeHtml(href)}"${title}>${token.text}</a>`
          : escapeHtml(token.text);
      },
      image(token) {
        const src = sanitizeUrl(token.href);
        const alt = escapeHtml(token.text);
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        return src
          ? `<img src="${escapeHtml(src)}" alt="${alt}"${title} />`
          : alt;
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

  it("strips javascript: scheme from markdown links", async () => {
    const html = await safeMarked.parse('[click me](javascript:alert(1))');
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain('href="javascript');
    expect(html).toContain("click me");
  });

  it("strips javascript: scheme from markdown images", async () => {
    const html = await safeMarked.parse('![alt](javascript:alert(1))');
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<img");
  });

  it("strips vbscript: and data: schemes from links", async () => {
    const vb = await safeMarked.parse('[x](vbscript:alert(1))');
    expect(vb).not.toContain("vbscript:");

    const data = await safeMarked.parse('[x](data:text/html,<script>alert(1)</script>)');
    expect(data).not.toContain("data:");
  });

  it("allows http, https, and mailto links", async () => {
    const html = await safeMarked.parse(
      '[a](https://example.com) [b](http://example.com) [c](mailto:a@b.com)'
    );
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="http://example.com"');
    expect(html).toContain('href="mailto:a@b.com"');
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
