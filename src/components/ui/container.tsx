import type { FC, PropsWithChildren } from "hono/jsx";

const sizeClasses = {
  default: "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8",
  narrow: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8",
} as const;

export type ContainerSize = keyof typeof sizeClasses;

export const Container: FC<
  PropsWithChildren<{ size?: ContainerSize; class?: string }>
> = ({ size = "default", class: className, children }) => (
  <div class={`${sizeClasses[size]}${className ? ` ${className}` : ""}`}>
    {children}
  </div>
);
