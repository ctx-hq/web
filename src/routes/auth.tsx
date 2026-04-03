import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { Layout } from "../layout";
import { api, isSafeRedirect } from "../lib/api-helpers";
import type { AppEnv } from "../lib/api-helpers";
import { defaultMeta } from "../lib/seo";
import { SITE_NAME } from "../lib/constants";
import { LoginPage } from "../pages/login";
import { DeviceLoginPage } from "../pages/device-login";

const route = new Hono<AppEnv>();

// Login — redirect to dashboard if already signed in
route.get("/login", async (c) => {
  const redirect = c.req.query("redirect");
  if (c.get("user")) {
    return c.redirect(isSafeRedirect(redirect) ? redirect! : "/dashboard");
  }
  const state = crypto.randomUUID();
  setCookie(c, "__Host-oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });
  // Store redirect destination for post-login
  if (isSafeRedirect(redirect)) {
    setCookie(c, "__Host-oauth_redirect", redirect!, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 600,
    });
  }
  const meta = { ...defaultMeta(), title: `Sign in — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/login" user={c.get("user")}>
      <LoginPage githubClientId={c.env.GITHUB_CLIENT_ID} oauthState={state} />
    </Layout>
  );
});

// OAuth callback — forward code to API (SSOT: API owns GitHub exchange)
route.get("/login/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  /** Clean up transient OAuth cookies on every exit path. */
  const clearOAuthCookies = () => {
    deleteCookie(c, "__Host-oauth_state", { path: "/", secure: true });
    deleteCookie(c, "__Host-oauth_redirect", { path: "/", secure: true });
  };

  if (!code || !state) {
    clearOAuthCookies();
    return c.redirect("/login");
  }

  // Verify state matches cookie
  const savedState = getCookie(c, "__Host-oauth_state");
  if (!savedState || savedState !== state) {
    clearOAuthCookies();
    return c.redirect("/login");
  }

  try {
    // Forward code to API — API handles GitHub token exchange, user upsert, session creation
    const apiBase = c.env.API_BASE_URL;
    const registerResp = await fetch(`${apiBase}/v1/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const session = await registerResp.json() as { token?: string; error?: string };
    if (!session.token) {
      clearOAuthCookies();
      return c.redirect("/login");
    }

    // Set session cookie
    setCookie(c, "__Host-ctx_session", session.token, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 2592000,
    });

    // Honor redirect destination from login flow, then clean up
    const redirect = getCookie(c, "__Host-oauth_redirect") as string | undefined;
    clearOAuthCookies();

    return c.redirect(isSafeRedirect(redirect) ? redirect : "/dashboard");
  } catch {
    clearOAuthCookies();
    return c.redirect("/login");
  }
});

// Logout — clear session cookie and redirect
route.get("/logout", (c) => {
  deleteCookie(c, "__Host-ctx_session", { path: "/", secure: true });
  return c.redirect("/");
});

// Device login — authorize a CLI device code
route.get("/login/device", async (c) => {
  const code = c.req.query("code") ?? "";

  if (!c.get("user")) {
    const redirectPath = code
      ? `/login/device?code=${encodeURIComponent(code)}`
      : "/login/device";
    return c.redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  const meta = { ...defaultMeta(), title: `Authorize Device — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/login/device" user={c.get("user")}>
      <DeviceLoginPage code={code} />
    </Layout>
  );
});

// Device authorize proxy — forwards to API (avoids CORS / exposing API_BASE_URL).
// Starts with /api/ so auth middleware skips it; reads cookie directly.
route.post("/api/device/authorize", async (c) => {
  const token = getCookie(c, "__Host-ctx_session") as string | undefined;
  if (!token) {
    return c.json({ error: "unauthorized", message: "Not signed in" }, 401);
  }

  let body: { user_code?: string };
  try {
    body = await c.req.json<{ user_code?: string }>();
  } catch {
    return c.json({ error: "bad_request", message: "Invalid request body" }, 400);
  }

  try {
    const apiBase = c.env.API_BASE_URL;
    const resp = await fetch(`${apiBase}/v1/auth/device/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_code: body.user_code }),
    });

    const data = await resp.json();
    return c.json(data, resp.status as any);
  } catch {
    return c.json({ error: "server_error", message: "Unable to reach authorization service" }, 502);
  }
});

export default route;
