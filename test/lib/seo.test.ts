import { describe, it, expect } from "vitest";
import { defaultMeta, searchMeta, packageMeta, docsMeta, escapeHtml } from "../../src/lib/seo";
import type { PackageDetail } from "../../src/lib/types";

describe("seo", () => {
  describe("defaultMeta", () => {
    it("returns site name in title", () => {
      const meta = defaultMeta();
      expect(meta.title).toContain("getctx.org");
      expect(meta.type).toBe("website");
      expect(meta.url).toBe("https://getctx.org");
    });
  });

  describe("searchMeta", () => {
    it("includes query in title", () => {
      const meta = searchMeta("code review");
      expect(meta.title).toContain("code review");
      expect(meta.title).toContain("getctx.org");
    });

    it("returns raw query (JSX handles escaping at render time)", () => {
      const meta = searchMeta('<script>alert("xss")</script>');
      expect(meta.title).toContain("<script>");
      expect(meta.url).toContain(encodeURIComponent('<script>alert("xss")</script>'));
    });

    it("truncates very long queries", () => {
      const longQuery = "a".repeat(200);
      const meta = searchMeta(longQuery);
      expect(meta.title.length).toBeLessThan(250);
    });
  });

  describe("packageMeta", () => {
    const pkg: PackageDetail = {
      full_name: "hong/my-skill",
      type: "skill",
      description: "A test skill for code review",
      license: "MIT",
      repository: "",
      keywords: [],
      platforms: [],
      downloads: 100,
      versions: [],
      created_at: "2026-01-01",
      updated_at: "2026-03-27",
    };

    it("uses package name as title", () => {
      const meta = packageMeta(pkg);
      expect(meta.title).toContain("hong/my-skill");
      expect(meta.type).toBe("article");
    });

    it("uses description", () => {
      const meta = packageMeta(pkg);
      expect(meta.description).toContain("code review");
    });

    it("returns raw description (JSX handles escaping at render time)", () => {
      const xssPkg = { ...pkg, description: '<img onerror="alert(1)">' };
      const meta = packageMeta(xssPkg);
      expect(meta.description).toBe('<img onerror="alert(1)">');
    });

    it("handles empty description", () => {
      const emptyPkg = { ...pkg, description: "" };
      const meta = packageMeta(emptyPkg);
      expect(meta.description).toContain("hong/my-skill");
    });
  });

  describe("docsMeta", () => {
    it("returns docs title without section", () => {
      const meta = docsMeta();
      expect(meta.title).toContain("Docs");
    });

    it("includes section in title", () => {
      const meta = docsMeta("spec");
      expect(meta.title).toContain("spec");
    });
  });

  describe("escapeHtml", () => {
    it("escapes all special characters", () => {
      expect(escapeHtml('<script>"hello"&\'test\'')).toBe(
        "&lt;script&gt;&quot;hello&quot;&amp;&#39;test&#39;",
      );
    });

    it("handles empty string", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("passes through safe strings", () => {
      expect(escapeHtml("hello world")).toBe("hello world");
    });
  });
});
