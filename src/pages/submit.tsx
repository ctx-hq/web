import type { FC } from "hono/jsx";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";

/**
 * Package submission page — users can suggest upstream packages
 * for the ctx team to wrap and publish.
 */
export const SubmitPage: FC<{ error?: string; success?: boolean }> = ({ error, success }) => {
  return (
    <Container>
      <div class="mx-auto max-w-xl py-12">
        <h1 class="text-xl font-bold font-heading mb-2">Submit a Package</h1>
        <p class="text-muted-foreground mb-8">
          Know an MCP server, CLI tool, or skill that should be on ctx?
          Submit a link and we'll review it for packaging.
        </p>

        {success ? (
          <div class="cn-alert cn-alert-success mb-6" role="alert">
            <strong>Submitted!</strong> We'll review your request and notify you when the package is available.
          </div>
        ) : (
          <>
        {error && (
          <div class="cn-alert cn-alert-destructive mb-6" role="alert">
            {error}
          </div>
        )}

        <form method="post" action="/submit" class="space-y-5">
          <div>
            <label for="source_url" class="block text-sm font-medium mb-1.5">
              Source URL <span class="text-destructive">*</span>
            </label>
            <input
              id="source_url"
              name="source_url"
              type="text"
              required
              placeholder="npm:@playwright/mcp or github:github/github-mcp-server"
              class="cn-input w-full"
              aria-describedby="source_url_hint"
            />
            <p id="source_url_hint" class="mt-1 text-xs text-muted-foreground">
              Prefix with npm:, github:, or docker: — or paste a URL
            </p>
          </div>

          <div>
            <label for="reason" class="block text-sm font-medium mb-1.5">
              Why should we add this? <span class="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              placeholder="Official GitHub MCP server, widely used in AI workflows"
              class="cn-input w-full resize-y"
            />
          </div>

          <Button type="submit">
            <Icon name="plus" class="size-4" />
            Submit Request
          </Button>
        </form>
          </>
        )}

        <div class="mt-10 border-t border-border pt-6">
          <h2 class="text-sm font-semibold mb-3">Supported source formats</h2>
          <div class="grid gap-2 text-xs text-muted-foreground">
            <div class="flex items-center gap-2">
              <code class="bg-muted px-1.5 py-0.5">npm:@playwright/mcp</code>
              <span>npm package</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="bg-muted px-1.5 py-0.5">github:github/github-mcp-server</code>
              <span>GitHub repository</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="bg-muted px-1.5 py-0.5">docker:ghcr.io/org/image</code>
              <span>Docker image</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
