import type { FC } from "hono/jsx";
import type { TrustTier } from "../lib/types";
import { TRUST_TIERS } from "../lib/constants";

export const TrustBadge: FC<{ tier?: TrustTier | null }> = ({ tier }) => {
  if (!tier || tier === "unverified") return null;
  const config = TRUST_TIERS[tier];
  if (!config) return null;

  return (
    <span
      class={`inline-flex items-center gap-0.5 text-xs font-medium ${config.color}`}
      aria-label={`Trust: ${config.label}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};
