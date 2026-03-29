import type { FC } from "hono/jsx";
import type { Visibility } from "../lib/types";
import { VISIBILITY_CONFIG } from "../lib/constants";

export const VisibilityBadge: FC<{ visibility?: Visibility | null }> = ({ visibility }) => {
  if (!visibility || visibility === "public") return null;
  const config = VISIBILITY_CONFIG[visibility];
  if (!config) return null;

  return (
    <span
      class="inline-flex items-center gap-0.5 border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
      aria-label={`Visibility: ${config.label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
};
