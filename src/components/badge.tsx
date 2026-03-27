import type { FC } from "hono/jsx";
import type { PackageType } from "../lib/types";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | `type-${PackageType}`;

export const Badge: FC<{
  variant?: BadgeVariant;
  active?: boolean;
  class?: string;
  href?: string;
  children?: unknown;
  /** Shorthand: sets variant to `type-${type}` */
  type?: PackageType;
}> = ({ variant, active, class: className, href, children, type }) => {
  const resolvedVariant = variant ?? (type ? `type-${type}` : "default");
  const classes = [
    "cn-badge",
    `cn-badge-variant-${resolvedVariant}`,
    active ? "cn-badge-active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = children ?? type;

  if (href) {
    return (
      <a href={href} class={classes}>
        {content}
      </a>
    );
  }

  return <span class={classes}>{content}</span>;
};
