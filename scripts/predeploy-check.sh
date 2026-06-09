#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SKIP_BUILD=0
if [[ "${1:-}" == "--skip-build" ]]; then
  SKIP_BUILD=1
fi

err() {
  printf "ERROR: %s\n" "$1" >&2
}

ok() {
  printf "OK: %s\n" "$1"
}

has_key() {
  local file="$1"
  local key="$2"
  grep -Eq "^[[:space:]]*${key}=" "$file"
}

require_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    err "Missing file: $file"
    exit 1
  fi
  ok "Found $file"
}

require_keys() {
  local file="$1"
  shift
  local missing=()
  for key in "$@"; do
    if ! has_key "$file" "$key"; then
      missing+=("$key")
    fi
  done
  if [[ "${#missing[@]}" -gt 0 ]]; then
    err "Missing keys in $file: ${missing[*]}"
    exit 1
  fi
  ok "Env keys validated for $file"
}

warn_missing_keys() {
  local file="$1"
  shift
  local missing=()
  for key in "$@"; do
    if ! has_key "$file" "$key"; then
      missing+=("$key")
    fi
  done
  if [[ "${#missing[@]}" -gt 0 ]]; then
    printf "WARN: Missing optional keys in %s: %s\n" "$file" "${missing[*]}"
  else
    ok "Optional env keys present for $file"
  fi
}

run_build() {
  local dir="$1"
  if [[ ! -f "$dir/package.json" ]]; then
    err "Cannot build $dir: missing package.json"
    exit 1
  fi
  printf "Running build in %s...\n" "$dir"
  (cd "$dir" && npm run build)
  ok "Build passed in $dir"
}

printf "Arkived pre-deploy checks\n"
printf "Workspace: %s\n\n" "$ROOT_DIR"

require_file "$ROOT_DIR/api/.env"
require_file "$ROOT_DIR/platform/.env"
require_file "$ROOT_DIR/storefront/.env"

require_keys "$ROOT_DIR/api/.env" \
  NODE_ENV PORT SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY \
  RESEND_API_KEY RESEND_FROM

require_keys "$ROOT_DIR/platform/.env" \
  VITE_API_URL VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY

require_keys "$ROOT_DIR/storefront/.env" \
  VITE_API_URL VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY

warn_missing_keys "$ROOT_DIR/api/.env" \
  TURNSTILE_ENABLED TURNSTILE_REQUIRED TURNSTILE_SECRET_KEY

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  run_build "$ROOT_DIR/platform"
  run_build "$ROOT_DIR/storefront"
else
  ok "Skipped builds (--skip-build)"
fi

cat <<'EOF'

Manual checks still required:
1. Confirm Supabase Connection Pooling (PgBouncer) in Dashboard.
2. Deploy API/platform/storefront.
3. Configure Cloudflare wildcard DNS and proxy.
4. Run end-to-end smoke test on deployed URLs.
EOF
