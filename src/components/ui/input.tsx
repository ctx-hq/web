import type { FC } from "hono/jsx";

type InputSize = "default" | "lg";

export const Input: FC<{
  name?: string;
  value?: string;
  placeholder?: string;
  size?: InputSize;
  class?: string;
  id?: string;
  type?: string;
  autocomplete?: string;
  autofocus?: boolean;
  "aria-label"?: string;
}> = ({ size = "default", class: className, ...props }) => {
  const classes = [
    "cn-input",
    `cn-input-size-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <input class={classes} {...props} />;
};
