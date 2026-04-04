import type { FC } from "hono/jsx";
import type { SessionUser, TokenInfo, Profile } from "../lib/types";
import { Container } from "../components/ui/container";
import { Icon } from "../components/ui/icon";
import { SettingsTokensSection } from "./settings-tokens";
import { ConfirmModal } from "../components/confirm-modal";
import { avatarUrl } from "../lib/avatar";

export type SettingsTab = "profile" | "tokens" | "account";

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "tokens", label: "Tokens" },
  { id: "account", label: "Account" },
];

export const SettingsPage: FC<{
  user: SessionUser;
  tab: SettingsTab;
  profile?: Profile;
  tokens?: TokenInfo[];
  newToken?: string;
  error?: string;
  success?: string;
}> = ({ user, tab, profile, tokens = [], newToken, error, success }) => (
  <Container class="py-10">
    <h1 class="mb-6 text-xl font-semibold font-heading">Settings</h1>

    <div class="flex flex-col gap-8 md:flex-row">
      {/* Sidebar nav */}
      <nav class="flex shrink-0 gap-1 overflow-x-auto md:w-48 md:flex-col" aria-label="Settings">
        {TABS.map((t) => (
          <a
            key={t.id}
            href={`/settings?tab=${t.id}`}
            class="cn-settings-nav-item whitespace-nowrap"
            {...(t.id === tab ? { "aria-current": "page" } : {})}
          >
            {t.label}
          </a>
        ))}
      </nav>

      {/* Content area */}
      <div class="min-w-0 flex-1">
        {tab === "profile" && (
          <ProfileSection user={user} profile={profile} error={error} success={success} />
        )}
        {tab === "tokens" && (
          <SettingsTokensSection tokens={tokens} newToken={newToken} error={error} success={success} />
        )}
        {tab === "account" && (
          <AccountSection user={user} error={error} success={success} />
        )}
      </div>
    </div>
  </Container>
);

/* ---------- Profile Section ---------- */

const ProfileSection: FC<{
  user: SessionUser;
  profile?: Profile;
  error?: string;
  success?: string;
}> = ({ user, profile, error, success }) => (
  <>
    {error && (
      <div class="cn-card mb-6 border-destructive/50 bg-destructive/5 p-4">
        <p class="text-sm text-destructive">{error}</p>
      </div>
    )}
    {success && (
      <div class="cn-alert cn-alert-success mb-6">{success}</div>
    )}

    <div class="cn-card p-6">
      <div class="mb-6 flex items-center gap-4">
        <img
          src={user.avatar_url || avatarUrl(user.username, 64)}
          alt=""
          class="size-16 rounded-full border border-border bg-muted"
          data-avatar-fallback
        />
        <div>
          <p class="text-sm font-medium">@{user.username}</p>
          <p class="text-xs text-muted-foreground">Avatar synced from GitHub</p>
        </div>
      </div>

      <form method="post" action="/settings/profile/update" class="space-y-4">
        <div>
          <label for="bio" class="mb-1 block text-sm font-medium">Bio</label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={256}
            placeholder="Tell us about yourself..."
            class="cn-input w-full max-w-lg"
          >
            {profile?.bio || ""}
          </textarea>
          <p class="mt-1 text-xs text-muted-foreground">Max 256 characters.</p>
        </div>

        <div>
          <label for="website" class="mb-1 block text-sm font-medium">Website</label>
          <input
            type="url"
            id="website"
            name="website"
            value={profile?.website || ""}
            placeholder="https://example.com"
            class="cn-input w-full max-w-lg"
          />
        </div>

        <button type="submit" class="cn-button cn-button-variant-default cn-button-size-sm">
          Save changes
        </button>
      </form>
    </div>
  </>
);

/* ---------- Account Section ---------- */

const AccountSection: FC<{
  user: SessionUser;
  error?: string;
  success?: string;
}> = ({ user, error, success }) => (
  <>
    {error && (
      <div class="cn-card mb-6 border-destructive/50 bg-destructive/5 p-4">
        <p class="text-sm text-destructive">{error}</p>
      </div>
    )}
    {success && (
      <div class="cn-alert cn-alert-success mb-6">{success}</div>
    )}

    {/* Rename Account */}
    <div class="cn-card mb-8 p-6">
      <h2 class="mb-1 text-lg font-medium font-heading">Rename Account</h2>
      <p class="mb-4 text-sm text-muted-foreground">
        Change your username. You can only rename once every 30 days. Old URLs will redirect automatically.
      </p>
      <form method="post" action="/settings/account/rename" class="space-y-4">
        <div>
          <label for="new_username" class="mb-1 block text-sm font-medium">
            New username
          </label>
          <input
            type="text"
            id="new_username"
            name="new_username"
            required
            pattern="^[a-z0-9]([a-z0-9-]*[a-z0-9])?$"
            placeholder="new-username"
            class="cn-input w-full max-w-md"
            aria-required="true"
          />
          <p class="mt-1 text-xs text-muted-foreground">
            Lowercase letters, numbers, and hyphens only.
          </p>
        </div>
        <div>
          <label for="rename_confirm" class="mb-1 block text-sm font-medium">
            Type <strong>{user.username}</strong> to confirm
          </label>
          <input
            type="text"
            id="rename_confirm"
            name="confirm"
            required
            autocomplete="off"
            class="cn-input w-full max-w-md"
            aria-required="true"
          />
        </div>
        <button type="submit" class="cn-button cn-button-variant-default cn-button-size-sm">
          Rename account
        </button>
      </form>
    </div>

    {/* Danger Zone */}
    <div class="cn-card border-destructive/30 p-6">
      <h2 class="mb-1 text-lg font-medium font-heading text-destructive">Danger Zone</h2>
      <p class="mb-4 text-sm text-muted-foreground">
        Permanently delete your account. Your packages will be reassigned to the system. This action cannot be undone.
      </p>
      <button
        type="button"
        class="cn-button cn-button-variant-destructive cn-button-size-sm inline-flex items-center gap-2"
        data-modal-open="delete-account-modal"
      >
        <Icon name="trash" class="size-4" />
        Delete account
      </button>
      <ConfirmModal
        id="delete-account-modal"
        title="Delete your account"
        description={`This will permanently delete your account @${user.username}. Your packages will be reassigned to the system and your tokens will be revoked.`}
        confirmText={user.username}
        action="/settings/account/delete"
        buttonLabel="Delete my account"
      />
    </div>
  </>
);
