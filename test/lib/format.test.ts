import { describe, it, expect } from "vitest";
import { formatNumber, formatDate } from "../../src/lib/format";

describe("formatNumber", () => {
  it("formats small numbers without commas", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(999)).toBe("999");
  });

  it("adds commas for thousands", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(45000)).toBe("45,000");
    expect(formatNumber(999999)).toBe("999,999");
  });

  it("adds commas for millions", () => {
    expect(formatNumber(1000000)).toBe("1,000,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("formatDate", () => {
  it("formats ISO date strings as YYYY-MM-DD", () => {
    expect(formatDate("2026-03-27T10:00:00Z")).toBe("2026-03-27");
    expect(formatDate("2026-01-01")).toBe("2026-01-01");
  });

  it("returns input for invalid dates", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});
