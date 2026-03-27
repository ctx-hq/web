import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const WORKFLOW_PATH = resolve(
  import.meta.dirname,
  "../../.github/workflows/ci-deploy.yml"
);

describe("ci-deploy workflow", () => {
  let content: string;

  beforeAll(() => {
    expect(existsSync(WORKFLOW_PATH)).toBe(true);
    content = readFileSync(WORKFLOW_PATH, "utf-8");
  });

  // ── Structure ──

  it("defines both ci and deploy jobs", () => {
    expect(content).toContain("ci:");
    expect(content).toContain("deploy:");
  });

  it("deploy job depends on ci", () => {
    expect(content).toContain("needs: ci");
  });

  // ── Triggers ──

  it("triggers on push to main", () => {
    expect(content).toMatch(/on:[\s\S]*push:[\s\S]*branches:.*main/);
  });

  it("triggers on pull_request to main", () => {
    expect(content).toMatch(/on:[\s\S]*pull_request:[\s\S]*branches:.*main/);
  });

  // ── Safety ──

  it("has concurrency control to prevent parallel deploys", () => {
    expect(content).toContain("concurrency:");
    expect(content).toContain("cancel-in-progress: true");
  });

  it("sets timeout on jobs to prevent runaway builds", () => {
    expect(content).toContain("timeout-minutes:");
  });

  // ── Dependencies ──

  it("pins Node.js version", () => {
    expect(content).toMatch(/NODE_VERSION:\s*["']?\d+["']?/);
  });

  it("uses frozen lockfile for reproducible installs", () => {
    expect(content).toContain("--frozen-lockfile");
  });

  // ── CI Steps ──

  it("runs tests before deploy", () => {
    expect(content).toContain("pnpm test");
  });

  it("runs type checking", () => {
    expect(content).toContain("pnpm typecheck");
  });

  it("runs build", () => {
    expect(content).toContain("pnpm build");
  });

  // ── Deploy ──

  it("references secrets for Cloudflare authentication", () => {
    expect(content).toContain("secrets.CLOUDFLARE_API_TOKEN");
    expect(content).toContain("secrets.CLOUDFLARE_ACCOUNT_ID");
  });

  it("deploys to Cloudflare Pages", () => {
    expect(content).toContain("pages deploy");
  });

  it("includes CDN cache purge for production", () => {
    expect(content).toContain("purge_cache");
  });

  it("CDN purge is non-blocking", () => {
    expect(content).toContain("continue-on-error: true");
  });

  // ── PR Preview ──

  it("supports PR preview deployments", () => {
    expect(content).toContain("pull_request");
    expect(content).toContain("preview");
  });

  // ── Permissions (least privilege) ──

  it("restricts permissions to minimum required", () => {
    expect(content).toContain("contents: read");
    expect(content).toContain("pull-requests: write");
  });
});
