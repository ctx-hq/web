// Install script proxy — serves scripts from GitHub raw with edge caching
// SSOT: scripts live in ctx/scripts/ (Git), this route is a transparent proxy
export const INSTALL_SCRIPTS: Record<string, string> = {
  "install.sh": "https://raw.githubusercontent.com/ctx-hq/ctx/main/scripts/install.sh",
  "install.ps1": "https://raw.githubusercontent.com/ctx-hq/ctx/main/scripts/install.ps1",
};

export async function proxyInstallScript(
  c: { header: (k: string, v: string) => void; body: (b: string, status?: number) => Response },
  filename: string,
): Promise<Response> {
  const url = INSTALL_SCRIPTS[filename];
  if (!url) {
    return c.body("Not found", 404);
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "getctx.org/install-proxy" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      c.header("Content-Type", "text/plain; charset=utf-8");
      return c.body(
        `# Failed to fetch install script (upstream returned ${upstream.status}).\n` +
        `# Try the direct URL instead:\n` +
        `#   ${url}\n`,
        502,
      );
    }

    const body = await upstream.text();

    c.header("Content-Type", "text/plain; charset=utf-8");
    c.header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Robots-Tag", "noindex, nofollow");
    return c.body(body);
  } catch {
    c.header("Content-Type", "text/plain; charset=utf-8");
    return c.body(
      `# Install script temporarily unavailable.\n` +
      `# Try the direct URL instead:\n` +
      `#   ${url}\n`,
      502,
    );
  }
}
