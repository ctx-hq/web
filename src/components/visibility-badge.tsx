import type { FC } from "hono/jsx";
import type { Visibility } from "../lib/types";
import { VISIBILITY_CONFIG } from "../lib/constants";

const VisibilityIcon: FC<{ visibility: string }> = ({ visibility }) => {
  const svgProps = { width: "12", height: "12", viewBox: "0 0 256 256", fill: "currentColor" };

  switch (visibility) {
    case "private":
      return (
        <svg {...svgProps}>
          <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Z" />
        </svg>
      );
    case "unlisted":
      return (
        <svg {...svgProps}>
          <path d="M165.66,90.34a8,8,0,0,1,0,11.32l-64,64a8,8,0,0,1-11.32-11.32l64-64A8,8,0,0,1,165.66,90.34ZM215.6,40.4a56,56,0,0,0-79.2,0L106.34,70.45a8,8,0,0,0,11.32,11.32l30.06-30a40,40,0,0,1,56.57,56.56l-30.07,30.06a8,8,0,0,0,11.31,11.32L215.6,119.6a56,56,0,0,0,0-79.2ZM138.34,174.22l-30.06,30.06a40,40,0,1,1-56.56-56.57l30.05-30.05a8,8,0,0,0-11.32-11.32L40.4,136.4a56,56,0,0,0,79.2,79.2l30.06-30.07a8,8,0,0,0-11.32-11.31Z" />
        </svg>
      );
    default:
      return null;
  }
};

export const VisibilityBadge: FC<{ visibility?: Visibility | null }> = ({ visibility }) => {
  if (!visibility || visibility === "public") return null;
  const config = VISIBILITY_CONFIG[visibility];
  if (!config) return null;

  return (
    <span
      class="inline-flex items-center gap-0.5 border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
      aria-label={`Visibility: ${config.label}`}
    >
      <VisibilityIcon visibility={visibility} />
      {config.label}
    </span>
  );
};
