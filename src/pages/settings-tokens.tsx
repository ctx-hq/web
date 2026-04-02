import type { FC } from "hono/jsx";
import type { TokenInfo } from "../lib/types";
import { ENDPOINT_SCOPES } from "../lib/types";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/** Tokens section — reusable inside the unified Settings page. */
export const SettingsTokensSection: FC<{
  tokens: TokenInfo[];
  newToken?: string;
  error?: string;
  success?: string;
}> = ({ tokens, newToken, error, success }) => (
  <>
    {error && (
      <div class="cn-card mb-6 border-destructive/50 bg-destructive/5 p-4">
        <p class="text-sm text-destructive">{error}</p>
      </div>
    )}
    {success && (
      <div class="cn-card mb-6 border-green-600/50 bg-green-600/5 p-4">
        <p class="text-sm text-green-700">{success}</p>
      </div>
    )}

    {newToken && (
      <div class="cn-card mb-6 border-green-600/50 bg-green-600/5 p-4" role="alert">
        <p class="mb-2 text-sm font-medium text-green-700">Token created successfully</p>
        <div class="flex items-center gap-2">
          <code class="block flex-1 rounded bg-green-50 p-3 font-mono text-sm break-all dark:bg-green-900/20">
            {newToken}
          </code>
          <Button variant="outline" size="sm" type="button" data-copy={newToken} class="shrink-0">
            <Icon name="copy" class="size-3.5" />
            Copy
          </Button>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          Copy this token now. It will not be shown again.
        </p>
      </div>
    )}

    {/* Create Token Form */}
    <div class="cn-card mb-8 p-6">
      <h2 class="mb-4 text-lg font-medium font-heading">Create New Token</h2>
      <form method="post" action="/settings/tokens/create" class="space-y-4">
        <div>
          <label for="name" class="mb-1 block text-sm font-medium">
            Name <span class="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder='e.g. "github-ci", "deploy-key"'
            class="cn-input w-full max-w-md"
            aria-required="true"
          />
        </div>

        <fieldset>
          <legend class="mb-2 text-sm font-medium">Endpoint Scopes</legend>
          <div class="flex flex-wrap gap-3">
            {ENDPOINT_SCOPES.map((scope) => (
              <label class="flex items-center gap-1.5 text-sm" key={scope}>
                <input type="checkbox" name="endpoint_scopes" value={scope} class="rounded" />
                {scope}
              </label>
            ))}
          </div>
          <p class="mt-1 text-xs text-muted-foreground">Leave unchecked for all scopes.</p>
        </fieldset>

        <div>
          <label for="package_scopes" class="mb-1 block text-sm font-medium">
            Package Scopes
          </label>
          <input
            type="text"
            id="package_scopes"
            name="package_scopes"
            placeholder="@scope/*, @scope/name (comma-separated)"
            class="cn-input w-full max-w-md"
          />
          <p class="mt-1 text-xs text-muted-foreground">
            Leave empty for all packages.
          </p>
        </div>

        <div class="flex items-center gap-4">
          <div>
            <label for="expires" class="mb-1 block text-sm font-medium">
              Expires in (days)
            </label>
            <input
              type="number"
              id="expires"
              name="expires_in_days"
              min="1"
              max="365"
              placeholder="90"
              class="cn-input w-24"
            />
          </div>

          <div>
            <label for="token_type" class="mb-1 block text-sm font-medium">
              Type
            </label>
            <select id="token_type" name="token_type" class="cn-input">
              <option value="personal">Personal</option>
              <option value="deploy">Deploy (read-only)</option>
            </select>
          </div>
        </div>

        <button type="submit" class="cn-button cn-button-variant-default cn-button-size-sm">
          Create Token
        </button>
      </form>
    </div>

    {/* Token List */}
    <div>
      <h2 class="mb-4 text-lg font-medium font-heading">Active Tokens</h2>
      {tokens.length === 0 ? (
        <p class="text-sm text-muted-foreground">No tokens yet.</p>
      ) : (
        <div class="overflow-x-auto">
          <table class="w-full text-sm" role="table">
            <thead>
              <tr class="border-b text-left text-muted-foreground">
                <th class="pb-2 pr-4 font-medium" scope="col">Name</th>
                <th class="pb-2 pr-4 font-medium" scope="col">Type</th>
                <th class="pb-2 pr-4 font-medium" scope="col">Scopes</th>
                <th class="pb-2 pr-4 font-medium" scope="col">Last Used</th>
                <th class="pb-2 pr-4 font-medium" scope="col">Expires</th>
                <th class="pb-2 font-medium" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr class="border-b" key={t.id}>
                  <td class="py-3 pr-4 font-medium">{t.name}</td>
                  <td class="py-3 pr-4">
                    <span class={`inline-block rounded px-1.5 py-0.5 text-xs ${
                      t.token_type === "deploy"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {t.token_type || "personal"}
                    </span>
                  </td>
                  <td class="py-3 pr-4">
                    <span class="text-muted-foreground">
                      {t.endpoint_scopes?.includes("*")
                        ? "all"
                        : t.endpoint_scopes?.join(", ") || "all"}
                    </span>
                  </td>
                  <td class="py-3 pr-4 text-muted-foreground">
                    {timeAgo(t.last_used_at)}
                  </td>
                  <td class="py-3 pr-4 text-muted-foreground">
                    {t.expires_at
                      ? new Date(t.expires_at).toLocaleDateString()
                      : "never"}
                  </td>
                  <td class="py-3">
                    <form method="post" action={`/settings/tokens/${t.id}/revoke`}>
                      <button
                        type="submit"
                        class="cn-button cn-button-variant-destructive cn-button-size-xs"
                        aria-label={`Revoke token ${t.name}`}
                      >
                        Revoke
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </>
);
