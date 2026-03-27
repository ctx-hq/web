export type PackageType = "skill" | "mcp" | "cli";

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
