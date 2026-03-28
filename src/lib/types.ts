export type SessionUser = { username: string; avatar_url?: string };

export type PackageType = "skill" | "mcp" | "cli";

export type SortOption = "downloads" | "newest";

export interface PackageSummary {
  full_name: string;
  type: PackageType;
  description: string;
  version: string;
  downloads: number;
  repository: string;
}

export interface PackageDetail {
  full_name: string;
  type: PackageType;
  description: string;
  license: string;
  repository: string;
  keywords: string[];
  platforms: string[];
  downloads: number;
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
