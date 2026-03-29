import type { FC } from "hono/jsx";

export const DistTagList: FC<{ tags?: Record<string, string> | null }> = ({ tags }) => {
  if (!tags) return null;
  const entries = Object.entries(tags);
  if (entries.length === 0) return null;

  return (
    <div class="flex flex-wrap gap-1.5" aria-label="Distribution tags">
      {entries.map(([tag, version]) => (
        <span
          class="inline-flex items-center gap-1 rounded-none border border-border bg-muted/50 px-1.5 py-0.5 text-xs font-mono"
        >
          <span class="text-muted-foreground">{tag}</span>
          <span class="text-muted-foreground/60">&rarr;</span>
          <span class="font-medium">{version}</span>
        </span>
      ))}
    </div>
  );
};
