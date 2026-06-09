# QA & Test Plan (QAD) — Arkived

**Project:** Arkived
**Date:** 2026-06-09
**Version:** 0.1.0
**Owner:** Regalia Council
**Status:** Draft
**Last reconciled:** 2026-06-09
**PRD:** [prd-arkived.md](prd-arkived.md)

---

## 1. Testing Strategy & Scope

**In Scope:**
- Multi-Tenant Core: Onboarding flows, subdomain routing, and row-level data isolation.
- Inventory CRUD: Item registration, soft deletion, and category management.
- Booking & Scheduling: Conflict resolution (no double-bookings), status pipeline transitions, and date calculations.
- Storefront client: Runtime resolving of tenant subdomains and asset loading.

**Out of Scope:**
- Performance testing beyond 100 concurrent mock users.
- Automated browser testing on mobile OS (will use Chrome DevTools emulator for manual verification instead).
- Stripe payment gateway integration testing (deferred to v2.0).

**Testing levels:**

| Level | Tooling | Owner |
|-------|---------|-------|
| Unit tests | Vitest / Jest | Developer (with PR) |
| Integration tests | Vitest + Supabase Local Emulator | Developer |
| E2E tests | Playwright | QA / Developer |
| Manual exploratory | Google Chrome / Safari | Product Team |

---

## 2. Test Environments & Data

**Staging URL:** `https://staging.arkived.dev`
**Test credentials:** Stored in environment variables locally or Github Secrets in staging (`TEST_TENANT_ADMIN`, `TEST_TENANT_STAFF`).
**Data policy:** Seed staging DB with mock tenants and inventories. Never sync production customer emails or phone numbers.

**Test data setup:**
```bash
# In api/ directory
npm run db:seed:test
```

---

## 3. Core Test Scenarios

### Happy Paths (must all pass before launch)

| ID | Scenario | Steps | Expected Result | PRD Ref |
|----|----------|-------|-----------------|---------|
| H-01 | Successful Tenant Registration | Fill out sign-up wizard with unique slug, brand color, and credentials. | Workspace created; default categories seeded; redirected to onboarding. | PRD §3.1 |
| H-02 | Add Catalog Item | Navigate to inventory page, fill in equipment specs, upload image, and save. | Item appears in catalog list; image stored in tenant prefix path. | PRD §3.2 |
| H-03 | Rent and Return Workflow | Create a booking, pay, dispatch, return, and close. | Status updates correctly from `reserved` to `closed` in database. | PRD §3.3 |
| H-04 | Storefront Tenant Resolution | Access `{tenant}.arkived.dev` where tenant is configured. | Brand color custom properties injected; catalog filtered to tenant. | PRD §3.1 |

### Sad Paths (edge cases and error handling)

| ID | Scenario | Input / Trigger | Expected Behavior |
|----|----------|-----------------|-------------------|
| S-01 | Slug Collision | Registering with a subdomain slug that already exists. | Validator returns a 400 validation error in the UI. |
| S-02 | Overlap Booking Booking | Attempting to book an item for dates overlapping an active booking. | API returns a 409 conflict error; UI blocks date selection. |
| S-03 | Invalid Accent Color | Saving branding colors with insufficient contrast (<4.5:1). | Color picker shows a validation error; save button disabled. |
| S-04 | Soft Deleted Item Query | Attempting to query an archived item's public endpoint. | Server returns a 404 Not Found error. |

### Abuse / Adversarial Paths (malicious actors)

| ID | Attack | Trigger | Expected Defense |
|----|--------|---------|------------------|
| AB-01 | Cross-Tenant Read | Querying `/api/v1/equipment/:id` where ID belongs to Tenant B. | 403 Forbidden; API scopes DB search by JWT `tenant_id` claim. |
| AB-02 | RLS Bypass | Attempting to execute raw Supabase calls by mocking client requests. | PostgreSQL policies block read/write of tables without user session matching tenant. |
| AB-03 | SQL Injection | Submitting SQL commands in search fields or custom tags. | Inputs are typed via Zod and parameterized in Postgres queries. |
| AB-04 | CSS Custom Property Injection | Inserting malicious JS strings into accent color settings (e.g. `red; background:url(...)`). | Validator restricts accent color to regex-checked hex code values (`/^#[0-9A-F]{6}$/i`). |

---

## 4. Automation vs. Manual Testing

### Automated (CI pipeline)

```yaml
# GitHub Actions checks on PR:
- npm run lint
- npm run test:unit
- npm run test:integration # executes local Express routing checks against mock Supabase instances
```

### Manual / Exploratory
- Check storefront display on tablet and mobile viewports.
- Keyboard navigation of the booking booking wizard.
- Verification of image loading under latency throttling.

---

## 5. Bug Triage Protocol

| Severity | Definition | Action |
|----------|------------|--------|
| **P0 — Blocker** | Security breach (cross-tenant leak), payment validation bypass, app crash on core flows. | Block release. Fix immediately. |
| **P1 — High** | Core booking workflow fails, images fail to render, or RLS policies throw unhandled errors. | Block release. Fix before deployment. |
| **P2 — Medium** | Dashboard charts load slowly, minor visual glitches, or CSV export fails. | Safe to release. Fix in next patch iteration. |
| **P3 — Low** | Typo in helper text or minor animation delay. | Safe to release. Backlog item. |

---

## 6. Release Criteria (Definition of Done)

Launch is approved when all of the following are true:
- [ ] Zero P0 and P1 bugs outstanding.
- [ ] All happy paths (H-01 to H-04) pass in staging.
- [ ] RLS validation checks pass.
- [ ] Dynamic theming works on all major desktop browsers (Chrome, Firefox, Safari).
- [ ] Performance Lighthouse metrics score >= 85 for public storefront templates.
