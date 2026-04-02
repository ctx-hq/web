import type {
  PackageSummary, PackageDetail, SearchResult, VersionDetail,
  PackageStats, Profile, OrgDetail, OrgMember, OrgInfo,
  OrgInvitation, PackageAccessEntry,
  AgentRanking, RegistryOverview, SyncProfileMeta, SyncPackageEntry,
  TransferRequest, AppNotification, RenameResult,
  MCPHubEntry, MCPCategoryCount,
  CategoryInfo, KeywordInfo, StarredPackage,
} from "./types";

export class ApiClient {
  constructor(private baseUrl: string) {}

  // --- Package APIs ---

  async search(query: string, opts?: { type?: string; platform?: string; category?: string; limit?: number; offset?: number }, token?: string | null): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query });
    if (opts?.type) params.set("type", opts.type);
    if (opts?.platform) params.set("platform", opts.platform);
    if (opts?.category) params.set("category", opts.category);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    return this.get(`/v1/search?${params}`, token);
  }

  async listPackages(opts?: { type?: string; sort?: string; category?: string; limit?: number; offset?: number }, token?: string | null): Promise<{ packages: PackageSummary[]; total: number }> {
    const params = new URLSearchParams();
    if (opts?.type) params.set("type", opts.type);
    if (opts?.sort) params.set("sort", opts.sort);
    if (opts?.category) params.set("category", opts.category);
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

  // --- MCP Hub APIs ---

  async getMCPHub(opts?: { category?: string; sort?: string; limit?: number; offset?: number }): Promise<{ servers: MCPHubEntry[]; total: number; categories: MCPCategoryCount[] }> {
    const params = new URLSearchParams();
    if (opts?.category) params.set("category", opts.category);
    if (opts?.sort) params.set("sort", opts.sort);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    return this.get(`/v1/mcp/hub?${params}`);
  }

  async getMCPFeatured(): Promise<{ servers: MCPHubEntry[] }> {
    return this.get("/v1/mcp/featured");
  }

  async getMCPCategories(): Promise<{ categories: MCPCategoryCount[] }> {
    return this.get("/v1/mcp/categories");
  }

  // --- Profile APIs ---

  async getProfile(slug: string): Promise<Profile> {
    return this.get(`/v1/profiles/${encodeURIComponent(slug)}`);
  }

  async getProfilePackages(slug: string, opts?: { type?: string; limit?: number; offset?: number }, token?: string | null): Promise<{ owner: { slug: string; kind: string }; packages: PackageSummary[] }> {
    const params = new URLSearchParams();
    if (opts?.type) params.set("type", opts.type);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    return this.get(`/v1/profiles/${encodeURIComponent(slug)}/packages?${params}`, token);
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

  // --- Invitation APIs ---

  async inviteOrgMember(orgName: string, username: string, role: string, token: string): Promise<OrgInvitation> {
    return this.post(`/v1/orgs/${encodeURIComponent(orgName)}/invitations`, { username, role }, token);
  }

  async listOrgInvitations(orgName: string, token: string): Promise<{ invitations: OrgInvitation[] }> {
    return this.get(`/v1/orgs/${encodeURIComponent(orgName)}/invitations`, token);
  }

  async cancelOrgInvitation(orgName: string, invitationId: string, token: string): Promise<void> {
    return this.doDelete(`/v1/orgs/${encodeURIComponent(orgName)}/invitations/${encodeURIComponent(invitationId)}`, token);
  }

  async listMyInvitations(token: string): Promise<{ invitations: OrgInvitation[] }> {
    return this.get("/v1/me/invitations", token);
  }

  async acceptInvitation(id: string, token: string): Promise<void> {
    return this.post(`/v1/me/invitations/${encodeURIComponent(id)}/accept`, {}, token);
  }

  async declineInvitation(id: string, token: string): Promise<void> {
    return this.post(`/v1/me/invitations/${encodeURIComponent(id)}/decline`, {}, token);
  }

  // --- Member Visibility APIs ---

  async updateMemberVisibility(orgName: string, username: string, visibility: string, token: string): Promise<void> {
    return this.patch(`/v1/orgs/${encodeURIComponent(orgName)}/members/${encodeURIComponent(username)}/visibility`, { visibility }, token);
  }

  async getPublicMembers(orgName: string): Promise<{ members: OrgMember[] }> {
    return this.get(`/v1/orgs/${encodeURIComponent(orgName)}/public-members`);
  }

  async removeMember(orgName: string, username: string, token: string): Promise<void> {
    return this.doDelete(`/v1/orgs/${encodeURIComponent(orgName)}/members/${encodeURIComponent(username)}`, token);
  }

  // --- Package Access APIs ---

  async getPackageAccess(fullName: string, token: string): Promise<{ access: PackageAccessEntry[] }> {
    return this.get(`/v1/packages/${encodeURIComponent(fullName)}/access`, token);
  }

  async updatePackageAccess(fullName: string, add: string[], remove: string[], token: string): Promise<void> {
    return this.patch(`/v1/packages/${encodeURIComponent(fullName)}/access`, { add, remove }, token);
  }

  // --- Transfer APIs ---

  async initiateTransfer(fullName: string, to: string, message: string, token: string): Promise<TransferRequest> {
    return this.post(`/v1/packages/${encodeURIComponent(fullName)}/transfer`, { to, message }, token);
  }

  async cancelTransfer(fullName: string, token: string): Promise<void> {
    return this.doDelete(`/v1/packages/${encodeURIComponent(fullName)}/transfer`, token);
  }

  async listMyTransfers(token: string): Promise<{ transfers: TransferRequest[] }> {
    return this.get("/v1/me/transfers", token);
  }

  async acceptTransfer(id: string, token: string): Promise<void> {
    return this.post(`/v1/me/transfers/${encodeURIComponent(id)}/accept`, {}, token);
  }

  async declineTransfer(id: string, token: string): Promise<void> {
    return this.post(`/v1/me/transfers/${encodeURIComponent(id)}/decline`, {}, token);
  }

  // --- Package Settings APIs ---

  async setVisibility(fullName: string, visibility: string, token: string): Promise<void> {
    return this.patch(`/v1/packages/${encodeURIComponent(fullName)}/visibility`, { visibility }, token);
  }

  // --- Rename APIs ---

  async renamePackage(fullName: string, newName: string, confirm: string, token: string): Promise<RenameResult> {
    return this.patch(`/v1/packages/${encodeURIComponent(fullName)}/rename`, { new_name: newName, confirm }, token);
  }

  async renameOrg(orgName: string, newName: string, confirm: string, token: string): Promise<RenameResult> {
    return this.patch(`/v1/orgs/${encodeURIComponent(orgName)}/rename`, { new_name: newName, confirm }, token);
  }

  async renameUser(newUsername: string, confirm: string, token: string): Promise<RenameResult> {
    return this.patch("/v1/me/rename", { new_username: newUsername, confirm }, token);
  }

  // --- Notification APIs ---

  async listNotifications(token: string, unreadOnly = false): Promise<{ notifications: AppNotification[] }> {
    const qs = unreadOnly ? "?unread_only=true" : "";
    return this.get(`/v1/me/notifications${qs}`, token);
  }

  async getNotificationCount(token: string): Promise<{ unread: number }> {
    return this.get("/v1/me/notifications/count", token);
  }

  async markNotificationRead(id: string, token: string): Promise<void> {
    return this.patch(`/v1/me/notifications/${encodeURIComponent(id)}`, { read: true }, token);
  }

  async dismissNotification(id: string, token: string): Promise<void> {
    return this.doDelete(`/v1/me/notifications/${encodeURIComponent(id)}`, token);
  }

  // --- Org Lifecycle APIs ---

  async archiveOrg(orgName: string, token: string): Promise<void> {
    return this.post(`/v1/orgs/${encodeURIComponent(orgName)}/archive`, {}, token);
  }

  async unarchiveOrg(orgName: string, token: string): Promise<void> {
    return this.post(`/v1/orgs/${encodeURIComponent(orgName)}/unarchive`, {}, token);
  }

  async leaveOrg(orgName: string, token: string): Promise<void> {
    return this.post(`/v1/orgs/${encodeURIComponent(orgName)}/leave`, {}, token);
  }

  async dissolveOrg(orgName: string, action: string, confirm: string, transferTo: string, token: string): Promise<void> {
    const body: Record<string, string> = { action, confirm };
    if (transferTo) body.transfer_to = transferTo;
    return this.post(`/v1/orgs/${encodeURIComponent(orgName)}/dissolve`, body, token);
  }

  // --- Token Management ---

  async listTokens(token: string): Promise<{ tokens: import("./types").TokenInfo[] }> {
    return this.get("/v1/me/tokens", token);
  }

  async createToken(body: {
    name: string;
    expires_in_days?: number;
    endpoint_scopes?: string[];
    package_scopes?: string[];
    token_type?: string;
  }, token: string): Promise<{ id: string; token: string; name: string }> {
    return this.post("/v1/me/tokens", body as Record<string, unknown>, token);
  }

  async revokeToken(tokenId: string, token: string): Promise<void> {
    return this.doDelete(`/v1/me/tokens/${encodeURIComponent(tokenId)}`, token);
  }

  // --- Discovery: Categories, Keywords, Stars ---

  async getCategories(): Promise<{ categories: CategoryInfo[] }> {
    return this.get("/v1/categories");
  }

  async getKeywords(limit?: number): Promise<{ keywords: KeywordInfo[] }> {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    return this.get(`/v1/keywords${qs ? `?${qs}` : ""}`);
  }

  async starPackage(fullName: string, token: string): Promise<void> {
    return this.put(`/v1/packages/${encodeURIComponent(fullName)}/star`, {}, token);
  }

  async unstarPackage(fullName: string, token: string): Promise<void> {
    return this.doDelete(`/v1/packages/${encodeURIComponent(fullName)}/star`, token);
  }

  async listMyStars(token: string): Promise<{ stars: StarredPackage[] }> {
    return this.get("/v1/me/stars", token);
  }

  // --- Trusted Publishers ---

  async listTrustedPublishers(fullName: string, token: string): Promise<{ trusted_publishers: import("./types").TrustedPublisher[] }> {
    return this.get(`/v1/packages/${encodeURIComponent(fullName)}/trusted-publishers`, token);
  }

  async addTrustedPublisher(fullName: string, body: { provider: string; github_repo: string; workflow: string; environment?: string }, token: string): Promise<import("./types").TrustedPublisher> {
    return this.post(`/v1/packages/${encodeURIComponent(fullName)}/trusted-publishers`, body as Record<string, unknown>, token);
  }

  async deleteTrustedPublisher(fullName: string, id: string, token: string): Promise<void> {
    return this.doDelete(`/v1/packages/${encodeURIComponent(fullName)}/trusted-publishers/${encodeURIComponent(id)}`, token);
  }

  // --- Submissions ---

  async submitPackage(body: { source_url: string; reason?: string }, token?: string | null): Promise<void> {
    const url = `${this.baseUrl}/v1/submissions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new ApiError(resp.status, text || `API error: ${resp.status}`);
    }
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
    return this.mutate("POST", path, body, token);
  }

  private async put<T>(path: string, body: Record<string, unknown>, token: string): Promise<T> {
    return this.mutate("PUT", path, body, token);
  }

  private async patch<T>(path: string, body: Record<string, unknown>, token: string): Promise<T> {
    return this.mutate("PATCH", path, body, token);
  }

  private async mutate<T>(method: string, path: string, body: Record<string, unknown>, token: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      method,
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
    if (resp.status === 204) return undefined as T;
    const text = await resp.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  private async doDelete<T>(path: string, token: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new ApiError(resp.status, text || `API error: ${resp.status}`);
    }
    if (resp.status === 204) return undefined as T;
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
