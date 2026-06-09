# Documentation Index — Arkived

**Project slug:** `arkived`
**Maintained by:** Regalia Council
**Last updated:** 2026-06-09

---

## 1. Document Suite

| Document | File | Version | Status | Last Updated | Last Reconciled |
|----------|------|---------|--------|--------------|-----------------|
| BRD — Business Requirements | [brd-arkived.md](brd-arkived.md) | 0.1.0 | N/A — not written | 2026-06-09 | N/A |
| PRD — Product Requirements | [prd-arkived.md](prd-arkived.md) | 1.0.0 | Draft | 2026-06-06 | N/A |
| DSD — Design System | [dsd-arkived.md](dsd-arkived.md) | 1.0.0 | Draft | 2026-06-06 | N/A |
| SDD — System Design | [sdd-arkived.md](sdd-arkived.md) | 0.1.0 | Draft | 2026-06-09 | N/A |
| QAD — QA & Test Plan | [qad-arkived.md](qad-arkived.md) | 0.1.0 | Draft | 2026-06-09 | N/A |
| SAD — Subagents | [sad-arkived.md](sad-arkived.md) | 0.1.0 | Draft | 2026-06-09 | N/A |
| BUILD — Build Guide | [build-arkived.md](build-arkived.md) | 0.1.0 | Draft | 2026-06-09 | N/A |
| CLR — Compliance & Legal | [clr-arkived.md](clr-arkived.md) | 0.1.0 | Draft | 2026-06-09 | N/A |
| GTM — Go-To-Market | [gtm-arkived.md](gtm-arkived.md) | 0.1.0 | Draft | 2026-06-09 | N/A |
| OPS — Ops & Observability | [ops-arkived.md](ops-arkived.md) | 0.1.0 | Draft | 2026-06-09 | N/A |

### Supporting Artifacts
- [Implementation Task List](tasks-arkived.md) — The active project implementation checklist (Phases 0–7).
- [Supabase Setup Guide](setup-supabase.md) — Step-by-step database, RLS, storage, and env setup.
- [Security Hardening Runbook](setup-security.md) — RLS verification SQL + Cloudflare WAF/rate-limit setup.
- [Resend Setup Guide](setup-resend.md) — Free-tier email setup, domain verification, env vars, and Arkived notification wiring.
- [Azure + Cloudflare Deployment Guide](deploy-azure-frontdoor-cloudflare.md) — Front Door + SWA + App Service setup for `arkived.dev` and `*.arkived.dev`.
- [Cloudflare Worker Routing Guide](deploy-cloudflare-worker-routing.md) — Separate platform/storefront deployments with wildcard host routing at Cloudflare edge.

---

## 2. Change Log

Every material change to a Locked document is recorded as a Change Record. Newest first.

| CR ID | Date | Summary | Trigger doc | Docs touched | File |
|-------|------|---------|-------------|--------------|------|
| (None) | | | | | |

---

## 3. Incident Log (Postmortems)

Every P0/P1 incident gets a Postmortem. Newest first.

| PM ID | Incident date | Severity | Summary | Action items closed? | File |
|-------|---------------|----------|---------|----------------------|------|
| (None) | | | | | |

---

## 4. Health Check

Quick triage an agent runs at the start of a session. Anything that fails gets surfaced to the user.

- [ ] Every Locked doc's **Last Reconciled** date is newer than the last code change to its area.
- [ ] No doc has been in `Draft` longer than expected without movement.
- [ ] Every open Change Record has propagated to all docs listed in its "Docs touched" column.
- [ ] Feature IDs (`PRD-F#`) referenced by SDD / RFC / QAD / SAD / BUILD still exist in the PRD.
- [ ] Metric IDs (`BRD-M#`) flow to the GTM and have a feeding event in PRD §5.5.
- [ ] The SAD roster matches the materialized agent files (no orphans, no missing).
- [ ] The BUILD guide's pinned versions and golden-path samples have been re-verified recently (stale samples = stale code).
- [ ] Every open Postmortem's action items are closed (or tracked somewhere durable).

---

## 5. Notes

- This documentation index initiates the FMD framework for the Arkived project.
