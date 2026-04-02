import type { FC } from "hono/jsx";
import type { TrustedPublisher, PackageAccessEntry } from "../lib/types";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";
import { ConfirmModal } from "../components/confirm-modal";

export const PackageSettingsPage: FC<{
  fullName: string;
  scope: string;
  name: string;
  visibility: string;
  deprecated?: boolean;
  deprecationMessage?: string;
  distTags?: Record<string, string>;
  accessList?: PackageAccessEntry[];
  canManage: boolean;
  trustedPublishers?: TrustedPublisher[];
  error?: string;
  success?: string;
}> = ({ fullName, scope, name, visibility, deprecated = false, deprecationMessage, distTags, accessList, canManage, trustedPublishers, error, success }) => (
  <Container class="py-10">
    <h1 class="mb-1 text-xl font-semibold font-heading">{fullName}</h1>
    <p class="mb-8 text-sm text-muted-foreground">Package settings</p>

    {error && (
      <div class="cn-form-banner-error mb-6">{error}</div>
    )}
    {success && (
      <div class="cn-form-banner-success mb-6">{success}</div>
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

        {/* Deprecation */}
        <section class="mb-8">
          <h2 class="mb-4 text-sm font-semibold font-heading">Deprecation</h2>
          <div class="cn-card p-5">
            <form method="post" action={`/package/${fullName}/settings/deprecate`} class="space-y-3">
              <label class="flex items-center gap-2 text-sm">
                <input type="hidden" name="deprecated" value="false" />
                <input type="checkbox" name="deprecated" value="true" checked={deprecated} />
                Mark as deprecated
              </label>
              <div>
                <label for="deprecation-msg" class="mb-1 block text-xs text-muted-foreground">
                  Deprecation message (optional)
                </label>
                <input
                  type="text"
                  id="deprecation-msg"
                  name="message"
                  value={deprecationMessage || ""}
                  placeholder="Use @scope/other-package instead"
                  class="cn-input w-full max-w-lg"
                />
              </div>
              <Button variant="default" size="sm" type="submit">Save</Button>
            </form>
          </div>
        </section>

        {/* Dist Tags */}
        <section class="mb-8">
          <h2 class="mb-4 text-sm font-semibold font-heading">Distribution Tags</h2>
          <div class="cn-card p-5">
            {distTags && Object.keys(distTags).length > 0 ? (
              <div class="mb-4">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b text-left text-muted-foreground">
                      <th class="pb-2 font-medium">Tag</th>
                      <th class="pb-2 font-medium">Version</th>
                      <th class="pb-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(distTags).map(([tag, version]) => (
                      <tr class="border-b last:border-0" key={tag}>
                        <td class="py-2 font-mono text-xs">{tag}</td>
                        <td class="py-2 font-mono text-xs">{version}</td>
                        <td class="py-2 text-right">
                          {tag !== "latest" && (
                            <form method="post" action={`/package/${fullName}/settings/dist-tag/${encodeURIComponent(tag)}/delete`}>
                              <button
                                type="submit"
                                class="cn-button cn-button-variant-ghost cn-button-size-icon-xs text-muted-foreground hover:text-destructive"
                                title={`Delete tag "${tag}"`}
                                aria-label={`Delete dist-tag ${tag}`}
                              >
                                <Icon name="trash" class="size-3.5" />
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p class="mb-4 text-sm text-muted-foreground">No dist-tags set.</p>
            )}

            <form method="post" action={`/package/${fullName}/settings/dist-tag`} class="flex items-end gap-3">
              <div>
                <label class="mb-1 block text-xs text-muted-foreground">Tag</label>
                <input type="text" name="tag" required placeholder="beta" class="cn-input text-sm w-32" />
              </div>
              <div>
                <label class="mb-1 block text-xs text-muted-foreground">Version</label>
                <input type="text" name="version" required placeholder="1.0.0" class="cn-input text-sm w-32" />
              </div>
              <Button variant="default" size="sm" type="submit">Set tag</Button>
            </form>
          </div>
        </section>

        {/* Private Package ACL */}
        {visibility === "private" && (
          <section class="mb-8">
            <h2 class="mb-4 text-sm font-semibold font-heading">Access Control</h2>
            <div class="cn-card p-5">
              <p class="mb-4 text-sm text-muted-foreground">
                Grant specific users access to this private package.
              </p>
              {accessList && accessList.length > 0 ? (
                <div class="mb-4">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b text-left text-muted-foreground">
                        <th class="pb-2 font-medium">User</th>
                        <th class="pb-2 font-medium">Granted by</th>
                        <th class="pb-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {accessList.map((entry) => (
                        <tr class="border-b last:border-0" key={entry.username}>
                          <td class="py-2 text-sm">@{entry.username}</td>
                          <td class="py-2 text-xs text-muted-foreground">{entry.granted_by}</td>
                          <td class="py-2 text-right">
                            <form method="post" action={`/package/${fullName}/settings/access`}>
                              <input type="hidden" name="action" value="remove" />
                              <input type="hidden" name="username" value={entry.username} />
                              <button
                                type="submit"
                                class="cn-button cn-button-variant-ghost cn-button-size-icon-xs text-muted-foreground hover:text-destructive"
                                title={`Revoke access for ${entry.username}`}
                                aria-label={`Revoke access for ${entry.username}`}
                              >
                                <Icon name="x" class="size-3.5" />
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p class="mb-4 text-sm text-muted-foreground">No users have been granted access.</p>
              )}

              <form method="post" action={`/package/${fullName}/settings/access`} class="flex items-end gap-3">
                <input type="hidden" name="action" value="add" />
                <div class="flex-1">
                  <label class="mb-1 block text-xs text-muted-foreground">Username</label>
                  <input type="text" name="username" required placeholder="username" class="cn-input text-sm w-full max-w-xs" />
                </div>
                <Button variant="default" size="sm" type="submit">Grant access</Button>
              </form>
            </div>
          </section>
        )}

        {/* Trusted Publishers */}
        <section class="mb-8">
          <h2 class="mb-4 text-sm font-semibold font-heading">Trusted Publishers</h2>
          <div class="cn-card p-5">
            <p class="text-sm text-muted-foreground mb-4">
              Configure GitHub Actions workflows that can publish this package without an API token.
              The workflow exchanges a GitHub OIDC token for a short-lived, scoped ctx API token.
            </p>

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
          <div class="border-t border-destructive/30 pt-8">
            <h2 class="text-lg font-semibold text-destructive mb-4 font-heading">Danger Zone</h2>
            <div class="space-y-4">
              {/* Rename */}
              <div class="cn-card border-destructive/30 p-5">
                <div class="mb-3">
                  <p class="text-sm font-medium">Rename this package</p>
                  <p class="text-xs text-muted-foreground">
                    The old name will redirect to the new one. Only the name changes; the scope stays the same.
                  </p>
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
              <div class="cn-card border-destructive/30 p-5">
                <div class="mb-3">
                  <p class="text-sm font-medium">Transfer this package</p>
                  <p class="text-xs text-muted-foreground">
                    Transfer ownership to another user or organization. The target must accept the request.
                  </p>
                </div>
                <form method="post" action={`/package/${fullName}/settings/transfer`} class="flex items-end gap-3">
                  <div class="flex-1">
                    <label class="block text-xs text-muted-foreground mb-1">Target scope</label>
                    <input type="text" name="to" placeholder="@orgname" required class="cn-input text-sm" />
                  </div>
                  <Button variant="destructive" size="sm" type="submit">Transfer</Button>
                </form>
              </div>

              {/* Delete */}
              <div class="cn-card border-destructive/30 p-5">
                <div class="mb-3">
                  <p class="text-sm font-medium">Delete this package</p>
                  <p class="text-xs text-muted-foreground">
                    Permanently delete this package and all its versions. This action cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  class="cn-button cn-button-variant-destructive cn-button-size-sm inline-flex items-center gap-2"
                  onclick={`document.getElementById('delete-pkg-modal').showModal()`}
                >
                  <Icon name="trash" class="size-4" />
                  Delete package
                </button>
                <ConfirmModal
                  id="delete-pkg-modal"
                  title="Delete package"
                  description={`This will permanently delete ${fullName} and all its versions. This action cannot be undone.`}
                  confirmText={fullName}
                  action={`/package/${fullName}/settings/delete`}
                  buttonLabel="Delete package"
                />
              </div>
            </div>
          </div>
        </section>
      </>
    )}
  </Container>
);
