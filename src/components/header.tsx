import type { FC } from "hono/jsx";

export const Header: FC = () => (
  <header class="border-b border-border">
    <div class="mx-auto flex h-10 max-w-5xl items-center justify-between px-4">
      <a href="/" class="text-sm font-semibold tracking-tight">
        getctx<span class="text-muted-foreground">.org</span>
      </a>
      <nav class="flex items-center gap-4">
        <a href="/search" class="text-muted-foreground hover:text-foreground">
          Search
        </a>
        <a href="/docs" class="text-muted-foreground hover:text-foreground">
          Docs
        </a>
        <button
          id="theme-toggle"
          class="cn-button-ghost px-2 py-1"
          aria-label="Toggle dark mode"
        >
          ◐
        </button>
        <a href="/login" class="cn-button">
          Sign in
        </a>
      </nav>
    </div>
  </header>
);
