import type { FC } from "hono/jsx";
import type { TrustedPublisher } from "../lib/types";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";

export const PackageSettingsPage: FC<{
  fullName: string;
  scope: string;
  name: string;
  visibility: string;
  canManage: boolean;
  trustedPublishers?: TrustedPublisher[];
  error?: string;
}> = ({ fullName, scope, name, visibility, canManage, trustedPublishers, error }) => (
  <Container class="py-10">
    <h1 class="mb-1 text-xl font-semibold font-heading">{fullName}</h1>
    <p class="mb-8 text-sm text-muted-foreground">Package settings</p>

    {error && (
      <div class="cn-form-banner-error mb-6">{error}</div>
    )}

    {!canManage ? (
      <div class="cn-card p-8 text-center">
        <p class="text-sm text-muted-foreground">You don't have permission to manage this package.</p>
      </div>
    ) : (
      <>
        {/* Visibility */}
        <section class="mb-8">
          <h2 class="mb-4 text-sm font-semibold font-heading">Visibility</h2>
          <div class="cn-card p-5">
            <form method="post" action={`/package/${fullName}/settings/visibility`}>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 text-sm">
                  <input type="radio" name="visibility" value="public" checked={visibility === "public"} />
                  Public
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="radio" name="visibility" value="unlisted" checked={visibility === "unlisted"} />
                  Unlisted
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="radio" name="visibility" value="private" checked={visibility === "private"} />
                  Private
                </label>
              </div>
              <div class="mt-4">
                <Button variant="default" size="sm" type="submit">Save visibility</Button>
              </div>
            </form>
          </div>
        </section>

        {/* Trusted Publishers */}
        <section class="mb-8">
          <h2 class="mb-4 text-sm font-semibold font-heading">Trusted Publishers</h2>
          <div class="cn-card p-5">
            <p class="text-sm text-muted-foreground mb-4">
              Configure GitHub Actions workflows that can publish this package without an API token.
              The workflow exchanges a GitHub OIDC token for a short-lived, scoped ctx API token.
            </p>

            {/* Existing configs */}
            {trustedPublishers && trustedPublishers.length > 0 ? (
              <div class="mb-6">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b text-left text-muted-foreground">
                      <th class="pb-2 font-medium">Repository</th>
                      <th class="pb-2 font-medium">Workflow</th>
                      <th class="pb-2 font-medium">Environment</th>
                      <th class="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trustedPublishers.map((tp) => (
                      <tr class="border-b last:border-0">
                        <td class="py-2 font-mono text-xs">{tp.github_repo}</td>
                        <td class="py-2 font-mono text-xs">{tp.workflow}</td>
                        <td class="py-2 text-xs">{tp.environment || <span class="text-muted-foreground">any</span>}</td>
                        <td class="py-2 text-right">
                          <form method="post" action={`/package/${fullName}/settings/trusted-publishers/${tp.id}/delete`}>
                            <Button variant="destructive" size="sm" type="submit">Remove</Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p class="text-sm text-muted-foreground mb-6">No trusted publishers configured.</p>
            )}

            {/* Add new config */}
            <form method="post" action={`/package/${fullName}/settings/trusted-publishers`} class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs text-muted-foreground mb-1">GitHub repository</label>
                  <input type="text" name="github_repo" placeholder="owner/repo" required class="cn-input text-sm w-full" />
                </div>
                <div>
                  <label class="block text-xs text-muted-foreground mb-1">Workflow filename</label>
                  <input type="text" name="workflow" placeholder="release.yml" required class="cn-input text-sm w-full" />
                </div>
                <div>
                  <label class="block text-xs text-muted-foreground mb-1">Environment (optional)</label>
                  <input type="text" name="environment" placeholder="production" class="cn-input text-sm w-full" />
                </div>
              </div>
              <div>
                <Button variant="default" size="sm" type="submit">Add trusted publisher</Button>
              </div>
            </form>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <div class="border-t border-red-200 dark:border-red-900 pt-8">
            <h2 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
            <div class="space-y-4">
              {/* Rename */}
              <div class="p-4 border border-red-200 dark:border-red-900 rounded-lg">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <p class="font-medium">Rename this package</p>
                    <p class="text-sm text-gray-500">
                      The old name will redirect to the new one. Only the name changes; the scope stays the same.
                    </p>
                  </div>
                </div>
                <form method="post" action={`/package/${fullName}/settings/rename`} class="flex items-end gap-3">
                  <div class="flex-1">
                    <label class="block text-xs text-muted-foreground mb-1">New name</label>
                    <div class="flex items-center gap-1">
                      <span class="text-sm text-muted-foreground">@{scope}/</span>
                      <input type="text" name="new_name" placeholder={name} required class="cn-input text-sm flex-1" />
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" type="submit">Rename</Button>
                </form>
              </div>

              {/* Transfer */}
              <div class="p-4 border border-red-200 dark:border-red-900 rounded-lg">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <p class="font-medium">Transfer this package</p>
                    <p class="text-sm text-gray-500">
                      Transfer ownership to another user or organization. The target must accept the request.
                    </p>
                  </div>
                </div>
                <form method="post" action={`/package/${fullName}/settings/transfer`} class="flex items-end gap-3">
                  <div class="flex-1">
                    <label class="block text-xs text-muted-foreground mb-1">Target scope</label>
                    <input type="text" name="to" placeholder="@orgname" required class="cn-input text-sm" />
                  </div>
                  <Button variant="destructive" size="sm" type="submit">Transfer</Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </>
    )}
  </Container>
);
