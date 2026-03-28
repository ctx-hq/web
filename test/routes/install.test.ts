import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../../src/index";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const ENV = { API_BASE_URL: "https://api.test", GITHUB_CLIENT_ID: "test-id" };

function req(path: string) {
  return app.request(path, {}, ENV);
}

function scriptResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

describe("install script proxy routes", () => {
  describe("GET /install.sh", () => {
    it("serves install.sh with correct content-type", async () => {
      mockFetch.mockResolvedValueOnce(scriptResponse("#!/bin/sh\necho hello"));

      const res = await req("/install.sh");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/plain");
      const body = await res.text();
      expect(body).toContain("#!/bin/sh");
    });

    it("serves install.sh with cache headers", async () => {
      mockFetch.mockResolvedValueOnce(scriptResponse("#!/bin/sh\n"));

      const res = await req("/install.sh");
      expect(res.status).toBe(200);
      const cache = res.headers.get("Cache-Control");
      expect(cache).toContain("s-maxage=3600");
      expect(cache).toContain("stale-while-revalidate=86400");
    });

    it("serves install.sh with nosniff header", async () => {
      mockFetch.mockResolvedValueOnce(scriptResponse("#!/bin/sh\n"));

      const res = await req("/install.sh");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    it("serves install.sh with noindex robot tag", async () => {
      mockFetch.mockResolvedValueOnce(scriptResponse("#!/bin/sh\n"));

      const res = await req("/install.sh");
      expect(res.headers.get("X-Robots-Tag")).toContain("noindex");
    });

    it("returns 502 when upstream fails with HTTP error", async () => {
      mockFetch.mockResolvedValueOnce(new Response("Not Found", { status: 404 }));

      const res = await req("/install.sh");
      expect(res.status).toBe(502);
      const body = await res.text();
      expect(body).toContain("Failed to fetch install script");
      expect(body).toContain("raw.githubusercontent.com");
    });

    it("returns 502 when upstream network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("network timeout"));

      const res = await req("/install.sh");
      expect(res.status).toBe(502);
      const body = await res.text();
      expect(body).toContain("temporarily unavailable");
      expect(body).toContain("raw.githubusercontent.com");
    });

    it("fetches from correct GitHub raw URL", async () => {
      mockFetch.mockResolvedValueOnce(scriptResponse("#!/bin/sh\n"));

      await req("/install.sh");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/ctx-hq/ctx/main/scripts/install.sh",
        expect.objectContaining({
          headers: expect.objectContaining({ "User-Agent": "getctx.org/install-proxy" }),
        }),
      );
    });
  });

  describe("GET /install.ps1", () => {
    it("serves install.ps1 with correct content-type", async () => {
      // First call may be from another route (API mock), install.ps1 fetches from GitHub
      mockFetch.mockResolvedValueOnce(
        scriptResponse("$ErrorActionPreference = 'Stop'\nWrite-Host 'hello'"),
      );

      const res = await req("/install.ps1");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/plain");
      const body = await res.text();
      expect(body).toContain("ErrorActionPreference");
    });

    it("returns 502 when upstream fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("connection refused"));

      const res = await req("/install.ps1");
      expect(res.status).toBe(502);
      const body = await res.text();
      expect(body).toContain("temporarily unavailable");
    });

    it("fetches from correct GitHub raw URL", async () => {
      mockFetch.mockResolvedValueOnce(scriptResponse("# ps1 script"));

      await req("/install.ps1");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/ctx-hq/ctx/main/scripts/install.ps1",
        expect.anything(),
      );
    });
  });

  describe("security headers", () => {
    it("install.sh returns nosniff and noindex", async () => {
      mockFetch.mockResolvedValueOnce(scriptResponse("script content"));
      const res = await req("/install.sh");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("X-Robots-Tag")).toContain("noindex");
    });

    it("install.ps1 returns nosniff and noindex", async () => {
      mockFetch.mockResolvedValueOnce(scriptResponse("script content"));
      const res = await req("/install.ps1");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("X-Robots-Tag")).toContain("noindex");
    });
  });
});
