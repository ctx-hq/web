import type { FC } from "hono/jsx";
import type { ManifestInfo } from "../lib/types";
import { Icon } from "./ui/icon";

/**
 * Shows an upstream source badge when the package wraps an external package.
 * Example: "Wraps @playwright/mcp on npm"
 */
export const UpstreamBadge: FC<{ upstream: NonNullable<ManifestInfo["upstream"]> }> = ({
  upstream,
}) => {
  const { label, url } = resolveUpstreamDisplay(upstream);
  if (!label) return null;

  return (
    <div class="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label={`Wraps upstream package: ${label}`}>
      <Icon name="info" class="size-3.5 shrink-0" />
      <span>
        Wraps{" "}
        {url ? (
          <a href={url} class="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ) : (
          <strong>{label}</strong>
        )}
      </span>
    </div>
  );
};

/** Resolve display label and link for the upstream source. */
export function resolveUpstreamDisplay(upstream: NonNullable<ManifestInfo["upstream"]>): {
  label: string;
  url: string;
} {
  if (upstream.npm) {
    return {
      label: `${upstream.npm} on npm`,
      url: `https://www.npmjs.com/package/${upstream.npm}`,
    };
  }
  if (upstream.github) {
    return {
      label: `${upstream.github} on GitHub`,
      url: `https://github.com/${upstream.github}`,
    };
  }
  if (upstream.docker) {
    return {
      label: `${upstream.docker} on Docker`,
      url: upstream.docker.startsWith("ghcr.io/")
        ? `https://github.com/${upstream.docker.replace("ghcr.io/", "")}/pkgs/container`
        : "",
    };
  }
  return { label: "", url: "" };
}
