import type { FC } from "hono/jsx";
import type { PackageType } from "../lib/types";
import { PLACEHOLDER_BY_TYPE } from "../lib/constants";
import { Icon } from "./ui/icon";
import { Input } from "./ui/input";

export const SearchBox: FC<{
  value?: string;
  size?: "default" | "large";
  autofocus?: boolean;
  selectedType?: PackageType;
  placeholder?: string;
}> = ({ value = "", size = "default", autofocus, selectedType, placeholder }) => (
  <form action="/search" method="get" class="w-full" id="search-form" role="search">
    {selectedType !== undefined && (
      <input type="hidden" name="type" value={selectedType} data-search-type-input />
    )}
    <div class="relative">
      <Input
        type="text"
        name="q"
        value={value}
        placeholder={placeholder ?? PLACEHOLDER_BY_TYPE[selectedType ?? ""] ?? PLACEHOLDER_BY_TYPE[""]}
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
