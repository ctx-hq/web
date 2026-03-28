# ctx — Universal Package Manager for LLM Context

[![Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Hono](https://img.shields.io/badge/framework-Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Tailwind CSS](https://img.shields.io/badge/styles-Tailwind%20CSS%204-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/lang-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-22C55E)](./LICENSE)

**[中文文档](./README.zh-CN.md)**

Discover, install, and manage **skills**, **MCP servers**, and **CLI tools** for AI agents — all from one registry.

ctx gives your AI agent the right context at the right time. Think of it as npm for LLM tooling: a single command to search, install, and serve packages that extend what your agent can do.

## Get Started

**For AI agents** — paste this into your agent (Claude, Cursor, etc.):

```
Read https://getctx.org/skill.md and follow the instructions to use ctx
```

**For humans** — install the CLI:

```bash
# macOS / Linux
curl -fsSL https://getctx.org/install.sh | sh

# Windows
irm https://getctx.org/install.ps1 | iex
```

Then use it:

```bash
ctx search "code review"    # Find packages
ctx install @scope/name     # Install a package
ctx serve                   # Start MCP server
```

## What Can You Install?

| Type    | Description                                   | Example                          |
| ------- | --------------------------------------------- | -------------------------------- |
| `skill` | Reusable prompts and workflows for AI agents  | Code review, commit conventions  |
| `mcp`   | MCP servers that give agents tool access       | Database queries, API connectors |
| `cli`   | Command-line tools for developer workflows     | Linters, formatters, scaffolders |

Browse packages at [getctx.org/search](https://getctx.org/search).

---

## Development

This repo contains the [getctx.org](https://getctx.org) website — a server-side rendered Hono app with the Lyra design system (sharp geometric, zero radius).

### Quick Start

```bash
pnpm install
pnpm dev
```

### Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start Vite dev server                |
| `pnpm build`     | Production build                     |
| `pnpm preview`   | Preview with Wrangler Pages          |
| `pnpm deploy`    | Build and deploy to Cloudflare Pages |
| `pnpm test`      | Run tests with Vitest                |
| `pnpm typecheck` | TypeScript type checking             |

### Architecture

```
src/
├── index.tsx          # Hono app with all routes
├── layout.tsx         # HTML shell with SEO meta
├── components/        # Server-rendered Hono JSX components
├── pages/             # Page components
├── lib/               # API client, SEO helpers, types, constants
└── styles/
    └── globals.css    # Lyra design tokens + Tailwind 4
```

All data is fetched from the API layer via HTTP (`API_BASE_URL` env var).

### Tech Stack

- **Runtime** — [Cloudflare Pages](https://pages.cloudflare.com/) (Workers)
- **Framework** — [Hono](https://hono.dev/) (SSR with JSX)
- **Styling** — [Tailwind CSS 4](https://tailwindcss.com/) + Lyra design tokens
- **Build** — [Vite](https://vite.dev/)
- **Testing** — [Vitest](https://vitest.dev/)

### Environment Variables

| Variable               | Description         | Required |
| ---------------------- | ------------------- | -------- |
| `API_BASE_URL`         | Backend API origin  | Yes      |
| `GITHUB_CLIENT_ID`     | GitHub OAuth app ID | No       |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | No       |
