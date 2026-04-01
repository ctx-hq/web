import type { FC } from "hono/jsx";
import { avatarUrl } from "../lib/avatar";

export const PublisherLink: FC<{
  slug?: string | null;
  avatar?: string | null;
}> = ({ slug, avatar }) => {
  if (!slug) return null;

  const imgSrc = avatar || avatarUrl(slug);

  return (
    <a
      href={`/@${encodeURIComponent(slug)}`}
      class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <img
        src={imgSrc}
        alt=""
        class="size-5"
        loading="lazy"
      />
      @{slug}
    </a>
  );
};
