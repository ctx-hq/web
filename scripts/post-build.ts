/**
 * Post-build script — generates dist/_routes.json for Cloudflare Pages.
 * Run automatically after `vite build` via the `build` npm script.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROUTES_CONFIG } from "../src/lib/deploy.ts";

const outPath = resolve(import.meta.dirname, "../dist/_routes.json");

writeFileSync(outPath, JSON.stringify(ROUTES_CONFIG, null, 2) + "\n");

console.log("✓ Generated dist/_routes.json");
