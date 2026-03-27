# ctx Web

Hono SSR website for getctx.org. Lyra design system (sharp geometric, zero radius).

## Dev & Test

```bash
pnpm dev        # Vite dev server
pnpm test       # Vitest
pnpm typecheck  # TypeScript check
pnpm build      # Production build
bash scripts/deploy.sh  # Deploy to CF Pages
```

## Architecture

- `src/index.tsx` — Hono app with all routes
- `src/layout.tsx` — HTML shell with SEO meta
- `src/components/` — Server-rendered Hono JSX components
- `src/pages/` — Page components
- `src/lib/` — API client, SEO helpers, types, constants
- `src/styles/globals.css` — Lyra design tokens + Tailwind 4
- All data fetched from api/ via HTTP (API_BASE_URL env var)
