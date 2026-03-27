import type { FC } from "hono/jsx";

export const Footer: FC = () => (
  <footer class="border-t border-border py-6">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 text-muted-foreground">
      <span>© 2026 getctx.org</span>
      <nav class="flex gap-4">
        <a href="/docs" class="hover:text-foreground">Docs</a>
        <a href="https://github.com/getctx" class="hover:text-foreground">GitHub</a>
        <a href="/docs/api" class="hover:text-foreground">API</a>
      </nav>
    </div>
  </footer>
);
