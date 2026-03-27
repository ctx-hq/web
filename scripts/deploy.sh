#!/bin/bash
# Deploy Web (Hono SSR + CF Pages → getctx.org)
# Usage: bash scripts/deploy.sh [--skip-test] [--no-cache]

set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
ZONE_ID="${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID is not set}"
PAGES_PROJECT="ctx-web"

RED=$'\033[31m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
DIM=$'\033[2m'
RESET=$'\033[0m'

ok()   { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${YELLOW}!${RESET} $*"; }
err()  { echo -e "${RED}✗${RESET} $*"; }
dim()  { echo -e "${DIM}$*${RESET}"; }

SKIP_CACHE="false"
SKIP_TEST="false"

for arg in "$@"; do
  case "$arg" in
    --no-cache)  SKIP_CACHE="true" ;;
    --skip-test) SKIP_TEST="true" ;;
    --help|-h)
      echo "Usage: bash scripts/deploy.sh [--skip-test] [--no-cache]"
      exit 0
      ;;
    *) err "Unknown argument: $arg"; exit 1 ;;
  esac
done

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  err "CLOUDFLARE_API_TOKEN is not set"
  exit 1
fi

echo -e "${GREEN}━━━ Deploying Web ━━━${RESET}"

cd "$DIR"

if [ "$SKIP_TEST" != "true" ]; then
  dim "  Running tests..."
  test_rc=0
  test_output=$(pnpm test 2>&1) || test_rc=$?
  if [ "$test_rc" -eq 0 ]; then
    ok "Web tests passed"
  else
    err "Web tests failed — aborting (exit code $test_rc)"
    echo "$test_output" | tail -10
    exit 1
  fi
fi

dim "  Building..."
pnpm build >/dev/null
ok "Web built"

dim "  Deploying to CF Pages..."
deploy_rc=0
output=$(npx wrangler pages deploy dist --project-name "$PAGES_PROJECT" --commit-dirty=true 2>&1) || deploy_rc=$?
if [ "$deploy_rc" -eq 0 ] && echo "$output" | grep -q "Deployment complete"; then
  url=$(echo "$output" | grep "Take a peek" | sed 's/.*at //')
  ok "Web deployed → getctx.org"
  dim "  Preview: $url"
else
  err "Web deploy failed (exit code $deploy_rc)"
  echo "$output" | tail -5
  exit 1
fi

if [ "$SKIP_CACHE" != "true" ]; then
  dim "  Purging CDN cache..."
  cache_rc=0
  result=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"purge_everything":true}' 2>&1) || cache_rc=$?
  if [ "$cache_rc" -eq 0 ] && echo "$result" | grep -q '"success":true'; then
    ok "CDN cache purged"
  else
    warn "Cache purge may have failed (exit code $cache_rc)"
  fi
else
  dim "  Cache purge skipped (--no-cache)"
fi

echo ""
ok "Done!"
