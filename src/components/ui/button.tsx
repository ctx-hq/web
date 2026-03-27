import type { FC, PropsWithChildren } from "hono/jsx";

type ButtonVariant = "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
type ButtonSize = "xs" | "sm" | "default" | "lg" | "icon-xs" | "icon-sm" | "icon";

export const Button: FC<
  PropsWithChildren<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
    href?: string;
    type?: "submit" | "reset" | "button";
    id?: string;
    disabled?: boolean;
    "aria-label"?: string;
    "aria-disabled"?: boolean | string;
    "data-copy"?: string;
    "data-tab"?: string;
  }>
> = ({
  variant = "default",
  size = "default",
  class: className,
  href,
  children,
  ...props
}) => {
  const classes = [
    "cn-button",
    `cn-button-variant-${variant}`,
    `cn-button-size-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <a href={href} class={classes}>
        {children}
      </a>
    );
  }

  return (
    <button
      class={classes}
      {...props}
      {...(props.disabled ? { "aria-disabled": "true" } : {})}
    >
      {children}
    </button>
  );
};
