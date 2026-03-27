import type { FC, PropsWithChildren } from "hono/jsx";

export const Card: FC<PropsWithChildren<{ class?: string }>> = ({
  class: className,
  children,
}) => (
  <div class={`cn-card${className ? ` ${className}` : ""}`}>{children}</div>
);

export const CardHeader: FC<PropsWithChildren<{ class?: string }>> = ({
  class: className,
  children,
}) => (
  <div class={`cn-card-header${className ? ` ${className}` : ""}`}>
    {children}
  </div>
);

export const CardContent: FC<PropsWithChildren<{ class?: string }>> = ({
  class: className,
  children,
}) => (
  <div class={`cn-card-content${className ? ` ${className}` : ""}`}>
    {children}
  </div>
);

export const CardFooter: FC<PropsWithChildren<{ class?: string }>> = ({
  class: className,
  children,
}) => (
  <div class={`cn-card-footer${className ? ` ${className}` : ""}`}>
    {children}
  </div>
);
