import type {
  PackageSummary, PackageDetail, SearchResult, VersionDetail,
  PackageStats, PublisherProfile, OrgDetail, OrgMember, OrgInfo,
  AgentRanking, RegistryOverview, SyncProfileMeta, SyncPackageEntry,
} from "./types";

export class ApiClient {
  constructor(private baseUrl: string) {}

  // --- Package APIs ---

  async search(query: string, opts?: { type?: string; platform?: string; limit?: number; offset?: number }, token?: string | null): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query });
    if (opts?.type) params.set("type", opts.type);
    if (opts?.platform) params.set("platform", opts.platform);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    return this.get(`/v1/search?${params}`, token);
  }

  async listPackages(opts?: { type?: string; sort?: string; limit?: number; offset?: number }, token?: string | null): Promise<{ packages: PackageSummary[]; total: number }> {
    const params = new URLSearchParams();
    if (opts?.type) params.set("type", opts.type);
    if (opts?.sort) params.set("sort", opts.sort);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    return this.get(`/v1/packages?${params}`, token);
  }

  async getPackage(fullName: string, token?: string | null): Promise<PackageDetail> {
    return this.get(`/v1/packages/${encodeURIComponent(fullName)}`, token);
  }

  async getVersion(fullName: string, version: string, token?: string | null): Promise<VersionDetail> {
    return this.get(`/v1/packages/${encodeURIComponent(fullName)}/versions/${encodeURIComponent(version)}`, token);
  }

  // --- Stats APIs ---

  async getPackageStats(fullName: string, token?: string | null): Promise<PackageStats> {
    return this.get(`/v1/packages/${encodeURIComponent(fullName)}/stats`, token);
  }

  async getPackageTags(fullName: string): Promise<{ tags: Record<string, string> }> {
    return this.get(`/v1/packages/${encodeURIComponent(fullName)}/tags`);
  }

  async getTrending(limit = 20, token?: string | null): Promise<{ packages: PackageSummary[]; period: string }> {
    return this.get(`/v1/stats/trending?limit=${limit}`, token);
  }

  async getRegistryOverview(): Promise<RegistryOverview> {
    return this.get("/v1/stats/overview");
  }

  async getAgentRankings(): Promise<{ agents: AgentRanking[] }> {
    return this.get("/v1/stats/agents");
  }

  async getAgentDetail(agent: string): Promise<{ agent: string; total_installs: number; top_packages: PackageSummary[] }> {
    return this.get(`/v1/stats/agents/${encodeURIComponent(agent)}`);
  }

  // --- Publisher APIs ---

  async getPublisher(slug: string): Promise<PublisherProfile> {
    return this.get(`/v1/publishers/${encodeURIComponent(slug)}`);
  }

  async getPublisherPackages(slug: string, opts?: { type?: string; limit?: number; offset?: number }, token?: string | null): Promise<{ publisher: { slug: string; kind: string }; packages: PackageSummary[] }> {
    const params = new URLSearchParams();
    if (opts?.type) params.set("type", opts.type);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    return this.get(`/v1/publishers/${encodeURIComponent(slug)}/packages?${params}`, token);
  }

  // --- Org APIs ---

  async getOrg(name: string): Promise<OrgDetail> {
    return this.get(`/v1/orgs/${encodeURIComponent(name)}`);
  }

  async getOrgMembers(name: string, token: string): Promise<{ members: OrgMember[] }> {
    return this.get(`/v1/orgs/${encodeURIComponent(name)}/members`, token);
  }

  async getOrgPackages(name: string, token?: string | null): Promise<{ packages: PackageSummary[] }> {
    return this.get(`/v1/orgs/${encodeURIComponent(name)}/packages`, token);
  }

  async getMyOrgs(token: string): Promise<{ orgs: OrgInfo[] }> {
    return this.get("/v1/orgs", token);
  }

  // --- Sync APIs ---

  async getSyncProfile(token: string): Promise<{ profile: { packages: SyncPackageEntry[] }; meta: SyncProfileMeta }> {
    return this.get("/v1/me/sync-profile", token);
  }

  // --- Org mutation APIs ---

  async createOrg(name: string, displayName: string | undefined, token: string): Promise<{ id: string; name: string }> {
    const body: Record<string, string> = { name };
    if (displayName) body.display_name = displayName;
    return this.post("/v1/orgs", body, token);
  }

  // --- HTTP helpers ---

  private async get<T>(path: string, token?: string | null): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new ApiError(resp.status, body || `API error: ${resp.status}`);
    }
    return resp.json() as Promise<T>;
  }

  private async post<T>(path: string, body: Record<string, unknown>, token: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new ApiError(resp.status, text || `API error: ${resp.status}`);
    }
    return resp.json() as Promise<T>;
  }
}

export class ApiError extends Error {
  public body: Record<string, unknown> | null;
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
    try {
      this.body = JSON.parse(message);
    } catch {
      this.body = null;
    }
  }
}
