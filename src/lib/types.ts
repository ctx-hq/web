export type SessionUser = { username: string; avatar_url?: string };

export type PackageType = "skill" | "mcp" | "cli";

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
  publisher_slug?: string;
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
  publisher?: { slug: string; kind: "user" | "org" } | null;
  dist_tags?: Record<string, string>;
  versions: VersionSummary[];
  created_at: string;
  updated_at: string;
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
  mcp?: { transport?: string; command?: string; url?: string; tools?: string[] };
  cli?: { binary?: string; verify?: string; compatible?: string };
  install?: { brew?: string; npm?: string; pip?: string; cargo?: string };
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
  total_publishers: number;
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

// --- Publisher types ---

export interface PublisherProfile {
  slug: string;
  kind: "user" | "org";
  packages: number;
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

export interface RenameResult {
  old_name?: string;
  new_name?: string;
  old_username?: string;
  new_username?: string;
  packages_updated?: number;
}
