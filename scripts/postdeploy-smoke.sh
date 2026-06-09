#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-}"
PLATFORM_URL="${PLATFORM_URL:-}"
STOREFRONT_URL="${STOREFRONT_URL:-}"
TENANT_SLUG="${TENANT_SLUG:-}"
EQUIPMENT_ID="${EQUIPMENT_ID:-}"

usage() {
  cat <<'EOF'
Usage:
  API_URL=https://api.example.com TENANT_SLUG=myshop ./scripts/postdeploy-smoke.sh

Optional environment variables:
  PLATFORM_URL   e.g. https://arkived.dev
  STOREFRONT_URL e.g. https://myshop.arkived.dev
  EQUIPMENT_ID   e.g. uuid to verify equipment detail endpoint

Examples:
  API_URL=https://api.arkived.dev TENANT_SLUG=demo ./scripts/postdeploy-smoke.sh
  API_URL=https://api.arkived.dev TENANT_SLUG=demo PLATFORM_URL=https://arkived.dev STOREFRONT_URL=https://demo.arkived.dev ./scripts/postdeploy-smoke.sh
EOF
}

if [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -z "$API_URL" || -z "$TENANT_SLUG" ]]; then
  echo "ERROR: API_URL and TENANT_SLUG are required."
  usage
  exit 1
fi

ok() {
  printf "OK: %s\n" "$1"
}

warn() {
  printf "WARN: %s\n" "$1"
}

err() {
  printf "ERROR: %s\n" "$1" >&2
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Missing command: $1"
    exit 1
  fi
}

check_json_endpoint() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local body
  local status

  status="$(curl -sS -o /tmp/arkived_smoke_body.json -w "%{http_code}" "$url")"
  body="$(cat /tmp/arkived_smoke_body.json)"

  if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
    err "$name failed with HTTP $status ($url)"
    printf "%s\n" "$body"
    exit 1
  fi

  if ! printf "%s" "$body" | grep -q "$expected"; then
    err "$name did not contain expected token '$expected' ($url)"
    printf "%s\n" "$body"
    exit 1
  fi

  ok "$name ($url)"
}

check_http_ok() {
  local name="$1"
  local url="$2"
  local status

  status="$(curl -sS -o /dev/null -w "%{http_code}" "$url")"
  if [[ "$status" -lt 200 || "$status" -ge 400 ]]; then
    err "$name failed with HTTP $status ($url)"
    exit 1
  fi
  ok "$name ($url)"
}

require_cmd curl
require_cmd grep

echo "Arkived post-deploy smoke test"
echo "API_URL=$API_URL"
echo "TENANT_SLUG=$TENANT_SLUG"

check_json_endpoint "API health" "$API_URL/health" "\"status\":\"ok\""
check_json_endpoint "Tenant public profile" "$API_URL/api/v1/tenant/$TENANT_SLUG/public" "\"tenant\""
check_json_endpoint "Storefront catalog API" "$API_URL/api/v1/storefront/$TENANT_SLUG/catalog" "\"data\""

if [[ -n "$EQUIPMENT_ID" ]]; then
  check_json_endpoint \
    "Storefront equipment detail API" \
    "$API_URL/api/v1/storefront/$TENANT_SLUG/catalog/$EQUIPMENT_ID" \
    "\"data\""
  check_json_endpoint \
    "Storefront availability API" \
    "$API_URL/api/v1/storefront/$TENANT_SLUG/catalog/$EQUIPMENT_ID/availability" \
    "\"data\""
else
  warn "Skipping equipment detail/availability checks (EQUIPMENT_ID not set)."
fi

if [[ -n "$PLATFORM_URL" ]]; then
  check_http_ok "Platform web" "$PLATFORM_URL"
else
  warn "Skipping platform web check (PLATFORM_URL not set)."
fi

if [[ -n "$STOREFRONT_URL" ]]; then
  check_http_ok "Storefront web" "$STOREFRONT_URL"
else
  warn "Skipping storefront web check (STOREFRONT_URL not set)."
fi

cat <<'EOF'

Manual authenticated flow (not fully automatable in this script):
1. Sign in to platform UI.
2. Create or update equipment.
3. Create booking in dashboard and progress statuses.
4. Submit storefront inquiry and verify booking appears in dashboard.
EOF
