import type { FC } from "hono/jsx";
import type { TrustedPublisher, PackageAccessEntry, VersionSummary } from "../lib/types";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";
import { ConfirmModal } from "../components/confirm-modal";
import { formatDate } from "../lib/format";

export type PkgSettingsTab = "general" | "versions" | "access" | "publish" | "danger";

const TABS: Array<{ id: PkgSettingsTab; label: string }> = [
  { id: "general", label: "General" },
  { id: "versions", label: "Versions" },
  { id: "access", label: "Access" },
  { id: "publish", label: "Publish" },
  { id: "danger", label: "Danger Zone" },
];

export const PackageSettingsPage: FC<{
  fullName: string;
  scope: string;
  name: string;
  tab: PkgSettingsTab;
  visibility: string;
  description?: string;
  keywords?: string[];
  homepage?: string;
  repository?: string;
  license?: string;
  author?: string;
  deprecated?: boolean;
  deprecationMessage?: string;
  distTags?: Record<string, string>;
  versions?: VersionSummary[];
  accessList?: PackageAccessEntry[];
  canManage: boolean;
  trustedPublishers?: TrustedPublisher[];
  error?: string;
  success?: string;
}> = ({
  fullName, scope, name, tab, visibility,
  description, keywords, homepage, repository, license, author,
  deprecated = false, deprecationMessage,
  distTags, versions, accessList, canManage, trustedPublishers,
  error, success,
}) => {
  const settingsBase = `/package/${fullName}/settings`;

  return (
    <Container class="py-10">
      <div class="mb-1 flex items-center gap-2">
        <a href={`/package/${fullName}`} class="text-muted-foreground hover:text-foreground" aria-label="Back to package">
          <Icon name="arrow-right" class="size-3.5 rotate-180" />
        </a>
        <h1 class="text-xl font-semibold font-heading">{fullName}</h1>
      </div>
      <p class="mb-6 text-sm text-muted-foreground">Package settings</p>

      {error && (
        <div class="cn-form-banner-error mb-6" role="alert">{error}</div>
      )}
      {success && (
        <div class="cn-form-banner-success mb-6" role="alert">{success}</div>
      )}

      {!canManage ? (
        <div class="cn-card p-8 text-center">
          <p class="text-sm text-muted-foreground">You don't have permission to manage this package.</p>
        </div>
      ) : (
        <div class="flex flex-col gap-8 md:flex-row">
          {/* Sidebar nav */}
          <nav class="flex shrink-0 gap-1 overflow-x-auto md:w-48 md:flex-col" aria-label="Package settings">
            {TABS.map((t) => (
              <a
                key={t.id}
                href={`${settingsBase}?tab=${t.id}`}
                class={`cn-settings-nav-item whitespace-nowrap ${t.id === "danger" ? "text-destructive" : ""}`}
                {...(t.id === tab ? { "aria-current": "page" } : {})}
              >
                {t.label}
              </a>
            ))}
          </nav>

          {/* Content area */}
          <div class="min-w-0 flex-1">
            {tab === "general" && (
              <GeneralTab
                fullName={fullName}
                visibility={visibility}
                description={description}
                keywords={keywords}
                homepage={homepage}
                repository={repository}
                license={license}
                author={author}
                deprecated={deprecated}
                deprecationMessage={deprecationMessage}
              />
            )}
            {tab === "versions" && (
              <VersionsTab fullName={fullName} versions={versions} distTags={distTags} />
            )}
            {tab === "access" && (
              <AccessTab fullName={fullName} visibility={visibility} accessList={accessList} />
            )}
            {tab === "publish" && (
              <PublishTab fullName={fullName} trustedPublishers={trustedPublishers} />
            )}
            {tab === "danger" && (
              <DangerTab fullName={fullName} scope={scope} name={name} />
            )}
          </div>
        </div>
      )}
    </Container>
  );
};

/* ========== General Tab ========== */

const GeneralTab: FC<{
  fullName: string;
  visibility: string;
  description?: string;
  keywords?: string[];
  homepage?: string;
  repository?: string;
  license?: string;
  author?: string;
  deprecated: boolean;
  deprecationMessage?: string;
}> = ({ fullName, visibility, description, keywords, homepage, repository, license, author, deprecated, deprecationMessage }) => (
  <>
    {/* Metadata */}
    <section class="mb-8">
      <h2 class="mb-4 text-sm font-semibold font-heading">Package Metadata</h2>
      <div class="cn-card p-5">
        <p class="mb-4 text-xs text-muted-foreground">
          Changes here update the registry directly. If you also maintain a ctx.yaml, keep it in sync.
        </p>
        <form method="post" action={`/package/${fullName}/settings/metadata`} class="space-y-4">
          <div>
            <label for="meta-description" class="mb-1 block text-xs text-muted-foreground">Description</label>
            <textarea
              id="meta-description"
              name="description"
              rows={3}
              maxLength={1024}
              placeholder="A short description of this package"
              class="cn-input w-full text-sm"
              aria-describedby="meta-description-hint"
            >{description ?? ""}</textarea>
            <p id="meta-description-hint" class="mt-1 text-xs text-muted-foreground">Max 1024 characters</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="meta-homepage" class="mb-1 block text-xs text-muted-foreground">Homepage</label>
              <input type="url" id="meta-homepage" name="homepage" value={homepage ?? ""} placeholder="https://example.com" class="cn-input w-full text-sm" />
            </div>
            <div>
              <label for="meta-repository" class="mb-1 block text-xs text-muted-foreground">Repository</label>
              <input type="url" id="meta-repository" name="repository" value={repository ?? ""} placeholder="https://github.com/owner/repo" class="cn-input w-full text-sm" />
            </div>
            <div>
              <label for="meta-license" class="mb-1 block text-xs text-muted-foreground">License</label>
              <input type="text" id="meta-license" name="license" value={license ?? ""} placeholder="MIT" class="cn-input w-full text-sm" />
            </div>
            <div>
              <label for="meta-author" class="mb-1 block text-xs text-muted-foreground">Author</label>
              <input type="text" id="meta-author" name="author" value={author ?? ""} placeholder="Author name" class="cn-input w-full text-sm" />
            </div>
          </div>
          <div>
            <label for="meta-keywords" class="mb-1 block text-xs text-muted-foreground">Keywords</label>
            <input type="text" id="meta-keywords" name="keywords" value={(keywords ?? []).join(", ")} placeholder="ai, assistant, tool" class="cn-input w-full text-sm" aria-describedby="meta-keywords-hint" />
            <p id="meta-keywords-hint" class="mt-1 text-xs text-muted-foreground">Comma-separated, max 20 keywords</p>
          </div>
          <Button variant="default" size="sm" type="submit">Save metadata</Button>
        </form>
      </div>
    </section>

    {/* Visibility */}
    <section class="mb-8">
      <h2 class="mb-4 text-sm font-semibold font-heading">Visibility</h2>
      <div class="cn-card p-5">
        <form method="post" action={`/package/${fullName}/settings/visibility`}>
          <fieldset>
            <legend class="sr-only">Package visibility</legend>
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
          </fieldset>
          <div class="mt-4">
            <Button variant="default" size="sm" type="submit">Save visibility</Button>
          </div>
        </form>
      </div>
    </section>

    {/* Deprecation */}
    <section>
      <h2 class="mb-4 text-sm font-semibold font-heading">Deprecation</h2>
      <div class="cn-card p-5">
        <form method="post" action={`/package/${fullName}/settings/deprecate`} class="space-y-3">
          <label class="flex items-center gap-2 text-sm">
            <input type="hidden" name="deprecated" value="false" />
            <input type="checkbox" name="deprecated" value="true" checked={deprecated} />
            Mark as deprecated
          </label>
          <div>
            <label for="deprecation-msg" class="mb-1 block text-xs text-muted-foreground">Deprecation message (optional)</label>
            <input type="text" id="deprecation-msg" name="message" value={deprecationMessage || ""} placeholder="Use @scope/other-package instead" class="cn-input w-full max-w-lg" />
          </div>
          <Button variant="default" size="sm" type="submit">Save</Button>
        </form>
      </div>
    </section>
  </>
);

/* ========== Versions Tab ========== */

const VersionsTab: FC<{
  fullName: string;
  versions?: VersionSummary[];
  distTags?: Record<string, string>;
}> = ({ fullName, versions, distTags }) => (
  <>
    <section class="mb-8">
      <h2 class="mb-4 text-sm font-semibold font-heading">Versions</h2>
      <div class="cn-card p-5">
        {versions && versions.length > 0 ? (
          <>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b text-left text-muted-foreground">
                  <th class="pb-2 font-medium">Version</th>
                  <th class="pb-2 font-medium">Status</th>
                  <th class="pb-2 font-medium">Published</th>
                  <th class="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {versions.slice(0, 20).map((v) => (
                  <tr class="border-b last:border-0" key={v.version}>
                    <td class="py-2 font-mono text-xs">{v.version}</td>
                    <td class="py-2 text-xs">
                      {v.yanked ? (
                        <span class="inline-flex items-center rounded-none bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">yanked</span>
                      ) : (
                        <span class="text-muted-foreground">active</span>
                      )}
                    </td>
                    <td class="py-2 text-xs text-muted-foreground">{formatDate(v.created_at)}</td>
                    <td class="py-2 text-right">
                      <div class="flex items-center justify-end gap-1">
                        {v.yanked ? (
                          <form method="post" action={`/package/${fullName}/settings/versions/${encodeURIComponent(v.version)}/unyank`}>
                            <button type="submit" class="cn-button cn-button-variant-ghost cn-button-size-xs text-xs" aria-label={`Unyank version ${v.version}`}>Unyank</button>
                          </form>
                        ) : (
                          <form method="post" action={`/package/${fullName}/settings/versions/${encodeURIComponent(v.version)}/yank`}>
                            <button type="submit" class="cn-button cn-button-variant-ghost cn-button-size-xs text-xs text-amber-600 dark:text-amber-400" aria-label={`Yank version ${v.version}`}>Yank</button>
                          </form>
                        )}
                        <button
                          type="button"
                          class="cn-button cn-button-variant-ghost cn-button-size-icon-xs text-muted-foreground hover:text-destructive"
                          aria-label={`Delete version ${v.version}`}
                          data-modal-open={`delete-ver-${v.version.replace(/\./g, "-")}`}
                        >
                          <Icon name="trash" class="size-3.5" />
                        </button>
                        <ConfirmModal
                          id={`delete-ver-${v.version.replace(/\./g, "-")}`}
                          title={`Delete version ${v.version}`}
                          description={`This will permanently delete version ${v.version}. This action cannot be undone.`}
                          confirmText={`${fullName}@${v.version}`}
                          action={`/package/${fullName}/settings/versions/${encodeURIComponent(v.version)}/delete`}
                          buttonLabel="Delete version"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {versions.length > 20 && (
              <p class="mt-3 text-xs text-muted-foreground">Showing latest 20 of {versions.length} versions.</p>
            )}
          </>
        ) : (
          <p class="text-sm text-muted-foreground">No versions published.</p>
        )}
      </div>
    </section>

    {/* Dist Tags */}
    <section>
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
                          <button type="submit" class="cn-button cn-button-variant-ghost cn-button-size-icon-xs text-muted-foreground hover:text-destructive" title={`Delete tag "${tag}"`} aria-label={`Delete dist-tag ${tag}`}>
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
            <label for="dt-tag" class="mb-1 block text-xs text-muted-foreground">Tag</label>
            <input type="text" id="dt-tag" name="tag" required placeholder="beta" class="cn-input text-sm w-32" />
          </div>
          <div>
            <label for="dt-version" class="mb-1 block text-xs text-muted-foreground">Version</label>
            <input type="text" id="dt-version" name="version" required placeholder="1.0.0" class="cn-input text-sm w-32" />
          </div>
          <Button variant="default" size="sm" type="submit">Set tag</Button>
        </form>
      </div>
    </section>
  </>
);

/* ========== Access Tab ========== */

const AccessTab: FC<{
  fullName: string;
  visibility: string;
  accessList?: PackageAccessEntry[];
}> = ({ fullName, visibility, accessList }) => (
  <section>
    <h2 class="mb-4 text-sm font-semibold font-heading">Access Control</h2>
    {visibility !== "private" ? (
      <div class="cn-card p-5">
        <p class="text-sm text-muted-foreground">Access control is only available for private packages. This package is currently <strong>{visibility}</strong>.</p>
      </div>
    ) : (
      <div class="cn-card p-5">
        <p class="mb-4 text-sm text-muted-foreground">Grant specific users access to this private package.</p>
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
                        <button type="submit" class="cn-button cn-button-variant-ghost cn-button-size-icon-xs text-muted-foreground hover:text-destructive" title={`Revoke access for ${entry.username}`} aria-label={`Revoke access for ${entry.username}`}>
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
            <label for="acl-username" class="mb-1 block text-xs text-muted-foreground">Username</label>
            <input type="text" id="acl-username" name="username" required placeholder="username" class="cn-input text-sm w-full max-w-xs" />
          </div>
          <Button variant="default" size="sm" type="submit">Grant access</Button>
        </form>
      </div>
    )}
  </section>
);

/* ========== Publish Tab ========== */

const PublishTab: FC<{
  fullName: string;
  trustedPublishers?: TrustedPublisher[];
}> = ({ fullName, trustedPublishers }) => (
  <section>
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
                <th class="pb-2 font-medium" />
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
            <label for="tp-repo" class="block text-xs text-muted-foreground mb-1">GitHub repository</label>
            <input type="text" id="tp-repo" name="github_repo" placeholder="owner/repo" required class="cn-input text-sm w-full" />
          </div>
          <div>
            <label for="tp-workflow" class="block text-xs text-muted-foreground mb-1">Workflow filename</label>
            <input type="text" id="tp-workflow" name="workflow" placeholder="release.yml" required class="cn-input text-sm w-full" />
          </div>
          <div>
            <label for="tp-env" class="block text-xs text-muted-foreground mb-1">Environment (optional)</label>
            <input type="text" id="tp-env" name="environment" placeholder="production" class="cn-input text-sm w-full" />
          </div>
        </div>
        <Button variant="default" size="sm" type="submit">Add trusted publisher</Button>
      </form>
    </div>
  </section>
);

/* ========== Danger Tab ========== */

const DangerTab: FC<{
  fullName: string;
  scope: string;
  name: string;
}> = ({ fullName, scope, name }) => (
  <section>
    <h2 class="text-lg font-semibold text-destructive mb-4 font-heading">Danger Zone</h2>
    <div class="space-y-4">
      {/* Rename */}
      <div class="cn-card border-destructive/30 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Rename this package</p>
            <p class="text-xs text-muted-foreground">The old name will redirect to the new one. Only the name changes; the scope stays the same.</p>
          </div>
          <button type="button" class="cn-button cn-button-variant-destructive cn-button-size-sm" data-modal-open="rename-pkg-modal">Rename</button>
        </div>
        <dialog id="rename-pkg-modal" class="m-auto max-w-md rounded-none border border-border bg-background p-0 shadow-lg backdrop:bg-black/50" aria-labelledby="rename-modal-title">
          <div class="p-6">
            <h3 id="rename-modal-title" class="text-base font-semibold font-heading text-red-600 dark:text-red-400">Rename package</h3>
            <p class="mt-2 text-sm text-foreground/70">The old name will automatically redirect. This cannot be easily undone.</p>
            <form method="post" action={`/package/${fullName}/settings/rename`} class="mt-4 space-y-3">
              <div>
                <label for="rename-new-name" class="mb-1 block text-xs text-foreground/70">New name</label>
                <div class="flex items-center gap-1">
                  <span class="text-sm text-foreground/70">@{scope}/</span>
                  <input type="text" id="rename-new-name" name="new_name" placeholder={name} required class="cn-input text-sm flex-1" />
                </div>
              </div>
              <div>
                <p class="mb-1 text-sm text-foreground">Type <code class="rounded-none bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{fullName}</code> to confirm:</p>
                <input type="text" name="confirm" required autocomplete="off" placeholder={fullName} class="cn-input w-full text-sm" />
              </div>
              <div class="mt-4 flex justify-end gap-3">
                <button type="button" class="cn-button cn-button-variant-ghost cn-button-size-sm text-foreground/70" data-modal-close>Cancel</button>
                <Button variant="destructive" size="sm" type="submit">Rename package</Button>
              </div>
            </form>
          </div>
        </dialog>
      </div>

      {/* Transfer */}
      <div class="cn-card border-destructive/30 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Transfer this package</p>
            <p class="text-xs text-muted-foreground">Transfer ownership to another user or organization. The target must accept the request.</p>
          </div>
          <button type="button" class="cn-button cn-button-variant-destructive cn-button-size-sm" data-modal-open="transfer-pkg-modal">Transfer</button>
        </div>
        <dialog id="transfer-pkg-modal" class="m-auto max-w-md rounded-none border border-border bg-background p-0 shadow-lg backdrop:bg-black/50" aria-labelledby="transfer-modal-title">
          <div class="p-6">
            <h3 id="transfer-modal-title" class="text-base font-semibold font-heading text-red-600 dark:text-red-400">Transfer package</h3>
            <p class="mt-2 text-sm text-foreground/70">The target user or organization must accept the transfer. The old name will redirect automatically.</p>
            <form method="post" action={`/package/${fullName}/settings/transfer`} class="mt-4 space-y-3">
              <div>
                <label for="transfer-to" class="mb-1 block text-xs text-foreground/70">Target scope</label>
                <input type="text" id="transfer-to" name="to" placeholder="@orgname" required class="cn-input w-full text-sm" />
              </div>
              <div>
                <label for="transfer-message" class="mb-1 block text-xs text-foreground/70">Message (optional)</label>
                <input type="text" id="transfer-message" name="message" placeholder="Reason for transfer" class="cn-input w-full text-sm" />
              </div>
              <div>
                <p class="mb-1 text-sm text-foreground">Type <code class="rounded-none bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{fullName}</code> to confirm:</p>
                <input type="text" name="confirm" required autocomplete="off" placeholder={fullName} class="cn-input w-full text-sm" />
              </div>
              <div class="mt-4 flex justify-end gap-3">
                <button type="button" class="cn-button cn-button-variant-ghost cn-button-size-sm text-foreground/70" data-modal-close>Cancel</button>
                <Button variant="destructive" size="sm" type="submit">Transfer package</Button>
              </div>
            </form>
          </div>
        </dialog>
      </div>

      {/* Delete */}
      <div class="cn-card border-destructive/30 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Delete this package</p>
            <p class="text-xs text-muted-foreground">Permanently delete this package and all its versions. This action cannot be undone.</p>
          </div>
          <button type="button" class="cn-button cn-button-variant-destructive cn-button-size-sm inline-flex items-center gap-2" data-modal-open="delete-pkg-modal">
            <Icon name="trash" class="size-4" />
            Delete
          </button>
        </div>
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
  </section>
);
