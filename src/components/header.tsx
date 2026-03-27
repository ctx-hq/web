import type { FC } from "hono/jsx";
import type { SessionUser } from "../lib/types";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "/search", label: "Search" },
  { href: "/docs", label: "Docs" },
];

function avatarUrl(username: string, size: number = 40): string {
  return `https://source.boringavatars.com/beam/${size}/${encodeURIComponent(username)}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
}

export const Header: FC<{ currentPath?: string; user?: SessionUser | null }> = ({
  currentPath = "",
  user,
}) => (
  <header class="border-b border-border">
    <div class="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 sm:px-6">
      <a href="/" class="text-sm font-semibold font-heading tracking-tight">
        getctx<span class="text-muted-foreground">.org</span>
      </a>

      {/* Desktop nav */}
      <nav class="hidden items-center gap-4 md:flex">
        {NAV_LINKS.map((link) => {
          const isActive =
            currentPath === link.href ||
            (link.href !== "/" && currentPath.startsWith(link.href));
          return (
            <a
              href={link.href}
              class={`text-xs transition-colors ${
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              {...(isActive ? { "aria-current": "page" } : {})}
            >
              {link.label}
            </a>
          );
        })}
        <Button
          variant="ghost"
          size="icon-xs"
          id="theme-toggle"
          aria-label="Toggle dark mode"
        >
          <span class="dark-hidden">
            <Icon name="moon" class="size-4" />
          </span>
          <span class="light-hidden">
            <Icon name="sun" class="size-4" />
          </span>
        </Button>
        {user ? (
          <div class="flex items-center gap-3">
            <a
              href="/dashboard"
              class={`flex items-center gap-2 text-xs transition-colors ${
                currentPath === "/dashboard"
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <img
                src={user.avatar_url || avatarUrl(user.username, 20)}
                alt=""
                class="size-5 rounded-full border border-border bg-muted"
                loading="lazy"
                data-avatar-fallback
              />
              {user.username}
            </a>
            <a
              href="/logout"
              class="text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <Icon name="sign-out" class="size-4" />
            </a>
          </div>
        ) : (
          <Button variant="default" size="sm" href="/login">
            Sign in
          </Button>
        )}
      </nav>

      {/* Mobile nav toggle */}
      <div class="md:hidden">
        <Button
          variant="ghost"
          size="icon-xs"
          id="mobile-nav-toggle"
          aria-label="Open menu"
        >
          <Icon name="list" class="size-4" />
        </Button>
      </div>
    </div>

    {/* Mobile nav drawer */}
    <nav id="mobile-nav" class="hidden border-t border-border px-4 py-3 md:!hidden">
      <div class="flex flex-col gap-3">
        {NAV_LINKS.map((link) => {
          const isActive =
            currentPath === link.href ||
            (link.href !== "/" && currentPath.startsWith(link.href));
          return (
            <a
              href={link.href}
              class={`text-xs ${
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              {...(isActive ? { "aria-current": "page" } : {})}
            >
              {link.label}
            </a>
          );
        })}
        {user ? (
          <>
            <a href="/dashboard" class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
              <img
                src={user.avatar_url || avatarUrl(user.username, 16)}
                alt=""
                class="size-4 rounded-full border border-border bg-muted"
                loading="lazy"
                data-avatar-fallback
              />
              {user.username}
            </a>
            <a href="/logout" class="text-xs text-muted-foreground hover:text-foreground">
              Sign out
            </a>
          </>
        ) : (
          <a href="/login" class="text-xs text-muted-foreground hover:text-foreground">
            Sign in
          </a>
        )}
        <button
          id="theme-toggle-mobile"
          class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <span class="dark-hidden">
            <Icon name="moon" class="size-3.5" />
          </span>
          <span class="light-hidden">
            <Icon name="sun" class="size-3.5" />
          </span>
          <span class="dark-hidden">Dark mode</span>
          <span class="light-hidden">Light mode</span>
        </button>
      </div>
    </nav>
  </header>
);
