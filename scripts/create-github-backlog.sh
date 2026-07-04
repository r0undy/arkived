#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DRY_RUN=0
REPO=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --repo)
      REPO="${2:-}"
      if [[ -z "$REPO" ]]; then
        echo "ERROR: --repo requires a value like owner/repo" >&2
        exit 1
      fi
      shift 2
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      echo "Usage: $0 [--dry-run] [--repo owner/repo]" >&2
      exit 1
      ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) is not installed." >&2
  exit 1
fi

if [[ -z "$REPO" ]]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

if [[ "$DRY_RUN" -eq 0 ]]; then
  gh auth status >/dev/null
fi

echo "Target repo: $REPO"
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Mode: dry-run"
fi

ensure_label() {
  local name="$1"
  local color="$2"
  local description="$3"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] ensure label: $name"
    return
  fi

  gh label create "$name" \
    --repo "$REPO" \
    --color "$color" \
    --description "$description" \
    --force >/dev/null
}

create_issue() {
  local title="$1"
  local labels_csv="$2"
  local body="$3"
  local type_label="$4"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] create $type_label: $title"
    echo "[dry-run] labels: $labels_csv"
    echo "[dry-run] ---"
    echo "$body" | head -n 8
    echo "[dry-run] ..."
    echo
    echo "0"
    return
  fi

  local cmd=(gh issue create --repo "$REPO" --title "$title" --body "$body")
  local IFS=','
  read -r -a labels <<< "$labels_csv"
  for label in "${labels[@]}"; do
    cmd+=(--label "$label")
  done

  local issue_url
  issue_url="$("${cmd[@]}")"
  echo "$issue_url" | sed -E 's#.*/([0-9]+)$#\1#'
}

echo "Ensuring labels..."
ensure_label "epic" "5319e7" "Large body of work spanning multiple stories"
ensure_label "user-story" "0e8a16" "End-user centric feature story"
ensure_label "task" "1d76db" "Implementation task"
ensure_label "priority:P1" "b60205" "High priority"
ensure_label "priority:P2" "d93f0b" "Medium priority"
ensure_label "priority:P3" "fbca04" "Lower priority"
ensure_label "domain:auth" "0052cc" "Authentication and access"
ensure_label "domain:tenant-branding" "5319e7" "Tenant profile and branding"
ensure_label "domain:equipment" "0e8a16" "Inventory and maintenance"
ensure_label "domain:bookings" "1d76db" "Booking lifecycle and scheduling"
ensure_label "domain:customers" "c2e0c6" "Customer management"
ensure_label "domain:notifications" "fef2c0" "Email/SMS reminders and alerts"
ensure_label "domain:analytics" "bfdadc" "Analytics and reporting"
ensure_label "domain:admin" "d4c5f9" "Platform owner and governance"
ensure_label "domain:quality" "ededed" "Testing, CI, and operational quality"

echo "Creating EPICs, stories, and tasks..."

EPIC_AUTH=$(create_issue "EPIC: Tenant onboarding, auth, and access hardening" "epic,priority:P1,domain:auth" "## Objective
Deliver secure, low-friction onboarding and access control for tenant operators.

## Outcomes
- Tenant signup/login flows are reliable with anti-bot checks.
- Role-based access is consistently enforced.
- Auth errors are actionable and recoverable.

## Scope
- Platform login and signup UX
- API auth and role middleware
- Session/account state handling" "epic")

STORY_AUTH_SIGNUP=$(create_issue "US: As a new tenant owner, I can create an account and business workspace" "user-story,priority:P1,domain:auth" "## User Story
As a new tenant owner, I want to create an account and initialize my workspace, so that I can start managing bookings immediately.

Parent Epic: #$EPIC_AUTH

## Acceptance Criteria
- Signup validates required business and user fields.
- Turnstile verification blocks scripted abuse.
- Successful signup routes user to welcome/dashboard state." "user-story")

create_issue "TASK: Validate signup payload and tenant bootstrap in API" "task,priority:P1,domain:auth" "Parent Epic: #$EPIC_AUTH
Parent User Story: #$STORY_AUTH_SIGNUP

## Definition of Done
- Zod validation and errors are explicit.
- Tenant + owner account creation is transactional or rollback-safe.
- Failure paths are logged with safe error details." "task" >/dev/null

create_issue "TASK: Finalize signup UX states in platform app" "task,priority:P2,domain:auth" "Parent Epic: #$EPIC_AUTH
Parent User Story: #$STORY_AUTH_SIGNUP

## Definition of Done
- Loading, success, and error states are visible.
- Clear guidance is shown for duplicate email/business conflicts.
- Redirect behavior is deterministic after successful signup." "task" >/dev/null

STORY_AUTH_ROLES=$(create_issue "US: As a tenant admin, I can enforce role-based access for staff" "user-story,priority:P1,domain:auth" "## User Story
As a tenant admin, I want role-based permissions across protected routes and APIs, so that only authorized staff can perform sensitive actions.

Parent Epic: #$EPIC_AUTH

## Acceptance Criteria
- Admin-only and owner-only endpoints are protected.
- Unauthorized users receive consistent 401/403 responses.
- Frontend route guards align with backend permissions." "user-story")

create_issue "TASK: Audit and align API route protection middleware" "task,priority:P1,domain:auth" "Parent Epic: #$EPIC_AUTH
Parent User Story: #$STORY_AUTH_ROLES

## Definition of Done
- Sensitive endpoints use requireAuth/requireRole consistently.
- Access matrix is documented in route-level comments or docs.
- Regression checks verify forbidden access paths." "task" >/dev/null

create_issue "TASK: Align protected route behavior in platform UI" "task,priority:P2,domain:auth" "Parent Epic: #$EPIC_AUTH
Parent User Story: #$STORY_AUTH_ROLES

## Definition of Done
- ProtectedRoute and PlatformOwnerRoute behaviors are consistent.
- Unauthorized navigation redirects are predictable.
- Role mismatch states have user-facing messaging." "task" >/dev/null

EPIC_CATALOG=$(create_issue "EPIC: Equipment catalog and maintenance reliability" "epic,priority:P1,domain:equipment" "## Objective
Improve inventory quality, availability confidence, and maintenance workflows.

## Outcomes
- Equipment records stay accurate and discoverable.
- Maintenance state impacts booking availability correctly.
- Image/media management is consistent for operators and storefront users.

## Scope
- Equipment CRUD and details
- Maintenance logging
- Availability and media handling" "epic")

STORY_EQUIP_INVENTORY=$(create_issue "US: As an operator, I can manage equipment records with images and status" "user-story,priority:P1,domain:equipment" "## User Story
As an operator, I want complete equipment records with media and lifecycle status, so that my catalog is trustworthy for booking.

Parent Epic: #$EPIC_CATALOG

## Acceptance Criteria
- Operators can create/update/archive equipment entries.
- Primary image and gallery ordering are supported.
- Catalog list/detail views reflect latest state." "user-story")

create_issue "TASK: Normalize equipment create/update validation rules" "task,priority:P1,domain:equipment" "Parent Epic: #$EPIC_CATALOG
Parent User Story: #$STORY_EQUIP_INVENTORY

## Definition of Done
- Required fields and numeric constraints are centralized.
- Validation errors are explicit and machine-readable.
- API responses stay backward compatible." "task" >/dev/null

create_issue "TASK: Harden image upload and ordering UX" "task,priority:P2,domain:equipment" "Parent Epic: #$EPIC_CATALOG
Parent User Story: #$STORY_EQUIP_INVENTORY

## Definition of Done
- Operators can set primary image without race conditions.
- Broken upload states are recoverable.
- Image ordering persists consistently after refresh." "task" >/dev/null

STORY_EQUIP_MAINT=$(create_issue "US: As an operator, I can track maintenance to prevent unsafe bookings" "user-story,priority:P1,domain:equipment" "## User Story
As an operator, I want to track maintenance events and due dates, so that unavailable or unsafe equipment cannot be booked.

Parent Epic: #$EPIC_CATALOG

## Acceptance Criteria
- Maintenance logs support create/update/delete.
- Due/overdue status is visible in operations UI.
- Maintenance state affects booking availability checks." "user-story")

create_issue "TASK: Enforce maintenance status in availability logic" "task,priority:P1,domain:equipment" "Parent Epic: #$EPIC_CATALOG
Parent User Story: #$STORY_EQUIP_MAINT

## Definition of Done
- Availability endpoint excludes unavailable maintenance windows.
- Booking validations reject maintenance conflicts.
- Unit-level checks cover edge windows and timezone boundaries." "task" >/dev/null

create_issue "TASK: Add maintenance timeline section to equipment detail" "task,priority:P2,domain:equipment" "Parent Epic: #$EPIC_CATALOG
Parent User Story: #$STORY_EQUIP_MAINT

## Definition of Done
- Timeline displays upcoming and historical maintenance entries.
- Maintenance actions are role-gated.
- Empty states and errors are handled gracefully." "task" >/dev/null

EPIC_BOOKINGS=$(create_issue "EPIC: Booking lifecycle, dispatch, and return flow" "epic,priority:P1,domain:bookings" "## Objective
Streamline booking workflows from inquiry to closure with strong conflict prevention.

## Outcomes
- Fewer double-bookings and scheduling conflicts.
- Clear progression across booking states.
- Calendar and detail views remain synchronized.

## Scope
- Inquiry intake
- Booking state machine
- Calendar and detail updates" "epic")

STORY_BOOK_QUOTE=$(create_issue "US: As a renter, I can submit inquiries and receive booking updates" "user-story,priority:P1,domain:bookings" "## User Story
As a renter, I want an easy inquiry process and status visibility, so that I can confidently rent equipment.

Parent Epic: #$EPIC_BOOKINGS

## Acceptance Criteria
- Storefront supports single-item and multi-item inquiries.
- Inquiry tracking shows current status and key details.
- Invalid date ranges and quantity conflicts are blocked." "user-story")

create_issue "TASK: Standardize inquiry payload validation across storefront endpoints" "task,priority:P1,domain:bookings" "Parent Epic: #$EPIC_BOOKINGS
Parent User Story: #$STORY_BOOK_QUOTE

## Definition of Done
- Shared validators cover names, contacts, dates, and quantities.
- API returns stable error shape for frontend rendering.
- Validation tests cover malformed and boundary inputs." "task" >/dev/null

create_issue "TASK: Improve renter tracking UX for request status" "task,priority:P2,domain:bookings" "Parent Epic: #$EPIC_BOOKINGS
Parent User Story: #$STORY_BOOK_QUOTE

## Definition of Done
- Tracking page handles pending/approved/rejected/completed states.
- Retry/recovery UX exists for network failures.
- Status copy is plain-language and timestamped." "task" >/dev/null

STORY_BOOK_OPS=$(create_issue "US: As an operator, I can progress bookings through dispatch and return" "user-story,priority:P1,domain:bookings" "## User Story
As an operator, I want structured status transitions and operational notes, so that every booking is fulfilled and closed cleanly.

Parent Epic: #$EPIC_BOOKINGS

## Acceptance Criteria
- Status transitions enforce allowed sequence.
- Calendar and detail pages stay in sync after updates.
- Overdue and return workflows are clearly surfaced." "user-story")

create_issue "TASK: Enforce booking status transition rules in API" "task,priority:P1,domain:bookings" "Parent Epic: #$EPIC_BOOKINGS
Parent User Story: #$STORY_BOOK_OPS

## Definition of Done
- Invalid transitions are rejected with actionable errors.
- Transition audit fields are persisted.
- Edge cases (cancel/reopen/late return) are documented and covered." "task" >/dev/null

create_issue "TASK: Refine booking board and detail page synchronization" "task,priority:P2,domain:bookings" "Parent Epic: #$EPIC_BOOKINGS
Parent User Story: #$STORY_BOOK_OPS

## Definition of Done
- List and detail update optimistically with rollback on failures.
- Filters and pagination preserve context after updates.
- Calendar reflects transition updates without full page reload." "task" >/dev/null

EPIC_CUSTOMERS=$(create_issue "EPIC: Customer CRM and automated communication" "epic,priority:P2,domain:customers" "## Objective
Build reliable customer records and proactive communications that reduce missed returns and no-shows.

## Outcomes
- Customer profiles aggregate history accurately.
- Reminder and overdue notifications are timely.
- Communication settings stay tenant-aware.

## Scope
- Customer records and detail views
- Reminder notification jobs
- Email/SMS provider integration" "epic")

STORY_CRM=$(create_issue "US: As an operator, I can view full customer history and booking context" "user-story,priority:P2,domain:customers" "## User Story
As an operator, I want unified customer records with booking history, so that I can provide better service and risk assessment.

Parent Epic: #$EPIC_CUSTOMERS

## Acceptance Criteria
- Customers can be searched and filtered reliably.
- Detail page shows booking history and key contact metadata.
- Editing customer profile updates dependent views." "user-story")

create_issue "TASK: Optimize customer list query and filters" "task,priority:P2,domain:customers" "Parent Epic: #$EPIC_CUSTOMERS
Parent User Story: #$STORY_CRM

## Definition of Done
- Filtering by name/contact/status is supported server-side.
- Query performance is acceptable on large tenant datasets.
- Empty and error states are explicit in UI." "task" >/dev/null

create_issue "TASK: Expand customer detail timeline and activity summary" "task,priority:P3,domain:customers" "Parent Epic: #$EPIC_CUSTOMERS
Parent User Story: #$STORY_CRM

## Definition of Done
- Timeline highlights booking milestones and payment state.
- Most recent interactions are easy to scan.
- Data mapping is consistent with API contract." "task" >/dev/null

STORY_NOTIFY=$(create_issue "US: As an operator, I can rely on automated reminders for pickup/return/overdue events" "user-story,priority:P1,domain:notifications" "## User Story
As an operator, I want automated reminder messages for booking milestones, so that customers are informed without manual follow-up.

Parent Epic: #$EPIC_CUSTOMERS

## Acceptance Criteria
- Daily scheduler runs reminder workflows safely.
- Notification templates include tenant branding where applicable.
- Failures are retried or surfaced for operational follow-up." "user-story")

create_issue "TASK: Add observability for scheduler and notification failures" "task,priority:P1,domain:notifications" "Parent Epic: #$EPIC_CUSTOMERS
Parent User Story: #$STORY_NOTIFY

## Definition of Done
- Scheduler logs include run IDs and per-job summaries.
- Failures include actionable error context without secrets.
- Basic alerting path is documented for repeated failures." "task" >/dev/null

create_issue "TASK: Review and finalize reminder template variants" "task,priority:P2,domain:notifications" "Parent Epic: #$EPIC_CUSTOMERS
Parent User Story: #$STORY_NOTIFY

## Definition of Done
- Templates cover upcoming start, due return, overdue, and maintenance alerts.
- Plain text fallback content is present.
- Variables are validated before send." "task" >/dev/null

EPIC_INSIGHTS=$(create_issue "EPIC: Analytics, admin insights, and engineering quality gates" "epic,priority:P1,domain:analytics" "## Objective
Improve decision-making for tenants and platform owners while reducing release risk through stronger quality automation.

## Outcomes
- Analytics KPIs are trusted and actionable.
- Platform-owner dashboards expose tenant health.
- CI quality gates prevent regressions reaching production.

## Scope
- Tenant analytics APIs/pages
- Admin overview
- Tests and CI enforcement" "epic")

STORY_ANALYTICS=$(create_issue "US: As a tenant owner, I can monitor utilization, revenue, and demand trends" "user-story,priority:P1,domain:analytics" "## User Story
As a tenant owner, I want clear analytics for revenue, utilization, and booking trends, so that I can make inventory and pricing decisions.

Parent Epic: #$EPIC_INSIGHTS

## Acceptance Criteria
- Analytics endpoints support consistent date-range filtering.
- KPI cards and charts match source metrics.
- Dashboard loading and error states are clear." "user-story")

create_issue "TASK: Validate analytics endpoint contracts against UI data needs" "task,priority:P1,domain:analytics" "Parent Epic: #$EPIC_INSIGHTS
Parent User Story: #$STORY_ANALYTICS

## Definition of Done
- API response shapes are documented and version-safe.
- Missing data windows return sensible defaults.
- Metric calculations are verified on sample fixtures." "task" >/dev/null

create_issue "TASK: Improve analytics page resilience and UX" "task,priority:P2,domain:analytics" "Parent Epic: #$EPIC_INSIGHTS
Parent User Story: #$STORY_ANALYTICS

## Definition of Done
- Chart components handle sparse data gracefully.
- Date filters are debounced and preserve user intent.
- Loading skeletons and error recovery actions are present." "task" >/dev/null

STORY_QUALITY=$(create_issue "US: As an engineering team, we have automated test and CI quality gates" "user-story,priority:P1,domain:quality" "## User Story
As an engineering team, we want automated tests and CI quality checks, so that regressions are caught before deployment.

Parent Epic: #$EPIC_INSIGHTS

## Acceptance Criteria
- API has baseline unit/integration test coverage for critical routes.
- Frontends run lint/build checks in CI.
- Workflows fail on quality gate failures." "user-story")

create_issue "TASK: Add baseline test suites for API critical paths" "task,priority:P1,domain:quality" "Parent Epic: #$EPIC_INSIGHTS
Parent User Story: #$STORY_QUALITY

## Definition of Done
- Auth, bookings, and equipment route smoke tests exist.
- Test command is added to API package scripts.
- CI executes tests without --if-present bypass." "task" >/dev/null

create_issue "TASK: Add frontend lint/type/build checks to workflows" "task,priority:P2,domain:quality" "Parent Epic: #$EPIC_INSIGHTS
Parent User Story: #$STORY_QUALITY

## Definition of Done
- Platform and storefront workflows run lint and build checks.
- Failing checks block deployment jobs.
- Workflow docs explain local reproduction steps." "task" >/dev/null

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry-run complete. No issues were created."
else
  echo "Backlog creation complete."
  echo "View issues: https://github.com/$REPO/issues"
fi