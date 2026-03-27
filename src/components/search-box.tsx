import type { FC } from "hono/jsx";
import { Icon } from "./ui/icon";
import { Input } from "./ui/input";

export const SearchBox: FC<{
  value?: string;
  size?: "default" | "large";
  autofocus?: boolean;
}> = ({ value = "", size = "default", autofocus }) => (
  <form action="/search" method="get" class="w-full">
    <div class="relative">
      <Input
        type="text"
        name="q"
        value={value}
        placeholder="Search skills, MCP servers, CLI tools..."
        size={size === "large" ? "lg" : "default"}
        class="pr-9"
        id="search-input"
        autocomplete="off"
        autofocus={autofocus}
        aria-label="Search packages"
      />
      <button
        type="submit"
        class="absolute right-0 top-0 flex h-full items-center px-2.5 text-muted-foreground hover:text-foreground"
        aria-label="Search"
      >
        <Icon name="magnifying-glass" class="size-4" />
      </button>
    </div>
  </form>
);
