import { describe, it, expect } from "vitest";
import { VALID_DOC_SECTIONS } from "../../src/pages/docs";

describe("docs section validation", () => {
  it("exports valid doc sections", () => {
    expect(VALID_DOC_SECTIONS).toContain("spec");
    expect(VALID_DOC_SECTIONS).toContain("api");
    expect(VALID_DOC_SECTIONS).toContain("publish");
    expect(VALID_DOC_SECTIONS).toContain("getting-started");
  });

  it("rejects unknown sections", () => {
    expect(VALID_DOC_SECTIONS.includes("nonexistent")).toBe(false);
    expect(VALID_DOC_SECTIONS.includes("<script>")).toBe(false);
  });
});
