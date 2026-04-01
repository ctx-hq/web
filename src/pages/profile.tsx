import type { FC } from "hono/jsx";
import type { Profile, PackageSummary } from "../lib/types";
import { formatDownloads } from "../lib/format";
import { avatarUrl } from "../lib/avatar";
import { Container } from "../components/ui/container";
import { Badge } from "../components/badge";
import { Icon } from "../components/ui/icon";
import { PackageCard } from "../components/package-card";

function safeWebsiteDisplay(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

export const ProfilePage: FC<{
  profile: Profile;
  packages: PackageSummary[];
}> = ({ profile, packages }) => {
  const imgSrc = profile.avatar_url || avatarUrl(profile.slug, 64);
  const collections = packages.filter((p) => p.type === "collection");
  const nonCollections = packages.filter((p) => p.type !== "collection");

  return (
    <Container class="py-10">
      {/* Profile header */}
      <div class="mb-8 flex items-start gap-5">
        <img
          src={imgSrc}
          alt={`@${profile.slug}`}
          class="size-16 shrink-0"
          loading="lazy"
        />
        <div class="min-w-0">
          <div class="mb-1 flex flex-wrap items-center gap-2">
            <h1 class="text-xl font-semibold font-heading">@{profile.slug}</h1>
            {profile.kind === "org" && (
              <Badge variant="secondary">org</Badge>
            )}
          </div>

          {profile.bio && (
            <p class="mb-2 text-sm text-muted-foreground">{profile.bio}</p>
          )}

          <div class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Icon name="external-link" class="size-3" />
                {safeWebsiteDisplay(profile.website)}
              </a>
            )}
            <span class="inline-flex items-center gap-1">
              <Icon name="package" class="size-3" />
              {profile.packages} {profile.packages === 1 ? "package" : "packages"}
            </span>
            <span class="inline-flex items-center gap-1">
              <Icon name="download" class="size-3" />
              {formatDownloads(profile.total_downloads ?? 0)} downloads
            </span>
          </div>
        </div>
      </div>

      {/* Collections section (if any) */}
      {collections.length > 0 && (
        <section class="mb-8" aria-label="Collections">
          <h2 class="mb-3 text-sm font-semibold font-heading text-muted-foreground uppercase tracking-wider">
            Collections
          </h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <a
                href={`/package/${col.full_name}`}
                class="cn-card block p-4 transition-all hover:ring-1 hover:ring-foreground/25"
              >
                <div class="mb-1 flex items-center justify-between gap-1">
                  <span class="min-w-0 truncate text-sm font-medium font-heading">
                    {col.full_name}
                  </span>
                  <Badge variant="secondary">collection</Badge>
                </div>
                <p class="line-clamp-2 text-xs text-muted-foreground">{col.description}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* All packages */}
      <section aria-label="Packages">
        {collections.length > 0 && (
          <h2 class="mb-3 text-sm font-semibold font-heading text-muted-foreground uppercase tracking-wider">
            All Packages
          </h2>
        )}
        {nonCollections.length === 0 && collections.length === 0 ? (
          <div class="cn-card p-6 text-center">
            <p class="text-sm text-muted-foreground">No packages published yet.</p>
          </div>
        ) : (
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {nonCollections.map((pkg) => (
              <PackageCard key={pkg.full_name} pkg={pkg} />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
};
