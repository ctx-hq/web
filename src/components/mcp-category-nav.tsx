import type { FC } from "hono/jsx";
import type { MCPCategoryCount } from "../lib/types";

export const MCPCategoryNav: FC<{
  categories: MCPCategoryCount[];
  current: string;
  total: number;
}> = ({ categories, current, total }) => (
  <nav aria-label="MCP categories">
    {/* Desktop: vertical sidebar list */}
    <ul class="hidden lg:block space-y-0.5" role="list">
      <CategoryItem
        slug=""
        name="All"
        count={total}
        active={!current}
      />
      {categories.map((cat) => (
        <CategoryItem
          slug={cat.slug}
          name={cat.name}
          count={cat.count}
          active={current === cat.slug}
        />
      ))}
    </ul>
    {/* Mobile: horizontal scroll pills */}
    <div class="flex gap-2 overflow-x-auto pb-2 lg:hidden" role="list">
      <CategoryPill slug="" name="All" count={total} active={!current} />
      {categories.map((cat) => (
        <CategoryPill
          slug={cat.slug}
          name={cat.name}
          count={cat.count}
          active={current === cat.slug}
        />
      ))}
    </div>
  </nav>
);

const CategoryItem: FC<{
  slug: string;
  name: string;
  count: number;
  active: boolean;
}> = ({ slug, name, count, active }) => (
  <li>
    <a
      href={slug ? `/mcp?category=${slug}` : "/mcp"}
      class={[
        "flex items-center justify-between px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <span>{name}</span>
      <span class="text-xs tabular-nums text-muted-foreground">{count}</span>
    </a>
  </li>
);

const CategoryPill: FC<{
  slug: string;
  name: string;
  count: number;
  active: boolean;
}> = ({ slug, name, count, active }) => (
  <a
    href={slug ? `/mcp?category=${slug}` : "/mcp"}
    class={[
      "cn-badge shrink-0 whitespace-nowrap",
      active ? "cn-badge-variant-type-mcp cn-badge-active" : "cn-badge-variant-secondary",
    ].join(" ")}
    aria-current={active ? "page" : undefined}
  >
    {name} ({count})
  </a>
);
