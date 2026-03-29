import type { FC } from "hono/jsx";
import type { SyncProfileMeta } from "../lib/types";
import { formatDate } from "../lib/format";

export const SyncPanel: FC<{ meta: SyncProfileMeta | null }> = ({ meta }) => {
  if (!meta) {
    return (
      <div class="cn-card p-6 text-center">
        <p class="text-xs text-muted-foreground">No sync profile found.</p>
        <p class="mt-2">
          <code class="bg-muted px-2 py-1 font-mono text-xs">ctx sync push</code>
        </p>
      </div>
    );
  }

  return (
    <div class="cn-card p-4">
      <h3 class="mb-3 text-xs font-semibold font-heading">Sync Status</h3>
      <dl class="space-y-2 text-xs">
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">Packages</dt>
          <dd class="font-medium">{meta.package_count}</dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">Syncable</dt>
          <dd class="font-medium">{meta.syncable_count}</dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">Unsyncable</dt>
          <dd class="font-medium">{meta.unsyncable_count}</dd>
        </div>
        {meta.last_push_at && (
          <div class="flex items-center justify-between">
            <dt class="text-muted-foreground">Last push</dt>
            <dd class="font-medium">
              {formatDate(meta.last_push_at)}
              {meta.last_push_device && (
                <span class="ml-1 text-muted-foreground">({meta.last_push_device})</span>
              )}
            </dd>
          </div>
        )}
        {meta.last_pull_at && (
          <div class="flex items-center justify-between">
            <dt class="text-muted-foreground">Last pull</dt>
            <dd class="font-medium">
              {formatDate(meta.last_pull_at)}
              {meta.last_pull_device && (
                <span class="ml-1 text-muted-foreground">({meta.last_pull_device})</span>
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
};
