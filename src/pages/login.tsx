import type { FC } from "hono/jsx";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";

export const LoginPage: FC<{ githubClientId?: string; oauthState?: string }> = ({
  githubClientId,
  oauthState,
}) => (
  <Container size="narrow" class="py-20 text-center">
    <div class="mx-auto max-w-sm">
      <h1 class="mb-3 text-lg font-semibold font-heading">Sign in to getctx.org</h1>
      <p class="mb-8 text-xs text-muted-foreground">
        Publish and manage your packages.
      </p>
      {githubClientId ? (
        <Button
          variant="default"
          size="lg"
          href={`https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=read:user,user:email&state=${encodeURIComponent(oauthState ?? "")}`}
        >
          <Icon name="github-logo" class="size-4" />
          Sign in with GitHub
        </Button>
      ) : (
        <div class="cn-card p-6 text-center">
          <p class="mb-3 text-xs text-muted-foreground">GitHub OAuth is not configured yet.</p>
          <p class="text-xs text-muted-foreground">
            For now, use the CLI:&nbsp;
            <code class="bg-muted px-2 py-0.5 font-mono">ctx login</code>
          </p>
        </div>
      )}
    </div>
  </Container>
);
