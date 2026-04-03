import { Hono } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";
import { Layout } from "./layout";
import { Container } from "./components/ui/container";
import { defaultMeta } from "./lib/seo";
import { SITE_NAME, SITE_URL } from "./lib/constants";
import type { AppEnv } from "./lib/api-helpers";
import type { SessionUser } from "./lib/types";

import homeRoute from "./routes/home";
import searchRoute from "./routes/search";
import packageRoute from "./routes/package";
import authRoute from "./routes/auth";
import dashboardRoute from "./routes/dashboard";
import docsRoute from "./routes/docs";
import orgsRoute from "./routes/orgs";
import staticRoute from "./routes/static";
import apiRoute from "./routes/api";

const app = new Hono<AppEnv>();

// ── CSRF protection — verify Origin/Referer on POST requests ────────────────
app.use("*", async (c, next) => {
  if (c.req.method === "POST") {
    const origin = c.req.header("Origin") || c.req.header("Referer");
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const siteUrl = new URL(SITE_URL);
        if (originUrl.host !== siteUrl.host) {
          return c.text("Forbidden: cross-origin POST", 403);
        }
      } catch {
        return c.text("Forbidden: invalid origin", 403);
      }
    }
    // If no Origin/Referer header, browsers always send Origin on POST forms.
    // Missing headers could indicate a non-browser client — allow for API compat.
  }
  await next();
});

// ── Security headers middleware ──────────────────────────────────────────────
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );
});

// ── Auth middleware — resolve session once for all HTML routes (SSOT) ────────
app.use("*", async (c, next) => {
  const path = c.req.path;
  // Skip non-HTML routes that don't render Layout
  if (
    path.startsWith("/api/") ||
    path === "/sitemap.xml" ||
    path === "/robots.txt" ||
    path === "/skill.md" ||
    path.startsWith("/install.")
  ) {
    c.set("user", null);
    c.set("token", null);
    return next();
  }

  // No session cookie → skip the API call entirely
  const cookie = getCookie(c, "__Host-ctx_session");
  if (!cookie) {
    c.set("user", null);
    c.set("token", null);
    return next();
  }

  // Cookie exists — always set Vary so CDN never conflates anon/auth variants,
  // even if resolveUser fails (timeout, 5xx).
  c.header("Vary", "Cookie");

  const session = await resolveUser(c, cookie);
  c.set("user", session?.user ?? null);
  c.set("token", session?.token ?? null);

  await next();

  // Authenticated response: override any route-level public cache header
  // to prevent CDN from serving personalized content to other users.
  if (session) {
    c.header("Cache-Control", "private, no-store");
  }
});

/** Resolve session user from token. Returns null on invalid/expired session. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveUser(c: any, token: string): Promise<{ user: SessionUser; token: string } | null> {
  try {
    const apiBase: string = c.env.API_BASE_URL;
    const resp = await fetch(`${apiBase}/v1/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(3_000),
    });
    if (resp.ok) {
      const data = (await resp.json()) as SessionUser;
      return { user: data, token };
    }
    // Expired/revoked session — clear stale cookie to avoid repeated /v1/me calls
    if (resp.status === 401 || resp.status === 403) {
      deleteCookie(c, "__Host-ctx_session", { path: "/", secure: true });
    }
  } catch {
    // Network error or timeout — treat as logged out but keep cookie for retry
  }
  return null;
}

// ── Mount route modules ─────────────────────────────────────────────────────
// Order matters: more specific routes first, catch-all profile route (in orgs) last.
app.route("/", homeRoute);
app.route("/", searchRoute);
app.route("/", packageRoute);
app.route("/", authRoute);
app.route("/", dashboardRoute);
app.route("/", docsRoute);
app.route("/", staticRoute);
app.route("/", apiRoute);
app.route("/", orgsRoute); // Must be last — contains /:slug{@[^/]+} catch-all

// ── Error handler ───────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error("Unhandled error:", err instanceof Error ? err.message : "unknown");
  return c.html(
    <Layout meta={{ ...defaultMeta(), title: `Error — ${SITE_NAME}` }} user={c.get("user") ?? null}>
      <Container class="py-16 text-center">
        <h1 class="mb-2 text-xl font-semibold font-heading">Something went wrong</h1>
        <p class="text-sm text-muted-foreground">Please try again later.</p>
      </Container>
    </Layout>,
    500
  );
});

export default app;
