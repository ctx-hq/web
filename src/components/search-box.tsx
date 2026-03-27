import type { FC } from "hono/jsx";

export const SearchBox: FC<{
  value?: string;
  size?: "default" | "large";
  autofocus?: boolean;
}> = ({ value = "", size = "default", autofocus }) => {
  const inputClass =
    size === "large"
      ? "cn-input py-2.5 text-sm"
      : "cn-input";

  return (
    <form action="/search" method="get" class="w-full">
      <div class="relative">
        <input
          type="text"
          name="q"
          value={value}
          placeholder="Search skills, MCP servers, CLI tools..."
          class={inputClass}
          id="search-input"
          autocomplete="off"
          autofocus={autofocus}
          aria-label="Search packages"
        />
        <button
          type="submit"
          class="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
          aria-label="Search"
        >
          →
        </button>
      </div>
    </form>
  );
};
