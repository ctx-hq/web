/**
 * Mock package data for development preview.
 * TODO: Remove before production launch.
 */
import type { PackageSummary, PackageDetail, PackageType } from "./types";

export const MOCK_PACKAGES: PackageSummary[] = [
  // Skills
  {
    full_name: "anthropic/code-review",
    type: "skill",
    description: "Automated code review with context-aware feedback. Supports multiple languages and frameworks.",
    version: "1.2.0",
    downloads: 12450,
    repository: "https://github.com/anthropic/code-review-skill",
  },
  {
    full_name: "openelf/git-commit",
    type: "skill",
    description: "Generate conventional commit messages from staged changes with scope detection.",
    version: "0.9.1",
    downloads: 8320,
    repository: "https://github.com/openelf/git-commit-skill",
  },
  {
    full_name: "devtools/test-writer",
    type: "skill",
    description: "Auto-generate unit tests for functions and components. Vitest, Jest, and Pytest support.",
    version: "2.0.3",
    downloads: 6710,
    repository: "https://github.com/devtools/test-writer",
  },
  {
    full_name: "langchain/doc-summarizer",
    type: "skill",
    description: "Summarize documentation, READMEs, and technical specs into concise overviews.",
    version: "1.0.0",
    downloads: 5430,
    repository: "https://github.com/langchain/doc-summarizer",
  },
  {
    full_name: "refactor/extract-function",
    type: "skill",
    description: "Identify and extract reusable functions from complex code blocks with proper naming.",
    version: "0.5.2",
    downloads: 3200,
    repository: "https://github.com/refactor/extract-function",
  },
  {
    full_name: "i18n/translate-keys",
    type: "skill",
    description: "Translate i18n JSON keys across 40+ languages with context-aware translations.",
    version: "1.1.0",
    downloads: 2890,
    repository: "https://github.com/i18n/translate-keys",
  },

  // MCP Servers
  {
    full_name: "supabase/mcp-postgres",
    type: "mcp",
    description: "Query PostgreSQL databases with natural language. Schema introspection and safe read queries.",
    version: "3.1.0",
    downloads: 18900,
    repository: "https://github.com/supabase/mcp-postgres",
  },
  {
    full_name: "vercel/mcp-github",
    type: "mcp",
    description: "Full GitHub integration — issues, PRs, code search, and repository management via MCP.",
    version: "2.4.1",
    downloads: 15200,
    repository: "https://github.com/vercel/mcp-github",
  },
  {
    full_name: "stripe/mcp-payments",
    type: "mcp",
    description: "Manage Stripe payments, subscriptions, and invoices through a secure MCP interface.",
    version: "1.0.2",
    downloads: 9800,
    repository: "https://github.com/stripe/mcp-payments",
  },
  {
    full_name: "cloudflare/mcp-r2",
    type: "mcp",
    description: "Read, write, and manage objects in Cloudflare R2 storage buckets.",
    version: "0.8.0",
    downloads: 4500,
    repository: "https://github.com/cloudflare/mcp-r2",
  },
  {
    full_name: "linear/mcp-issues",
    type: "mcp",
    description: "Create, update, and query Linear issues and projects from your AI agent.",
    version: "1.3.0",
    downloads: 7600,
    repository: "https://github.com/linear/mcp-issues",
  },
  {
    full_name: "notion/mcp-workspace",
    type: "mcp",
    description: "Search and edit Notion pages, databases, and blocks via MCP protocol.",
    version: "0.6.1",
    downloads: 3100,
    repository: "https://github.com/notion/mcp-workspace",
  },

  // CLI Tools
  {
    full_name: "astral/ctx-lint",
    type: "cli",
    description: "Lint your ctx package manifests. Validates schema, checks dependencies, and enforces conventions.",
    version: "1.5.0",
    downloads: 22100,
    repository: "https://github.com/astral/ctx-lint",
  },
  {
    full_name: "openelf/ctx-init",
    type: "cli",
    description: "Scaffold a new ctx package with templates for skills, MCP servers, or CLI tools.",
    version: "0.4.0",
    downloads: 11300,
    repository: "https://github.com/openelf/ctx-init",
  },
  {
    full_name: "devops/ctx-deploy",
    type: "cli",
    description: "Deploy ctx packages to registries with CI/CD integration. Supports GitHub Actions and GitLab CI.",
    version: "2.1.0",
    downloads: 8750,
    repository: "https://github.com/devops/ctx-deploy",
  },
  {
    full_name: "tools/ctx-benchmark",
    type: "cli",
    description: "Benchmark your skill's response time, token usage, and accuracy across test scenarios.",
    version: "0.3.1",
    downloads: 2400,
    repository: "https://github.com/tools/ctx-benchmark",
  },
  {
    full_name: "security/ctx-audit",
    type: "cli",
    description: "Audit ctx packages for known vulnerabilities and unsafe patterns in manifests.",
    version: "1.0.0",
    downloads: 5600,
    repository: "https://github.com/security/ctx-audit",
  },
  {
    full_name: "migrate/ctx-upgrade",
    type: "cli",
    description: "Upgrade ctx packages and migrate manifests between spec versions automatically.",
    version: "0.7.2",
    downloads: 1950,
    repository: "https://github.com/migrate/ctx-upgrade",
  },
];

/** Filter and paginate mock packages to simulate API behavior. */
export function queryMockPackages(opts: {
  q?: string;
  type?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}): { packages: PackageSummary[]; total: number } {
  let filtered = [...MOCK_PACKAGES];

  // Type filter
  if (opts.type) {
    filtered = filtered.filter((p) => p.type === opts.type);
  }

  // Search query
  if (opts.q) {
    const q = opts.q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q),
    );
  }

  // Sort
  if (opts.sort === "created_at" || opts.sort === "newest") {
    // Simulate newest — reverse the array (mock doesn't have real dates)
    filtered.reverse();
  } else {
    // Default: sort by downloads descending
    filtered.sort((a, b) => b.downloads - a.downloads);
  }

  const total = filtered.length;
  const offset = opts.offset ?? 0;
  const limit = opts.limit ?? 30;
  const packages = filtered.slice(offset, offset + limit);

  return { packages, total };
}

/** Metadata enrichment for mock package details. */
const MOCK_META: Record<string, { keywords: string[]; platforms: string[]; license: string; readme: string }> = {
  "anthropic/code-review": {
    keywords: ["code-review", "ai", "linting", "automation"],
    platforms: ["linux", "macos", "windows"],
    license: "MIT",
    readme: "# Code Review Skill\n\nAutomated code review powered by AI.\n\n## Features\n\n- Multi-language support (TypeScript, Python, Go, Rust)\n- Context-aware feedback based on project conventions\n- Inline suggestions with explanation\n\n## Usage\n\n```bash\nctx install @anthropic/code-review\n```\n\nThen ask your agent to review your code changes.",
  },
  "openelf/git-commit": {
    keywords: ["git", "commit", "conventional-commits"],
    platforms: ["linux", "macos", "windows"],
    license: "Apache-2.0",
    readme: "# Git Commit Skill\n\nGenerate conventional commit messages from staged changes.\n\n## Features\n\n- Automatic scope detection from file paths\n- Conventional Commits format\n- Multi-line body for complex changes\n\n## Usage\n\nStage your changes, then let your agent generate the commit message.",
  },
  "devtools/test-writer": {
    keywords: ["testing", "vitest", "jest", "pytest", "unit-tests"],
    platforms: ["linux", "macos", "windows"],
    license: "MIT",
    readme: "# Test Writer\n\nAuto-generate unit tests for your code.\n\n## Supported Frameworks\n\n- **JavaScript/TypeScript**: Vitest, Jest\n- **Python**: Pytest\n\n## Usage\n\nPoint to a function or component, and the skill will generate comprehensive test cases covering edge cases.",
  },
  "langchain/doc-summarizer": {
    keywords: ["documentation", "summarization", "ai"],
    platforms: ["linux", "macos"],
    license: "MIT",
    readme: "# Doc Summarizer\n\nSummarize technical documentation into concise overviews.\n\n## Features\n\n- README summarization\n- API documentation digests\n- Changelog summaries",
  },
  "refactor/extract-function": {
    keywords: ["refactoring", "clean-code", "extraction"],
    platforms: ["linux", "macos", "windows"],
    license: "MIT",
    readme: "# Extract Function\n\nIdentify and extract reusable functions from complex code blocks.\n\n## How It Works\n\n1. Analyzes code for repeated patterns\n2. Suggests function boundaries\n3. Generates extracted function with proper naming and typing",
  },
  "i18n/translate-keys": {
    keywords: ["i18n", "translation", "localization"],
    platforms: ["linux", "macos", "windows"],
    license: "MIT",
    readme: "# Translate Keys\n\nTranslate i18n JSON keys across 40+ languages.\n\n## Features\n\n- Context-aware translations\n- Preserves interpolation variables\n- Batch processing support",
  },
  "supabase/mcp-postgres": {
    keywords: ["database", "postgresql", "sql", "supabase"],
    platforms: ["linux", "macos", "windows"],
    license: "Apache-2.0",
    readme: "# MCP Postgres\n\nQuery PostgreSQL databases with natural language.\n\n## Features\n\n- Schema introspection and auto-discovery\n- Safe read-only queries by default\n- Write mode with confirmation prompts\n- Connection pooling support\n\n## Configuration\n\nSet your `DATABASE_URL` environment variable to connect.",
  },
  "vercel/mcp-github": {
    keywords: ["github", "issues", "pull-requests", "code-search"],
    platforms: ["linux", "macos", "windows"],
    license: "MIT",
    readme: "# MCP GitHub\n\nFull GitHub integration via MCP protocol.\n\n## Capabilities\n\n- Create and manage issues\n- Review and merge pull requests\n- Search code across repositories\n- Manage repository settings\n\n## Authentication\n\nRequires a GitHub personal access token with `repo` scope.",
  },
  "stripe/mcp-payments": {
    keywords: ["payments", "stripe", "billing", "subscriptions"],
    platforms: ["linux", "macos"],
    license: "MIT",
    readme: "# MCP Payments\n\nManage Stripe payments through MCP.\n\n## Features\n\n- Create and manage subscriptions\n- Process one-time payments\n- Generate invoices\n- Handle refunds",
  },
  "cloudflare/mcp-r2": {
    keywords: ["storage", "cloudflare", "r2", "s3-compatible"],
    platforms: ["linux", "macos", "windows"],
    license: "BSD-3-Clause",
    readme: "# MCP R2\n\nManage Cloudflare R2 storage buckets.\n\n## Operations\n\n- List, upload, and download objects\n- Manage bucket lifecycle rules\n- Generate presigned URLs",
  },
  "linear/mcp-issues": {
    keywords: ["linear", "project-management", "issues", "tracking"],
    platforms: ["linux", "macos", "windows"],
    license: "MIT",
    readme: "# MCP Linear Issues\n\nCreate and manage Linear issues from your AI agent.\n\n## Features\n\n- Create issues with labels and assignees\n- Update issue status\n- Query and filter issues\n- Manage project workflows",
  },
  "notion/mcp-workspace": {
    keywords: ["notion", "wiki", "documentation", "knowledge-base"],
    platforms: ["linux", "macos"],
    license: "MIT",
    readme: "# MCP Notion Workspace\n\nSearch and edit Notion pages via MCP.\n\n## Features\n\n- Full-text search across pages\n- Create and update pages\n- Manage databases\n- Block-level editing",
  },
  "astral/ctx-lint": {
    keywords: ["linting", "validation", "schema", "manifests"],
    platforms: ["linux", "macos", "windows"],
    license: "MIT",
    readme: "# ctx-lint\n\nLint your ctx package manifests.\n\n## Features\n\n- Schema validation against ctx spec\n- Dependency resolution checks\n- Convention enforcement (naming, versioning)\n\n## Usage\n\n```bash\nctx-lint check .\n```",
  },
  "openelf/ctx-init": {
    keywords: ["scaffolding", "template", "init", "boilerplate"],
    platforms: ["linux", "macos", "windows"],
    license: "MIT",
    readme: "# ctx-init\n\nScaffold a new ctx package.\n\n## Templates\n\n- `skill` — Skill package with example handler\n- `mcp` — MCP server with tool definitions\n- `cli` — CLI tool with argument parsing\n\n## Usage\n\n```bash\nctx-init my-package --template skill\n```",
  },
  "devops/ctx-deploy": {
    keywords: ["deployment", "ci-cd", "github-actions", "gitlab-ci"],
    platforms: ["linux", "macos", "windows"],
    license: "Apache-2.0",
    readme: "# ctx-deploy\n\nDeploy ctx packages to registries.\n\n## CI/CD Support\n\n- GitHub Actions\n- GitLab CI\n- Jenkins\n\n## Usage\n\n```bash\nctx-deploy publish --registry getctx.org\n```",
  },
  "tools/ctx-benchmark": {
    keywords: ["benchmarking", "performance", "testing"],
    platforms: ["linux", "macos"],
    license: "MIT",
    readme: "# ctx-benchmark\n\nBenchmark your skills.\n\n## Metrics\n\n- Response time (p50, p95, p99)\n- Token usage per invocation\n- Accuracy score against test scenarios",
  },
  "security/ctx-audit": {
    keywords: ["security", "audit", "vulnerabilities"],
    platforms: ["linux", "macos", "windows"],
    license: "MIT",
    readme: "# ctx-audit\n\nAudit ctx packages for security issues.\n\n## Checks\n\n- Known vulnerability database\n- Unsafe manifest patterns\n- Dependency chain analysis\n\n## Usage\n\n```bash\nctx-audit scan .\n```",
  },
  "migrate/ctx-upgrade": {
    keywords: ["migration", "upgrade", "versioning"],
    platforms: ["linux", "macos", "windows"],
    license: "MIT",
    readme: "# ctx-upgrade\n\nUpgrade ctx packages and migrate manifests.\n\n## Features\n\n- Automatic spec version migration\n- Dependency updates\n- Breaking change detection",
  },
};

/** Build a full PackageDetail from a PackageSummary + metadata. */
function buildMockDetail(summary: PackageSummary): { pkg: PackageDetail; readme: string } {
  const meta = MOCK_META[summary.full_name] ?? {
    keywords: [], platforms: ["linux", "macos"], license: "MIT",
    readme: `# ${summary.full_name}\n\n${summary.description}`,
  };

  const now = "2025-03-20T00:00:00Z";
  const created = "2025-01-15T00:00:00Z";

  return {
    pkg: {
      full_name: summary.full_name,
      type: summary.type as PackageType,
      description: summary.description,
      license: meta.license,
      repository: summary.repository,
      keywords: meta.keywords,
      platforms: meta.platforms,
      downloads: summary.downloads,
      versions: [
        { version: summary.version, yanked: false, created_at: now },
        { version: "0.1.0", yanked: false, created_at: created },
      ],
      created_at: created,
      updated_at: now,
    },
    readme: meta.readme,
  };
}

/** Get mock detail for a specific package by full_name. Returns null if not found. */
export function getMockPackageDetail(fullName: string): { pkg: PackageDetail; readme: string } | null {
  const summary = MOCK_PACKAGES.find((p) => p.full_name === fullName);
  if (!summary) return null;
  return buildMockDetail(summary);
}
