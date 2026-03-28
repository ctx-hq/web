import type { FC } from "hono/jsx";
import { SITE_TAGLINE } from "../lib/constants";
import { Container } from "./ui/container";

export const Footer: FC = () => (
  <footer class="border-t border-border py-8">
    <Container>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span class="text-xs font-medium font-heading">getctx.org</span>
          <p class="mt-1 text-xs text-muted-foreground">{SITE_TAGLINE}</p>
        </div>
        <nav class="flex gap-5 text-xs text-muted-foreground">
          <a href="/docs" class="transition-colors hover:text-foreground">Docs</a>
          <a href="/docs/api" class="transition-colors hover:text-foreground">API</a>
          <a href="https://github.com/ctx-hq" class="transition-colors hover:text-foreground">GitHub</a>
          <a href="/privacy" class="transition-colors hover:text-foreground">Privacy</a>
        </nav>
      </div>
      <div class="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
        &copy; 2026 getctx.org
      </div>
    </Container>
  </footer>
);
