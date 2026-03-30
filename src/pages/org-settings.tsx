import type { FC } from "hono/jsx";
import type { OrgDetail, OrgMember, OrgInvitation } from "../lib/types";
import { Container } from "../components/ui/container";
import { Badge } from "../components/badge";

export const OrgSettingsPage: FC<{
  org: OrgDetail;
  members: OrgMember[];
  invitations: OrgInvitation[];
  currentUser: string;
  userRole: string;
  error?: string;
  success?: string;
}> = ({ org, members, invitations, currentUser, userRole, error, success }) => (
  <Container class="py-10">
    <div class="mb-6">
      <h1 class="mb-1 text-xl font-semibold font-heading">
        Settings — {org.display_name || org.name}
      </h1>
      <p class="text-sm text-muted-foreground">@{org.name}</p>
    </div>

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

    <div class="space-y-8">
      {/* Invite Member */}
      {(userRole === "owner" || userRole === "admin") && (
        <section>
          <h2 class="mb-4 text-lg font-semibold font-heading">Invite Member</h2>
          <form method="post" action={`/org/${org.name}/invite`} class="cn-card p-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div class="flex-1">
                <label for="username" class="mb-1 block text-sm font-medium">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="github-username"
                  class="cn-input-size-default w-full border border-border bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div class="w-full sm:w-36">
                <label for="role" class="mb-1 block text-sm font-medium">Role</label>
                <select
                  id="role"
                  name="role"
                  class="cn-input-size-default w-full border border-border bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  {userRole === "owner" && <option value="owner">Owner</option>}
                </select>
              </div>
              <button
                type="submit"
                class="cn-button-size-default bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Send Invite
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Pending Invitations */}
      {invitations.filter((i) => i.status === "pending").length > 0 && (
        <section>
          <h2 class="mb-4 text-lg font-semibold font-heading">
            Pending Invitations ({invitations.filter((i) => i.status === "pending").length})
          </h2>
          <div class="cn-card divide-y divide-border">
            {invitations.filter((i) => i.status === "pending").map((inv) => (
              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-medium">{inv.invitee}</span>
                  <Badge variant="secondary">{inv.role}</Badge>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-muted-foreground">
                    by {inv.inviter}
                  </span>
                  <form method="post" action={`/org/${org.name}/invitations/${inv.id}/cancel`}>
                    <button
                      type="submit"
                      class="cn-button-size-xs border border-border bg-background px-2 text-xs text-muted-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Members */}
      <section>
        <h2 class="mb-4 text-lg font-semibold font-heading">
          Members ({members.length})
        </h2>
        <div class="cn-card divide-y divide-border">
          {members.map((member) => (
            <div class="flex items-center justify-between p-4">
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium">{member.username}</span>
                <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                  {member.role}
                </Badge>
                {member.visibility === "public" && (
                  <Badge variant="outline">public</Badge>
                )}
              </div>
              <div class="flex items-center gap-2">
                {/* Self: toggle visibility */}
                {member.username === currentUser && (
                  <form method="post" action={`/org/${org.name}/members/${member.username}/visibility`}>
                    <input
                      type="hidden"
                      name="visibility"
                      value={member.visibility === "public" ? "private" : "public"}
                    />
                    <button
                      type="submit"
                      class="cn-button-size-xs border border-border bg-background px-2 text-xs text-muted-foreground hover:bg-muted"
                    >
                      {member.visibility === "public" ? "Make Private" : "Make Public"}
                    </button>
                  </form>
                )}
                {/* Owner/Admin: remove member (not self, not last owner) */}
                {member.username !== currentUser &&
                  (userRole === "owner" || (userRole === "admin" && member.role === "member")) && (
                    <form method="post" action={`/org/${org.name}/members/${member.username}/remove`}>
                      <button
                        type="submit"
                        class="cn-button-size-xs border border-destructive/50 bg-background px-2 text-xs text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </button>
                    </form>
                  )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section class="mt-12 border-t border-destructive/30 pt-8">
        <h2 class="mb-4 text-lg font-semibold font-heading text-destructive">Danger Zone</h2>
        <div class="space-y-4">
          {/* Archive/Unarchive — owner only */}
          {userRole === "owner" && (
            <div class="cn-card flex items-center justify-between border-destructive/30 p-4">
              <div>
                <p class="text-sm font-medium">
                  {org.archived ? "Unarchive this organization" : "Archive this organization"}
                </p>
                <p class="text-xs text-muted-foreground">
                  {org.archived
                    ? "Restore the ability to publish new packages."
                    : "Prevent new packages from being published. Existing packages remain downloadable."}
                </p>
              </div>
              <form method="post" action={`/org/${org.name}/settings/${org.archived ? "unarchive" : "archive"}`}>
                <button
                  type="submit"
                  class="cn-button-size-xs border border-destructive/50 bg-background px-3 text-xs text-destructive hover:bg-destructive/10"
                >
                  {org.archived ? "Unarchive" : "Archive"}
                </button>
              </form>
            </div>
          )}

          {/* Leave — non-owners, or owners when other owners exist */}
          {(userRole !== "owner" || members.filter((m) => m.role === "owner").length > 1) && (
            <div class="cn-card flex items-center justify-between border-destructive/30 p-4">
              <div>
                <p class="text-sm font-medium">Leave this organization</p>
                <p class="text-xs text-muted-foreground">Remove yourself from this organization.</p>
              </div>
              <form method="post" action={`/org/${org.name}/settings/leave`}>
                <button
                  type="submit"
                  class="cn-button-size-xs border border-destructive/50 bg-background px-3 text-xs text-destructive hover:bg-destructive/10"
                >
                  Leave
                </button>
              </form>
            </div>
          )}

          {/* Delete — owner only */}
          {userRole === "owner" && (
            <div class="cn-card border-destructive/30 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">Delete this organization</p>
                  <p class="text-xs text-muted-foreground">Permanently delete this organization. This cannot be undone.</p>
                </div>
              </div>
              <form method="post" action={`/org/${org.name}/settings/delete`} class="mt-3 flex items-center gap-3">
                <input
                  name="confirm"
                  type="text"
                  required
                  placeholder={`Type "${org.name}" to confirm`}
                  class="cn-input-size-default flex-1 border border-destructive/50 bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
                />
                <button
                  type="submit"
                  class="cn-button-size-xs border border-destructive/50 bg-background px-3 text-xs text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  </Container>
);
