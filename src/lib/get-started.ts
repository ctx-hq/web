/** Pure data & logic for the homepage "Get Started" section and install tabs. */

export const SITE_SKILL_URL = "https://getctx.org/skill.md";

export function agentPromptGlobal(): string {
  return `Read ${SITE_SKILL_URL}`;
}

export function agentPromptPackage(fullName: string): string {
  return `Read https://getctx.org/${fullName}.ctx`;
}

export function installCommandUnix(): string {
  return "curl -fsSL https://getctx.org/install.sh | sh";
}

export function installCommandWindows(): string {
  return "irm https://getctx.org/install.ps1 | iex";
}

export function usageExamples(): string[] {
  return [
    'ctx search "code review"',
    "ctx install @scope/name",
    "ctx serve",
  ];
}

export type OsPlatform = "unix" | "windows";

/** Detect OS from navigator.platform or userAgent string. Defaults to unix. */
export function detectOs(platformOrUa: string): OsPlatform {
  return /win/i.test(platformOrUa) ? "windows" : "unix";
}
