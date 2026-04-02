export type SessionUser = { username: string; avatar_url?: string };

export type PackageType = "skill" | "mcp" | "cli" | "collection";

export type SortOption = "downloads" | "newest";

export type Visibility = "public" | "unlisted" | "private";

export type TrustTier = "unverified" | "structural" | "source_linked" | "reviewed" | "verified";

export interface PackageSummary {
  full_name: string;
  type: PackageType;
  description: string;
  version: string;
  downloads: number;
  repository: string;
  trust_tier?: TrustTier;
  owner_slug?: string;
  visibility?: Visibility;
}

export interface PackageDetail {
  full_name: string;
  type: PackageType;
  description: string;
  summary?: string;
  license: string;
  repository: string;
  keywords: string[];
  platforms: string[];
  downloads: number;
  trust_tier?: TrustTier;
  visibility?: Visibility;
  owner?: { slug: string; kind: "user" | "org" | "system"; avatar_url?: string } | null;
  dist_tags?: Record<string, string>;
  versions: VersionSummary[];
  collection_members?: CollectionMemberSummary[] | null;
  part_of_collections?: { full_name: string; description: string }[] | null;
  star_count?: number;
  is_starred?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionMemberSummary {
  full_name: string;
  type: PackageType;
  description: string;
  version: string;
}

export interface VersionSummary {
  version: string;
  yanked: boolean;
  created_at: string;
}

export interface VersionDetail {
  version: string;
  manifest: string;
  readme: string;
  sha256: string;
  yanked: boolean;
  published_by: string;
  created_at: string;
}

export interface SearchResult {
  packages: PackageSummary[];
  total: number;
}

/** Parsed manifest metadata for display (extracted from VersionDetail.manifest JSON). */
export interface ManifestInfo {
  source?: { github?: string; path?: string; ref?: string };
  skill?: { entry?: string; tags?: string[]; compatibility?: string; user_invocable?: boolean };
  mcp?: {
    transport?: string;
    command?: string;
    args?: string[];
    url?: string;
    tools?: string[];
    resources?: string[];
    env?: Array<{ name: string; required?: boolean; default?: string; description?: string }>;
    require?: { bins?: string[]; min_versions?: Record<string, string> };
    hooks?: { post_install?: Array<{ command: string; args?: string[]; description?: string }> };
    transports?: Array<{
      id: string;
      label?: string;
      transport: string;
      command?: string;
      args?: string[];
      url?: string;
      env?: Array<{ name: string; required?: boolean; default?: string; description?: string }>;
      require?: { bins?: string[] };
    }>;
  };
  cli?: { binary?: string; verify?: string; compatible?: string };
  install?: { brew?: string; npm?: string; pip?: string; cargo?: string };
  upstream?: {
    npm?: string;
    github?: string;
    docker?: string;
    tracking?: string;
  };
}

/** Try to parse manifest JSON into ManifestInfo. Returns null on failure. */
export function parseManifest(raw: string | undefined): ManifestInfo | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ManifestInfo;
  } catch {
    return null;
  }
}

// --- Organization types ---

export interface OrgInfo {
  id: string;
  name: string;
  display_name?: string;
  role?: string;
  created_at?: string;
}

export interface OrgDetail extends OrgInfo {
  members: number;
  packages: number;
  archived?: boolean;
}

export interface OrgMember {
  username: string;
  avatar_url: string;
  role: string;
  visibility: "public" | "private";
  created_at: string;
}

export interface OrgInvitation {
  id: string;
  org_name: string;
  org_display_name?: string;
  inviter: string;
  invitee: string;
  role: string;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  expires_at: string;
  created_at: string;
  resolved_at?: string;
}

export interface PackageAccessEntry {
  username: string;
  granted_by: string;
  created_at: string;
}

// --- Stats types ---

export interface PackageStats {
  downloads: {
    total: number;
    weekly: number;
    daily: { date: string; count: number }[];
  };
  agents: {
    total_installs: number;
    breakdown: { agent: string; count: number; percentage: number }[];
  };
}

export interface AgentRanking {
  name: string;
  total_installs: number;
  packages: number;
}

export interface RegistryOverview {
  total_packages: number;
  total_downloads: number;
  total_owners: number;
  breakdown: { type: string; count: number; percentage: number }[];
}

// --- Sync types ---

export interface SyncProfileMeta {
  package_count: number;
  syncable_count: number;
  unsyncable_count: number;
  last_push_at: string | null;
  last_pull_at: string | null;
  last_push_device: string;
  last_pull_device: string;
}

export interface SyncPackageEntry {
  name: string;
  version: string;
  source: string;
  agents: string[];
  syncable: boolean;
}

// --- Profile types ---

export interface Profile {
  slug: string;
  kind: "user" | "org";
  avatar_url?: string | null;
  bio?: string | null;
  website?: string | null;
  packages: number;
  total_downloads?: number | null;
  created_at: string;
}

// --- Transfer types ---

export interface TransferRequest {
  id: string;
  package: string;
  from: string;
  to: string;
  status: string;
  message?: string;
  expires_at: string;
  created_at: string;
}

// --- Notification types ---

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data?: string;
  created_at: string;
}

// --- Rename types ---

// --- MCP Hub types ---

export interface MCPHubEntry {
  full_name: string;
  description: string;
  transport: string;
  tools_count: number;
  downloads: number;
  owner_slug?: string;
  category: string;
  version?: string;
}

export interface MCPCategoryCount {
  slug: string;
  name: string;
  count: number;
}

export interface MCPDetail {
  transport: string;
  command: string;
  args: string[];
  url: string;
  env_vars: Array<{ name: string; required?: boolean; default?: string; description?: string }>;
  tools: string[];
  resources: string[];
  category: string;
}

export interface RenameResult {
  old_name?: string;
  new_name?: string;
  old_username?: string;
  new_username?: string;
  packages_updated?: number;
}

// Token management
export interface TokenInfo {
  id: string;
  name: string;
  endpoint_scopes: string[];
  package_scopes: string[];
  token_type: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

// --- Category & Keyword types ---

export interface CategoryInfo {
  slug: string;
  name: string;
  description: string;
  parent_slug: string | null;
  package_count: number;
}

export interface KeywordInfo {
  slug: string;
  usage_count: number;
}

export interface StarredPackage {
  full_name: string;
  type: string;
  description: string;
  starred_at: string;
}

export interface TrustedPublisher {
  id: string;
  provider: string;
  github_repo: string;
  workflow: string;
  environment: string | null;
  created_at: string;
}

export const ENDPOINT_SCOPES = [
  "publish",
  "yank",
  "read-private",
  "manage-access",
  "manage-org",
] as const;
