import type { FC } from "hono/jsx";

export const PublisherLink: FC<{ slug?: string | null }> = ({ slug }) => {
  if (!slug) return null;

  return (
    <a
      href={`/publisher/${encodeURIComponent(slug)}`}
      class="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
    >
      @{slug}
    </a>
  );
};
