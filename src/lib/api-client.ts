import type {
  PackageSummary, PackageDetail, SearchResult, VersionDetail,
  PackageStats, PublisherProfile, OrgDetail, OrgMember, OrgInfo,
  OrgInvitation, PackageAccessEntry,
  AgentRanking, RegistryOverview, SyncProfileMeta, SyncPackageEntry,
  TransferRequest, AppNotification, RenameResult,
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
    if (resp.status === 204) return undefined as T;
    const text = await resp.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  private async patch<T>(path: string, body: Record<string, unknown>, token: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      method: "PATCH",
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
    return resp.json() as Promise<T>;
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
