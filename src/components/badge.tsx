import type { FC } from "hono/jsx";
import type { PackageType } from "../lib/types";

const typeStyles: Record<PackageType, string> = {
  skill: "bg-type-skill-bg text-type-skill border-type-skill/20",
  mcp: "bg-type-mcp-bg text-type-mcp border-type-mcp/20",
  cli: "bg-type-cli-bg text-type-cli border-type-cli/20",
};

export const Badge: FC<{ type: PackageType }> = ({ type }) => (
  <span class={`cn-badge ${typeStyles[type] ?? ""}`}>{type}</span>
);
