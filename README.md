# ctx Web

[![Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Hono](https://img.shields.io/badge/framework-Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Tailwind CSS](https://img.shields.io/badge/styles-Tailwind%20CSS%204-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/lang-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/build-Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![MIT License](https://img.shields.io/badge/license-MIT-22C55E)](./LICENSE)

Server-side rendered website for [getctx.org](https://getctx.org), built with Hono SSR and the Lyra design system (sharp geometric, zero radius).

**[中文文档](./README.zh-CN.md)**

## Quick Start

```bash
pnpm install
pnpm dev
```

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start Vite dev server                |
| `pnpm build`     | Production build                     |
| `pnpm preview`   | Preview with Wrangler Pages          |
| `pnpm deploy`    | Build and deploy to Cloudflare Pages |
| `pnpm test`      | Run tests with Vitest                |
| `pnpm typecheck` | TypeScript type checking             |

## Architecture

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

All data is fetched from the API layer via HTTP (`API_BASE_URL` env var, required).

## Tech Stack

- **Runtime** — [Cloudflare Pages](https://pages.cloudflare.com/) (Workers)
- **Framework** — [Hono](https://hono.dev/) (SSR with JSX)
- **Styling** — [Tailwind CSS 4](https://tailwindcss.com/) + Lyra design tokens
- **Build** — [Vite](https://vite.dev/)
- **Testing** — [Vitest](https://vitest.dev/)

## Environment Variables

| Variable              | Description        | Required |
| --------------------- | ------------------ | -------- |
| `API_BASE_URL`        | Backend API origin | Yes      |
| `GITHUB_CLIENT_ID`    | GitHub OAuth app ID | No      |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | No      |
