import { Marked, type Token } from "marked";
import { escapeHtml } from "./seo";

/** Only allow safe URL schemes in markdown links/images. */
export function sanitizeUrl(href: string): string {
  try {
    const url = new URL(href, "https://placeholder.invalid");
    if (url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:") {
      return href;
    }
  } catch { /* invalid URL */ }
  return "";
}

/**
 * HTML tag allowlist for README rendering.
 * Only structurally safe tags are permitted — no script, iframe, form, etc.
 */
const ALLOWED_HTML_RE = /^<\/?(details|summary|br|hr|kbd|sup|sub|abbr|mark|del|ins|small|picture|source|video|audio|figcaption|figure|dl|dt|dd|table|thead|tbody|tfoot|tr|th|td|caption|colgroup|col)(\s[^>]*)?\s*\/?>$/i;
const HTML_COMMENT_RE = /^<!--[\s\S]*?-->$/;

/** Marked instance with raw HTML filtered and dangerous URL schemes stripped. */
export const safeMarked = new Marked();
safeMarked.use({
  renderer: {
    html(token) {
      const text = token.text.trim();
      // Strip HTML comments entirely
      if (HTML_COMMENT_RE.test(text)) return "";
      // Allow safe structural HTML tags
      if (ALLOWED_HTML_RE.test(text)) return token.text;
      // Multi-tag lines: allow if every tag in the line is safe
      const tags = text.match(/<\/?[a-z][^>]*>/gi);
      if (tags && tags.every(t => ALLOWED_HTML_RE.test(t.trim()))) return token.text;
      return escapeHtml(token.text);
    },
    link(token) {
      const href = sanitizeUrl(token.href);
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      const inner = this.parser.parseInline(token.tokens);
      return href
        ? `<a href="${escapeHtml(href)}"${title}>${inner}</a>`
        : inner;
    },
    table(token) {
      const align = (a: string | null) => a ? ` style="text-align:${a}"` : "";
      const ths = token.header.map((c: { tokens: Token[]; align: string | null }) =>
        `<th${align(c.align)}>${this.parser.parseInline(c.tokens)}</th>`).join("");
      const rows = token.rows.map((row: { tokens: Token[]; align: string | null }[]) =>
        `<tr>${row.map((c) => `<td${align(c.align)}>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`).join("\n");
      return `<div class="table-wrapper"><table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table></div>`;
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
