import type { PackageSummary, PackageDetail, SearchResult, VersionDetail } from "./types";

export class ApiClient {
  constructor(private baseUrl: string) {}

  async search(query: string, opts?: { type?: string; platform?: string; limit?: number; offset?: number }): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query });
    if (opts?.type) params.set("type", opts.type);
    if (opts?.platform) params.set("platform", opts.platform);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    return this.get(`/v1/search?${params}`);
  }

  async listPackages(opts?: { type?: string; sort?: string; limit?: number; offset?: number }): Promise<{ packages: PackageSummary[]; total: number }> {
    const params = new URLSearchParams();
    if (opts?.type) params.set("type", opts.type);
    if (opts?.sort) params.set("sort", opts.sort);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    return this.get(`/v1/packages?${params}`);
  }

  async getPackage(fullName: string): Promise<PackageDetail> {
    return this.get(`/v1/packages/${encodeURIComponent(fullName)}`);
  }

  async getVersion(fullName: string, version: string): Promise<VersionDetail> {
    return this.get(`/v1/packages/${encodeURIComponent(fullName)}/versions/${encodeURIComponent(version)}`);
  }

  private async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new ApiError(resp.status, body || `API error: ${resp.status}`);
    }
    return resp.json() as Promise<T>;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
