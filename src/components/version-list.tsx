import type { FC } from "hono/jsx";
import type { VersionSummary } from "../lib/types";
import { formatDate } from "../lib/format";

export const VersionList: FC<{ versions: VersionSummary[] }> = ({ versions }) => (
  <ul class="space-y-1">
    {versions.map((v) => (
      <li class="flex items-center justify-between text-[11px]">
        <span class={v.yanked ? "line-through text-muted-foreground" : ""}>
          {v.version}
        </span>
        <span class="text-muted-foreground">
          {formatDate(v.created_at)}
        </span>
      </li>
    ))}
  </ul>
);
