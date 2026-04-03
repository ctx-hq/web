import { ApiClient } from "./api-client";
import type { SessionUser } from "./types";

export type AppEnv = {
  Bindings: {
    API_BASE_URL: string;
    GITHUB_CLIENT_ID?: string;
  };
  Variables: {
    user: SessionUser | null;
    token: string | null;
  };
};

export function api(c: { env: AppEnv["Bindings"] }) {
  const base = c.env.API_BASE_URL;
  if (!base) throw new Error("API_BASE_URL environment variable is required");
  return new ApiClient(base);
}

/** Validate redirect path: must be relative, no protocol, no double-slash (open redirect prevention). */
export function isSafeRedirect(path: string | undefined): path is string {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//") && !/^\/[\\]/.test(path) && !path.includes(":");
}
