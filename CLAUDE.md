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

## Lyra Design System

Identity: sharp geometric, **zero border-radius**, taupe oklch palette, JetBrains Mono headings, Roboto Slab body.

### Typography Scale

| Role             | Tailwind              | px    | Usage                          |
|------------------|-----------------------|-------|--------------------------------|
| Hero heading     | text-3xl sm:text-4xl  | 30/36 | Home hero only                 |
| Page title (h1)  | text-xl               | 20    | All page headings              |
| Section heading  | text-lg               | 18    | Prose h1, privacy h2           |
| Subsection       | text-base             | 16    | Descriptions, prose h3         |
| Body / Nav       | text-sm               | 14    | **Default** — body, cards, nav |
| Metadata / Code  | text-xs               | 12    | **Floor** — badges, hints, code blocks |

- **Never** use `text-[10px]`, `text-[11px]`, or any sub-12px size.
- Code blocks (`<pre>`) stay at text-xs (12px). Inline code inherits parent size.

### Layout

| Token           | Value                              |
|-----------------|------------------------------------|
| Container       | max-w-6xl (1152px), px-4 sm:px-6 lg:px-8 |
| Narrow container| max-w-3xl                          |
| Header          | h-14 (56px)                        |
| Sidebar         | lg:w-80 (320px)                    |
| Card padding    | p-5                                |
| Page padding    | py-10 (content pages), py-24 (hero/auth) |
| Grid gap        | gap-4                              |
| Grid cols       | sm:2 lg:3 xl:4 (listing pages)     |

### Component Classes (SSOT in globals.css)

All sizing flows from `cn-*` classes in `globals.css`. Do not hardcode sizes in components — change the token instead.

- Buttons: `cn-button-size-{xs|sm|default|lg}` → h-7/h-8/h-9/h-10
- Inputs: `cn-input-size-{default|lg}` → h-9/h-11
- Cards: `cn-card` with `cn-card-header` / `cn-card-content` / `cn-card-footer`
- Badges: `cn-badge` (stays text-xs)
- Prose: `.prose` base is text-sm

### WCAG

- Min font: 12px (text-xs)
- Touch targets: all interactive elements ≥ h-7 (28px) + padding
- Color contrast: oklch values pass 4.5:1 AA
- Focus: ring styles via focus-visible
