import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { Layout } from "../layout";
import { api } from "../lib/api-helpers";
import type { AppEnv } from "../lib/api-helpers";
import { defaultMeta } from "../lib/seo";
import { SITE_NAME } from "../lib/constants";
import type { PackageSummary, OrgInfo, OrgInvitation, SyncProfileMeta, StarredPackage } from "../lib/types";
import { DashboardPage } from "../pages/dashboard";
import { SettingsPage } from "../pages/settings";
import type { SettingsTab } from "../pages/settings";

const route = new Hono<AppEnv>();

// --- Settings Hub ---

route.get("/settings/tokens", (c) => {
  const qs = c.req.query("error") || c.req.query("success") ? `&${new URL(c.req.url).searchParams}` : "";
  return c.redirect(`/settings?tab=tokens${qs}`);
});

route.get("/settings", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  const settingsPath = new URL(c.req.url).pathname + new URL(c.req.url).search;
  if (!user || !token) return c.redirect(`/login?redirect=${encodeURIComponent(settingsPath)}`);

  const tab = (c.req.query("tab") || "profile") as SettingsTab;
  const validTabs: SettingsTab[] = ["profile", "tokens", "account"];
  const activeTab = validTabs.includes(tab) ? tab : "profile";

  let error = c.req.query("error") || undefined;
  const success = c.req.query("success") || undefined;
  let profile: import("../lib/types").Profile | undefined;
  let tokens: import("../lib/types").TokenInfo[] = [];
  let newToken: string | undefined;

  if (activeTab === "profile") {
    try {
      profile = await api(c).getProfile(user.username);
    } catch {
      // Profile may not exist yet — show empty form
    }
  } else if (activeTab === "tokens") {
    try {
      const result = await api(c).listTokens(token);
      tokens = result.tokens;
    } catch (err) {
      error = "Failed to load tokens";
      console.error("Token list error:", err);
    }
    // Read newly created token from ephemeral cookie
    newToken = getCookie(c, "__Host-new_token") as string | undefined;
    if (newToken) {
      deleteCookie(c, "__Host-new_token", { path: "/", secure: true, httpOnly: true, sameSite: "Strict" });
    }
  }

  const meta = { ...defaultMeta(), title: `Settings — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/settings" user={user}>
      <SettingsPage
        user={user}
        tab={activeTab}
        profile={profile}
        tokens={tokens}
        newToken={newToken}
        error={error}
        success={success}
      />
    </Layout>
  );
});

route.post("/settings/profile/update", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const body = await c.req.parseBody();
  const bio = (body.bio as string)?.trim() ?? "";
  const website = (body.website as string)?.trim() ?? "";

  try {
    await api(c).updateProfile({ bio, website }, token);
    return c.redirect(`/settings?tab=profile&success=${encodeURIComponent("Profile updated")}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return c.redirect(`/settings?tab=profile&error=${encodeURIComponent(message)}`);
  }
});

route.post("/settings/account/rename", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const body = await c.req.parseBody();
  const newUsername = (body.new_username as string)?.trim();
  const confirm = (body.confirm as string)?.trim();

  if (!newUsername || !confirm) {
    return c.redirect("/settings?tab=account&error=All+fields+are+required");
  }

  try {
    await api(c).renameUser(newUsername, confirm, token);
    return c.redirect(`/settings?tab=account&success=${encodeURIComponent("Username updated successfully")}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to rename account";
    return c.redirect(`/settings?tab=account&error=${encodeURIComponent(message)}`);
  }
});

route.post("/settings/account/delete", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const deleteBody = await c.req.parseBody();
  const deleteConfirm = (deleteBody.confirm as string)?.trim();
  if (!deleteConfirm || deleteConfirm !== user.username) {
    return c.redirect("/settings?tab=account&error=Confirmation+does+not+match+your+username");
  }

  try {
    await api(c).deleteAccount(token);
    // Clear session and redirect to home
    deleteCookie(c, "__Host-ctx_session", { path: "/", secure: true, httpOnly: true, sameSite: "Strict" });
    return c.redirect("/");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete account";
    return c.redirect(`/settings?tab=account&error=${encodeURIComponent(message)}`);
  }
});

route.post("/settings/tokens/create", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const body = await c.req.parseBody();
  const name = (body.name as string)?.trim();
  if (!name) return c.redirect("/settings?tab=tokens&error=Token+name+is+required");

  const expiresInDays = body.expires_in_days ? parseInt(body.expires_in_days as string) : undefined;

  // Collect endpoint scopes from checkboxes
  const rawScopes = body.endpoint_scopes;
  const endpointScopes = rawScopes
    ? (Array.isArray(rawScopes) ? rawScopes as string[] : [rawScopes as string])
    : undefined;

  // Parse package scopes from comma-separated input
  const packageScopesRaw = (body.package_scopes as string)?.trim();
  const packageScopes = packageScopesRaw
    ? packageScopesRaw.split(",").map((s: string) => s.trim()).filter(Boolean)
    : undefined;

  const tokenType = (body.token_type as string) || undefined;

  try {
    const result = await api(c).createToken({
      name,
      expires_in_days: expiresInDays,
      endpoint_scopes: endpointScopes,
      package_scopes: packageScopes,
      token_type: tokenType,
    }, token);

    // Pass token via ephemeral cookie to avoid exposing it in URL/history/logs
    setCookie(c, "__Host-new_token", result.token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 60,
    });
    return c.redirect("/settings?tab=tokens");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create token";
    return c.redirect(`/settings?tab=tokens&error=${encodeURIComponent(message)}`);
  }
});

route.post("/settings/tokens/:id/revoke", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const tokenId = c.req.param("id");
  try {
    await api(c).revokeToken(tokenId, token);
    return c.redirect(`/settings?tab=tokens&success=${encodeURIComponent("Token revoked")}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to revoke token";
    return c.redirect(`/settings?tab=tokens&error=${encodeURIComponent(message)}`);
  }
});

// Dashboard (auth required)
route.get("/dashboard", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) {
    return c.redirect("/login");
  }

  const rawTab = c.req.query("tab");
  const activeTab = rawTab && ["packages", "stars", "orgs", "notifications", "claims", "sync"].includes(rawTab) ? rawTab : "packages";

  // Fetch the user's published packages via profile API
  let packages: PackageSummary[] = [];
  try {
    const pkgResult = await api(c).getProfilePackages(user.username, { limit: 50 }, token);
    packages = pkgResult.packages;
  } catch {
    // Non-critical — show dashboard with empty list
  }

  // Fetch orgs and invitations if on orgs tab
  let orgs: OrgInfo[] = [];
  let invitations: OrgInvitation[] = [];
  if (activeTab === "orgs") {
    try {
      const [orgResult, invResult] = await Promise.all([
        api(c).getMyOrgs(token),
        api(c).listMyInvitations(token),
      ]);
      orgs = orgResult.orgs;
      invitations = invResult.invitations;
    } catch {
      // Non-critical
    }
  }

  // Fetch notifications and transfers
  let notifications: any[] = [];
  let transfers: any[] = [];
  let notificationCount = 0;
  if (activeTab === "notifications") {
    try {
      const [notifResult, xferResult] = await Promise.all([
        api(c).listNotifications(token),
        api(c).listMyTransfers(token),
      ]);
      notifications = notifResult.notifications ?? notifResult;
      transfers = xferResult.transfers ?? xferResult;
    } catch {
      // Non-critical
    }
  }
  // Always fetch count for badge
  try {
    const countResult = await api(c).getNotificationCount(token);
    notificationCount = countResult.unread ?? countResult ?? 0;
  } catch {
    // Non-critical
  }

  // Fetch starred packages and star lists if on stars tab
  let stars: StarredPackage[] = [];
  let starLists: import("../lib/types").StarList[] = [];
  const activeListId = c.req.query("list") || undefined;
  if (activeTab === "stars") {
    try {
      const [starResult, listResult] = await Promise.all([
        api(c).listMyStars(token, activeListId),
        api(c).listStarLists(token),
      ]);
      stars = starResult.stars ?? [];
      starLists = listResult.lists ?? [];
    } catch {
      // Non-critical
    }
  }

  // Fetch claimable packages and claims if on claims tab
  let claimablePackages: import("../lib/types").ClaimablePackage[] = [];
  let claimsList: import("../lib/types").Claim[] = [];
  if (activeTab === "claims") {
    try {
      const [claimableResult, claimsResult] = await Promise.all([
        api(c).listClaimable(token),
        api(c).listClaims(token),
      ]);
      claimablePackages = claimableResult.packages ?? [];
      claimsList = claimsResult.claims ?? [];
    } catch {
      // Non-critical
    }
  }

  // Fetch sync profile if on sync tab
  let syncMeta: SyncProfileMeta | null = null;
  if (activeTab === "sync") {
    try {
      const result = await api(c).getSyncProfile(token);
      syncMeta = result.meta;
    } catch {
      // Non-critical
    }
  }

  const meta = { ...defaultMeta(), title: `Dashboard — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/dashboard" user={user} notificationCount={notificationCount}>
      <DashboardPage
        username={user.username}
        packages={packages}
        stars={stars}
        starLists={starLists}
        orgs={orgs}
        invitations={invitations}
        transfers={transfers}
        notifications={notifications}
        notificationCount={notificationCount}
        claimablePackages={claimablePackages}
        claims={claimsList}
        syncMeta={syncMeta}
        activeTab={activeTab}
        activeListId={activeListId}
      />
    </Layout>
  );
});

// Accept/decline invitation form actions (from dashboard)
route.post("/invitations/:id/accept", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).acceptInvitation(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=orgs");
});

route.post("/invitations/:id/decline", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).declineInvitation(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=orgs");
});

// Transfer accept/decline form actions (from dashboard notifications tab)
route.post("/transfers/:id/accept", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).acceptTransfer(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=notifications");
});

route.post("/transfers/:id/decline", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).declineTransfer(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=notifications");
});

// Mark notification as read (from dashboard)
route.post("/notifications/:id/read", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).markNotificationRead(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=notifications");
});

// Mark all notifications as read
route.post("/notifications/mark-all-read", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  try {
    await api(c).markAllNotificationsRead(token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=notifications");
});

// Dismiss notification
route.post("/notifications/:id/dismiss", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).dismissNotification(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=notifications");
});

// Star lists CRUD
route.post("/stars/lists/create", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const body = await c.req.parseBody();
  const name = (body.name as string)?.trim();
  if (!name) return c.redirect("/dashboard?tab=stars");
  try {
    await api(c).createStarList({ name }, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=stars");
});

route.post("/stars/lists/:id/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).deleteStarList(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=stars");
});

// Claims
route.post("/claims", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const body = await c.req.parseBody();
  const packageId = body.package_id as string;
  if (!packageId) return c.redirect("/dashboard?tab=claims");
  try {
    await api(c).claimPackage(packageId, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=claims");
});

export default route;
