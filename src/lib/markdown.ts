import { Marked } from "marked";
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
