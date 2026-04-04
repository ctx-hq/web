import type { FC } from "hono/jsx";
import type { KeywordInfo } from "../lib/types";
import { Container } from "../components/ui/container";
import { Badge } from "../components/badge";

export const KeywordsPage: FC<{ keywords: KeywordInfo[]; apiError?: boolean }> = ({ keywords, apiError }) => {
  return (
    <Container class="py-10">
      <h1 class="mb-2 text-xl font-semibold font-heading">Keywords</h1>
      <p class="mb-6 text-sm text-muted-foreground">
        Popular package keywords
      </p>

      {keywords.length > 0 ? (
        <div class="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <Badge
              variant="secondary"
              href={`/keywords/${encodeURIComponent(kw.slug)}`}
            >
              {kw.slug}
              <span class="ml-1 text-xs tabular-nums text-muted-foreground">
                ({kw.usage_count})
              </span>
            </Badge>
          ))}
        </div>
      ) : apiError ? (
        <div class="cn-card p-12 text-center">
          <p class="mb-2 text-base text-muted-foreground">Service temporarily unavailable</p>
          <p class="text-sm text-muted-foreground">
            Please try again later.
          </p>
        </div>
      ) : (
        <div class="py-12 text-center">
          <p class="text-sm text-muted-foreground">No keywords yet.</p>
        </div>
      )}
    </Container>
  );
};
