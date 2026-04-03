import { Hono } from "hono";
import { Layout } from "../layout";
import { Container } from "../components/ui/container";
import { api } from "../lib/api-helpers";
import type { AppEnv } from "../lib/api-helpers";
import { ApiError } from "../lib/api-client";
import { defaultMeta } from "../lib/seo";
import { SITE_NAME } from "../lib/constants";
import type { OrgMember, OrgInvitation } from "../lib/types";
import { ProfilePage } from "../pages/profile";
import { OrgPage } from "../pages/org";
import { CreateOrgPage, validateOrgName } from "../pages/create-org";
import { OrgSettingsPage } from "../pages/org-settings";

const route = new Hono<AppEnv>();

route.get("/orgs/new", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.redirect("/login?redirect=/orgs/new");
  }
  const meta = { ...defaultMeta(), title: `Create Organization — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/orgs/new" user={user}>
      <CreateOrgPage />
    </Layout>
  );
});

route.post("/orgs/new", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) {
    return c.redirect("/login?redirect=/orgs/new");
  }

  const body = await c.req.parseBody();
  const name = String(body.name ?? "").trim();
  const displayName = String(body.display_name ?? "").trim() || undefined;

  // Server-side validation
  const nameError = validateOrgName(name);
  if (nameError) {
    const meta = { ...defaultMeta(), title: `Create Organization — ${SITE_NAME}` };
    return c.html(
      <Layout meta={meta} currentPath="/orgs/new" user={user}>
        <CreateOrgPage
          fieldErrors={{ name: nameError }}
          values={{ name, display_name: displayName }}
        />
      </Layout>,
      422,
    );
  }

  try {
    await api(c).createOrg(name, displayName, token);
    return c.redirect(`/org/${encodeURIComponent(name)}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return c.redirect("/login");
    }

    let errorMsg = "Failed to create organization. Please try again.";
    let statusCode: 409 | 422 | 500 = 422;
    if (err instanceof ApiError) {
      const apiMsg = err.body?.message;
      errorMsg = (typeof apiMsg === "string" && apiMsg) || err.message || errorMsg;
      if (err.status === 409) statusCode = 409;
      else if (err.status >= 500) statusCode = 500;
    }

    const meta = { ...defaultMeta(), title: `Create Organization — ${SITE_NAME}` };
    return c.html(
      <Layout meta={meta} currentPath="/orgs/new" user={user}>
        <CreateOrgPage
          error={errorMsg}
          values={{ name, display_name: displayName }}
        />
      </Layout>,
      statusCode,
    );
  }
});

// Org Settings (auth required, owner/admin only)
route.get("/org/:name/settings", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const name = c.req.param("name");
  try {
    // Step 1: Check membership first (no admin-only APIs yet)
    const [org, membersResult] = await Promise.all([
      api(c).getOrg(name),
      api(c).getOrgMembers(name, token),
    ]);

    const currentMember = membersResult.members.find((m: OrgMember) => m.username === user.username);
    if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
      return c.redirect(`/org/${name}`);
    }

    // Step 2: Now safe to fetch admin-only data
    let invitations: OrgInvitation[] = [];
    try {
      const invResult = await api(c).listOrgInvitations(name, token);
      invitations = invResult.invitations;
    } catch {
      // Non-critical — show settings without invitations
    }

    const meta = { ...defaultMeta(), title: `Settings — ${org.display_name || org.name} — ${SITE_NAME}` };
    return c.html(
      <Layout meta={meta} currentPath={`/org/${name}/settings`} user={user}>
        <OrgSettingsPage
          org={org}
          members={membersResult.members}
          invitations={invitations}
          currentUser={user.username}
          userRole={currentMember.role}
          success={c.req.query("success") || undefined}
          error={c.req.query("error") || undefined}
        />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
      return c.redirect(`/org/${name}`);
    }
    throw err;
  }
});

// Org invite form action
route.post("/org/:name/invite", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const name = c.req.param("name");
  const body = await c.req.parseBody();
  const username = String(body.username ?? "").trim();
  const role = String(body.role ?? "member").trim();

  try {
    await api(c).inviteOrgMember(name, username, role, token);
    return c.redirect(`/org/${name}/settings?success=${encodeURIComponent(`Invited ${username}`)}`);
  } catch (err) {
    if (err instanceof ApiError) {
      // Reload settings page with error — fetch members first, invitations separately
      try {
        const [org, membersResult] = await Promise.all([
          api(c).getOrg(name),
          api(c).getOrgMembers(name, token),
        ]);
        const currentMember = membersResult.members.find((m: OrgMember) => m.username === user.username);
        let invitations: OrgInvitation[] = [];
        try {
          const invResult = await api(c).listOrgInvitations(name, token);
          invitations = invResult.invitations;
        } catch { /* non-critical */ }
        const meta = { ...defaultMeta(), title: `Settings — ${org.display_name || org.name} — ${SITE_NAME}` };
        const apiMsg = err.body?.message;
        return c.html(
          <Layout meta={meta} currentPath={`/org/${name}/settings`} user={user}>
            <OrgSettingsPage
              org={org}
              members={membersResult.members}
              invitations={invitations}
              currentUser={user.username}
              userRole={currentMember?.role ?? "member"}
              error={typeof apiMsg === "string" ? apiMsg : err.message}
            />
          </Layout>,
          err.status >= 500 ? 500 : 422,
        );
      } catch {
        return c.redirect(`/org/${name}/settings`);
      }
    }
    throw err;
  }
});

// Cancel invitation form action
route.post("/org/:name/invitations/:id/cancel", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  const invId = c.req.param("id");
  try {
    await api(c).cancelOrgInvitation(name, invId, token);
  } catch {
    // Best-effort, redirect anyway
  }
  return c.redirect(`/org/${name}/settings`);
});

// Toggle member visibility form action
route.post("/org/:name/members/:username/visibility", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const name = c.req.param("name");
  const username = c.req.param("username");

  // Only allow self
  if (username !== user.username) return c.redirect(`/org/${name}/settings`);

  const body = await c.req.parseBody();
  const visibility = String(body.visibility ?? "private");

  try {
    await api(c).updateMemberVisibility(name, user.username, visibility, token);
  } catch {
    // Best-effort
  }
  return c.redirect(`/org/${name}/settings`);
});

// Remove member form action
route.post("/org/:name/members/:username/remove", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  const username = c.req.param("username");

  try {
    await api(c).removeMember(name, username!, token);
    return c.redirect(`/org/${name}/settings?success=${encodeURIComponent(`Removed ${username}`)}`);
  } catch {
    return c.redirect(`/org/${name}/settings`);
  }
});

// Archive org form action
route.post("/org/:name/settings/archive", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  try {
    await api(c).archiveOrg(name, token);
    return c.redirect(`/org/${name}/settings?success=${encodeURIComponent("Organization archived")}`);
  } catch (err) {
    const msg = err instanceof ApiError ? ((err.body?.message as string) || err.message) : "Failed to archive organization";
    return c.redirect(`/org/${name}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Unarchive org form action
route.post("/org/:name/settings/unarchive", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  try {
    await api(c).unarchiveOrg(name, token);
    return c.redirect(`/org/${name}/settings?success=${encodeURIComponent("Organization unarchived")}`);
  } catch (err) {
    const msg = err instanceof ApiError ? ((err.body?.message as string) || err.message) : "Failed to unarchive organization";
    return c.redirect(`/org/${name}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Leave org form action
route.post("/org/:name/settings/leave", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  try {
    await api(c).leaveOrg(name, token);
    return c.redirect("/dashboard?tab=orgs");
  } catch (err) {
    const msg = err instanceof ApiError ? ((err.body?.message as string) || err.message) : "Failed to leave organization";
    return c.redirect(`/org/${name}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Delete org form action
route.post("/org/:name/settings/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  const body = await c.req.parseBody();
  const confirm = String(body.confirm ?? "").trim();

  if (confirm !== name) {
    return c.redirect(`/org/${name}/settings?error=${encodeURIComponent("Confirmation does not match organization name")}`);
  }

  try {
    await api(c).dissolveOrg(name, "delete", confirm, "", token);
    return c.redirect("/dashboard?tab=orgs");
  } catch (err) {
    const msg = err instanceof ApiError ? ((err.body?.message as string) || err.message) : "Failed to delete organization";
    return c.redirect(`/org/${name}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Organization page
route.get("/org/:name", async (c) => {
  const name = c.req.param("name");
  try {
    const [org, pkgResult] = await Promise.all([
      api(c).getOrg(name),
      api(c).getOrgPackages(name, c.get("token")),
    ]);

    // Members: auth users see all members, public users see only public members
    let members: OrgMember[] | null = null;
    let userRole: string | null = null;
    const token = c.get("token");
    const user = c.get("user");
    if (token) {
      try {
        const result = await api(c).getOrgMembers(name, token);
        members = result.members;
        if (user) {
          const currentMember = members?.find((m: OrgMember) => m.username === user.username);
          userRole = currentMember?.role ?? null;
        }
      } catch {
        // Not a member — fall through to public members
      }
    }
    if (!members) {
      try {
        const result = await api(c).getPublicMembers(name);
        members = result.members;
      } catch {
        // leave as null
      }
    }

    const meta = { ...defaultMeta(), title: `${org.display_name || org.name} — ${SITE_NAME}` };
    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return c.html(
      <Layout meta={meta} currentPath={`/org/${name}`} user={user}>
        <OrgPage org={org} members={members} packages={pkgResult.packages} userRole={userRole} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <Container class="py-16 text-center">
            <h1 class="mb-2 text-xl font-semibold font-heading">Organization not found</h1>
            <p class="text-sm text-muted-foreground">{name} does not exist.</p>
          </Container>
        </Layout>,
        404
      );
    }
    throw err;
  }
});

// Profile page — vanity URL: /@slug
// Uses regex constraint to match paths starting with @ (e.g., /@biao29)
route.get("/:slug{@[^/]+}", async (c) => {
  const slug = c.req.param("slug")!.replace(/^@/, "");
  try {
    const [profile, pkgResult] = await Promise.all([
      api(c).getProfile(slug),
      api(c).getProfilePackages(slug, { limit: 50 }, c.get("token")),
    ]);
    const meta = { ...defaultMeta(), title: `@${slug} — ${SITE_NAME}` };
    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return c.html(
      <Layout meta={meta} currentPath={`/@${slug}`} user={c.get("user")}>
        <ProfilePage profile={profile} packages={pkgResult.packages} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <Container class="py-16 text-center">
            <h1 class="mb-2 text-xl font-semibold font-heading">User not found</h1>
            <p class="text-sm text-muted-foreground">@{slug} does not exist.</p>
          </Container>
        </Layout>,
        404
      );
    }
    throw err;
  }
});

export default route;
