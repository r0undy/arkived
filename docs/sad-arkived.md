# Subagents Document (SAD) — Arkived

**Project:** Arkived
**Date:** 2026-06-09
**Version:** 0.1.0
**Owner:** Regalia Council
**Status:** Draft
**Last reconciled:** 2026-06-09
**PRD:** [prd-arkived.md](prd-arkived.md)
**SDD:** [sdd-arkived.md](sdd-arkived.md)

---

## 1. Purpose & Scope

This document defines the specialized developer subagent roles deployed to implement the Arkived SaaS platform. Due to the split repository structure (`api/`, `platform/`, `storefront/`), dividing code generation and testing into discrete agent scopes protects context windows and enforces component boundaries.

**Out of scope:** Subagents do not modify architectural designs or database isolation rules. They work within the boundaries defined in the PRD and SDD.

---

## 2. Roster Design Rationale

We establish specialized subagents to divide labor between frontends and backend while keeping a dedicated test-verifier to guard row-level database security.

| Considered | Decision | Reason |
|------------|----------|--------|
| `seo-optimizer` | Rejected | Merged into `storefront-developer` since storefront SEO is native to React 19 in App 2. |
| `database-migrator` | Rejected | Inline task handled by `api-developer` during endpoint setups. |

---

## 3. The Roster

| Agent ID | Name | One-line job | Derived from | Spawn trigger | Model hint |
|----------|------|--------------|--------------|---------------|------------|
| SAD-A1 | api-developer | Builds Express routes, Zod models, and database queries. | SDD §3, §4 | When writing code under `api/` directory. | balanced |
| SAD-A2 | platform-developer | Builds Vite/React pages and onboarding wizards in App 1. | PRD §3.1, §3.4 | When modifying files in `platform/` directory. | balanced |
| SAD-A3 | storefront-developer | Implements dynamic storefront components and tenant style overrides in App 2. | PRD §3.1, §3.2 | When modifying files in `storefront/` directory. | balanced |
| SAD-A4 | test-verifier | Executes tests and verifies multi-tenant isolation. | QAD | Automatically gates PR reviews and code merges. | fast |

---

### Agent Cards

#### SAD-A1 — api-developer
- **Purpose:** Restricts model focus to Node.js backend logic, separating it from frontend styling and asset files.
- **Derived from:** SDD §3 (Database Schema), SDD §4 (API Design).
- **Responsibilities:**
  - Create Express routes, controllers, and middlewares.
  - Implement Zod schema validations on incoming endpoints.
  - Write SQL migrations and queries (ensuring tenant context is passed).
- **Inputs:** Schema requirements, endpoint path definitions, raw JSON payloads.
- **Outputs:** Verified files inside `api/src/`.
- **Capabilities / tools needed:** `Read`, `Write`, `Grep`, `Shell` (to verify Node execution).
- **Spawn trigger:** Implementation of a backend endpoint.
- **Guardrails (never):** Never edit frontend files under `platform/` or `storefront/`. Never bypass JWT auth middleware.
- **Done when:** The endpoint returns 200 OK under manual mock calls and tests pass.

#### SAD-A2 — platform-developer
- **Purpose:** Focuses exclusively on building the tenant administration dashboard.
- **Derived from:** PRD §3.1 (Multi-tenant onboarding), DSD (Branding guidelines).
- **Responsibilities:**
  - Create dashboard pages, onboarding checks, and form elements.
  - Integrate with the Express REST API endpoints using standard fetch.
- **Inputs:** UI designs, state specifications, route targets.
- **Outputs:** React components under `platform/src/`.
- **Capabilities / tools needed:** `Read`, `Write`, `Grep`.
- **Spawn trigger:** Addition of admin features.
- **Guardrails (never):** Never modify `api/` or `storefront/` codebase.
- **Done when:** UI component passes local visual check and successfully fetches/posts data to mock API.

#### SAD-A3 — storefront-developer
- **Purpose:** Implements tenant storefront resolving templates.
- **Derived from:** PRD §3.1 (Subdomains), DSD §8 (Storefront theming).
- **Responsibilities:**
  - Build public catalog pages and reservation inquiry forms.
  - Implement runtime CSS custom property theme overrides based on subdomain slug.
- **Inputs:** Dynamic branding definitions, storefront routes.
- **Outputs:** React components under `storefront/src/`.
- **Capabilities / tools needed:** `Read`, `Write`, `Grep`.
- **Spawn trigger:** Storefront catalog layout edits.
- **Guardrails (never):** Never hardcode styling parameters inside component classes (must reference Tailwind `bg-primary` variables).
- **Done when:** Storefront resolves test tenant's slug and injects their CSS brand properties correctly.

#### SAD-A4 — test-verifier
- **Purpose:** Enforces quality and isolation checks.
- **Derived from:** QAD (Core Test Scenarios).
- **Responsibilities:**
  - Run unit and integration tests.
  - Run database isolation test scripts.
- **Inputs:** A modified workspace.
- **Outputs:** Test pass/fail reports and stdout logs.
- **Capabilities / tools needed:** `Shell` (to run `npm run test` or `npm run db:seed:test`).
- **Spawn trigger:** Any codebase modification prior to commit.
- **Guardrails (never):** Never modify implementation files.
- **Done when:** Outputs a zero-exit status code for the testing suite.

---

## 4. Orchestration

Subagents are invoked on-demand by developers depending on the target directory they are editing. The `test-verifier` runs as the final step to gate changes.

```
Developer ──▶ api-dev (SAD-A1) ──▶ platform-dev (SAD-A2) ──▶ test-verifier (SAD-A4) ──▶ Done
                  │                    │
                  ▼                    ▼
             storefront-dev (SAD-A3) ──┘
```

---

## 5. Materialization (Platform Mapping)

Since this project runs on Windows under Antigravity, subagent definitions serve as guide-rails for developers and are referenced conceptually during execution cycles.
