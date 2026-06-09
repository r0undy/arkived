# Go-To-Market (GTM) Strategy — Arkived

**Project:** Arkived
**Date:** 2026-06-09
**Version:** 0.1.0
**Owner:** Regalia Council
**Status:** Draft
**Last reconciled:** 2026-06-09
**PRD:** [prd-arkived.md](prd-arkived.md)

---

## 1. Product Summary (GTM View)

**What it does (one sentence):** A multi-tenant B2B SaaS platform that helps equipment rental businesses manage inventory, scheduling, and spin up branded storefronts.

**Who it's for:** Small-to-medium equipment rental businesses (construction gear, camera/AV rental houses, event suppliers) looking to optimize asset utilization and digitize operations.

**Core value proposition:** Stop double-bookings, automate rental schedules, and publish a tenant-branded rental catalog in minutes.

**Category:** B2B SaaS, Inventory & Rental Operations Management.

---

## 2. Target Audience

**Primary ICP (Ideal Customer Profile):**
- *Who:* Owners and operations managers of local rental equipment shops (AV houses, tool rental, event supplies) with 10–250 high-value items.
- *Where they hang out:* Industry forums, local business groups, Reddit (r/smallbusiness, r/AV), and industry trade shows.
- *What they already believe:* Booking calendars are difficult to manage in spreadsheets; building custom websites is too expensive.
- *What will make them try this:* A 14-day free trial showing how easy it is to spin up their branded `{company}.arkived.dev` storefront.

**Secondary audience:**
- *Who:* Independent freelancers renting out personal equipment (camera gear, specialist construction tools) to colleagues.

---

## 3. Pricing Model

**Model:** Freemium / Tiered Subscription

| Tier | Price | What's Included | Limit / Gate |
|------|-------|-----------------|-------------|
| Starter | $29/mo | 1 admin seat, branded storefront, inventory management | Up to 50 active inventory items |
| Pro | $99/mo | Unlimited staff seats, Custom domain (v2.0), advanced metrics | Unlimited inventory items |
| Enterprise | Custom | Dedicated support, SLA, custom category templates | Large rental firms |

**Pricing rationale:** A lower Starter tier ($29/mo) lowers the barrier to entry for small shops. The 50-item limit acts as the upgrade trigger, naturally converting successful growing businesses to the Pro tier.

**Payment processor:** Stripe (logged manually in v1.0 MVP, integrated for subscription billing in v2.0).

---

## 4. Positioning & Messaging

**Tagline:** *Rent smarter. Grow faster.*

**Primary message (for landing page hero):**
*Run your rental shop from a single dashboard. Manage inventory, avoid double-bookings, and spin up a custom storefront under your own domain.*

**Proof points:**
- Multi-tenant data isolation ensures your client database and schedules are entirely private.
- Zero code setup: enter your inventory and branding, and your storefront goes live immediately.
- Interactive, conflict-free booking calendar prevents double-booking disputes.

---

## 5. Launch Channels & Tactics

**Owned channels:**
- Platform Marketing Site: High-converting landing page showcasing dynamic storefront templates.
- Product Demo Video: A 90-second run-through showing onboarding to live storefront deployment.

**Earned channels:**
- Product Hunt: Targeted launch focusing on "No-Code Shop Generator for Rental Businesses."
- Indie Hacker communities: Story sharing of building a vertical-specific multi-tenant SaaS.

---

## 6. Launch Phases

| Phase | Criteria to Enter | Target Date | Goal |
|-------|------------------|-------------|------|
| **Alpha** (Private) | Core API & dashboards operational (Phase 3 complete). | 2026-06-30 | 5 test tenants onboarded; database isolation verified. |
| **Beta** (Public) | Core booking engine and dynamic storefronts live (Phase 6 complete). | 2026-07-15 | 20 active trials; feedback gathered on storefront usability. |
| **Public Launch** | All P0/P1 bugs resolved, **CLR cleared** (no open Section 3 flags). | 2026-08-01 | 100 signups within 30 days. |

---

## 7. Success Metrics (30-day post-launch)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Active Tenants | 50 signups | Database count of `tenants` where status is active. |
| Activated Storefronts | > 60% of signups | Count of tenants who completed onboarding and added >= 3 equipment items. |
| Daily Active Staff | 150 daily users | Track session authentication tokens. |
| Retention | > 85% week 4 retention | Cohort usage analysis. |
