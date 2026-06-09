# Product Requirements Document — Arkived

> **Version:** 1.0.0
> **Status:** Draft
> **Last Updated:** 2026-06-06
> **Author(s):** Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Target Personas](#2-target-personas)
3. [Feature Requirements](#3-feature-requirements)
   - [3.1 Multi-Tenant Core](#31-multi-tenant-core)
   - [3.2 Inventory & Asset Management](#32-inventory--asset-management)
   - [3.3 Rental & Scheduling Engine](#33-rental--scheduling-engine)
   - [3.4 Dashboards & Analytics](#34-dashboards--analytics)
4. [Technical Architecture](#4-technical-architecture)
   - [4.1 Tech Stack](#41-tech-stack)
   - [4.2 System Architecture Overview](#42-system-architecture-overview)
   - [4.3 Database Design](#43-database-design)
   - [4.4 Security & Infrastructure](#44-security--infrastructure)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Constraints & Assumptions](#6-constraints--assumptions)
7. [Out of Scope (v1.0)](#7-out-of-scope-v10)
8. [Glossary](#8-glossary)

---

## 1. Executive Summary

**Arkived** is a multi-tenant B2B SaaS platform designed to centralize equipment rental operations. It enables multiple rental businesses (tenants) to manage their inventory and scheduling within a shared, high-efficiency cloud infrastructure.

The core value proposition is built around **asset utilization optimization** — by providing real-time visibility into equipment availability and streamlining the end-to-end rental workflow, Arkived ensures that idle gear gets rented out rather than sitting in a warehouse. This directly reduces the economic pressure on businesses to purchase redundant equipment and, at scale, lessens the demand for unnecessary manufacturing.

### Problem Statement

Equipment rental businesses today suffer from:
- **Fragmented tooling** — scheduling lives in spreadsheets, inventory in notebooks, and billing in separate software.
- **Idle asset losses** — equipment that could be generating revenue sits unavailable or untracked.
- **Operational overhead** — manual tracking creates double-bookings, missed returns, and poor customer experiences.
- **High barrier to digital presence** — small-to-medium rental shops lack the resources to build and maintain a customer-facing web storefront.

### Solution

Arkived provides a unified, white-labeled SaaS platform where each tenant gets:
- A fully isolated management dashboard
- A customer-facing storefront hosted under their own subdomain (`{company}.arkived.dev`)
- Automated scheduling, payment, and notification workflows
- Real-time analytics to drive data-informed decisions

---

## 2. Target Personas

| Role | Goal | Pain Point |
|---|---|---|
| **Platform Owner** | Scalable growth & system health | Managing multi-tenant billing and server costs |
| **Tenant Admin** | Business optimization & ROI | Idle equipment and complex scheduling |
| **Tenant Staff** | Daily operational efficiency | Manual tracking and equipment double-booking |
| **End Customer** | Quick access to specialized gear | High cost of purchasing rarely used tools |

### Persona Deep Dives

#### 🏢 Platform Owner
The operator of the Arkived SaaS platform itself. Responsible for onboarding new tenants, monitoring system health, managing global billing (subscriptions), and ensuring uptime SLAs. Success is measured by tenant growth, retention rate, and platform MRR.

#### 🏪 Tenant Admin
The owner or manager of a rental business (e.g., a construction equipment shop or a media gear house). They configure their workspace, manage staff access, oversee the catalog, and review revenue analytics. Success is measured by equipment utilization rate and monthly rental revenue.

#### 👷 Tenant Staff
Day-to-day operators — the people who physically handle rentals. They check equipment in/out, update booking statuses, log maintenance events, and respond to customer inquiries. Success is measured by speed of processing bookings and zero double-bookings.

#### 🙋 End Customer
The individual or business renting equipment. They browse the tenant's storefront, check availability, make a reservation, pay, pick up (or receive) gear, and return it. Success is measured by how frictionless the experience is from discovery to return.

---

## 3. Feature Requirements

### 3.1 Multi-Tenant Core

The foundational layer of Arkived. Every other feature builds on top of this.

#### Onboarding

- **Automated Tenant Registration:** A self-serve sign-up flow where a new rental business can register, verify their email, and have a fully provisioned workspace created automatically — including a default role structure, empty catalog, and a live storefront URL.
- **Workspace Provisioning:** Upon registration, the system automatically:
  - Creates an isolated tenant record in the database
  - Creates a scoped folder path in Supabase Storage (`{tenant_id}/`) within the shared `tenant-assets` bucket — no new bucket is provisioned per tenant
  - Registers a subdomain (`{slug}.arkived.dev`) via the Cloudflare API
  - Seeds default configuration (categories, notification templates, branding defaults)
- **Onboarding Wizard:** A guided in-app setup checklist (e.g., "Add your first item", "Upload your logo", "Invite a team member") to drive activation.

#### Data Isolation

- **Row-Level Security (RLS):** All database tables containing tenant data (inventory, bookings, customers, staff, analytics) are protected by Supabase's PostgreSQL Row-Level Security policies. Every query is automatically scoped to the authenticated tenant's `tenant_id`.
- **Zero Cross-Tenant Leakage:** Tenant A can never query, reference, or accidentally access Tenant B's records, even through API manipulation. All backend API routes validate the requesting user's `tenant_id` against the resource being accessed.
- **Isolated File Storage:** Each tenant's uploaded assets (equipment images, logos) are stored in a Supabase Storage bucket with policies that restrict access by tenant identity.

#### Custom Branding

Tenants can personalize their public-facing storefront and (optionally) their management portal with:

| Setting | Description |
|---|---|
| **Shop Name** | Displayed in the storefront header, emails, and page titles |
| **Logo** | Uploaded via Supabase Storage; displayed on the storefront and admin portal header |
| **Accent Color** | Primary brand color applied to buttons, links, and key UI elements |
| **Banner Image** | Optional hero image displayed on the storefront homepage |
| **Contact Info** | Phone, email, and address shown in the storefront footer |

#### Subdomain Deployment

Each registered tenant receives a public-facing storefront hosted under the `arkived.dev` root domain.

- **Format:** `{tenant-slug}.arkived.dev` (e.g., `constructionpro.arkived.dev`, `thelenshouse.arkived.dev`)
- **Slug Rules:** Lowercase, alphanumeric, hyphens allowed, 3–32 characters, globally unique.
- **DNS:** Wildcard DNS (`*.arkived.dev`) is configured in Cloudflare, pointing all subdomain traffic to the platform's edge.
- **Routing:** App 2 reads `window.location.hostname` on load, extracts the tenant slug, and fetches that tenant's branding and catalog data from the Express.js API before rendering.
- **SSL:** Cloudflare handles TLS termination automatically for all `*.arkived.dev` subdomains via its Universal SSL offering.

---

### 3.2 Inventory & Asset Management

The source of truth for all equipment owned by a tenant.

#### Digital Catalog

Tenants can maintain a full digital inventory of their rental assets.

**CRUD Operations:**

| Operation | Description |
|---|---|
| **Create** | Add a new equipment item with all metadata |
| **Read** | View individual items and browse/filter the catalog |
| **Update** | Edit any field, update availability status, re-upload images |
| **Delete** | Soft-delete items (archived, not permanently erased) to preserve booking history |

**Equipment Record Fields:**

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Required |
| `description` | `text` | Rich text / markdown |
| `category` | `enum` | See categories below |
| `daily_rate` | `decimal` | Price per day in the tenant's currency |
| `deposit_amount` | `decimal` | Optional security deposit |
| `quantity` | `integer` | Total units owned |
| `images` | `array<url>` | Stored in Supabase Storage |
| `serial_numbers` | `array<string>` | Optional, for high-value assets |
| `condition` | `enum` | `Excellent`, `Good`, `Fair`, `Needs Repair` |
| `status` | `enum` | `Available`, `Rented`, `In Maintenance`, `Archived` |
| `tags` | `array<string>` | Freeform search tags |

**Equipment Categories (v1.0 defaults):**

- 🏗️ Construction
- 🎬 Media & Film
- 🔬 Labs & Scientific
- 🌾 Agricultural
- 🎉 Events & AV
- 🚗 Automotive
- 🏕️ Outdoor & Recreation
- 📦 General / Other

> Tenant Admins can create custom categories in addition to defaults.

#### Maintenance Tracking

Equipment servicing logs tied to individual assets.

**Maintenance Log Fields:**

| Field | Type | Notes |
|---|---|---|
| `equipment_id` | `uuid` | Reference to the equipment record |
| `service_date` | `date` | When maintenance was performed |
| `service_type` | `enum` | `Routine`, `Repair`, `Inspection`, `Cleaning` |
| `performed_by` | `string` | Technician name or vendor |
| `notes` | `text` | Free-form description of work done |
| `cost` | `decimal` | Optional cost of the service |
| `next_service_due` | `date` | Optional reminder for next scheduled maintenance |

- **Automated Status Update:** When a maintenance log is created with a `next_service_due` date, a scheduled job will set the equipment `status` to `In Maintenance` on that date if no booking is active.
- **Maintenance History View:** A full chronological log is visible on each equipment's detail page in the admin portal.

---

### 3.3 Rental & Scheduling Engine

The operational heart of the platform — handling the full lifecycle of a rental transaction.

#### Real-time Availability Calendar

A dynamic, interactive calendar view showing all equipment rental schedules.

- **Views:** Month, Week, and Day views (similar to Google Calendar UX).
- **Color Coding:**
  - 🟢 Available
  - 🔴 Rented / Booked
  - 🟡 Reserved (deposit paid, not yet dispatched)
  - 🔵 In Maintenance
- **Conflict Detection:** The backend enforces that no two bookings for the same physical unit overlap. The UI provides real-time feedback when a customer attempts to book an unavailable date range.
- **Equipment-Level Filtering:** Staff can filter the calendar by specific equipment, category, or customer.
- **Customer-Facing Availability:** The public storefront shows a simplified read-only availability view for each item so customers can self-check before inquiring.

#### Booking Workflow

A structured, status-driven pipeline for every rental transaction.

```
Reservation → Payment → Dispatch → Return → Inspection → Closed
```

| Stage | Description | Actor |
|---|---|---|
| **Reservation** | Customer or staff creates a booking for a date range. Inventory is soft-locked. | Customer / Staff |
| **Payment** | Customer pays the rental fee (and optional deposit). Booking is confirmed. | Customer (online) / Staff (in-person) |
| **Dispatch** | Equipment is physically handed over. Staff marks the item as dispatched and logs initial condition. | Staff |
| **Return** | Equipment is physically returned. Staff marks the return date. | Staff |
| **Inspection** | Staff inspects the equipment post-return and logs any damage or notes. Deposit is released or partially retained. | Staff |
| **Closed** | Booking is finalized. Analytics are updated. | System |

**Booking Record Fields:**

| Field | Type | Notes |
|---|---|---|
| `booking_id` | `uuid` | Auto-generated |
| `equipment_id` | `uuid` | The rented item |
| `customer_id` | `uuid` | The renting customer |
| `start_date` | `date` | Rental start |
| `end_date` | `date` | Rental end |
| `status` | `enum` | Workflow stage above |
| `total_amount` | `decimal` | Calculated from rate × duration |
| `deposit_paid` | `boolean` | — |
| `payment_reference` | `string` | External payment gateway ID |
| `dispatch_condition` | `text` | Staff notes at handover |
| `return_condition` | `text` | Staff notes at return/inspection |
| `overdue` | `boolean` | Set by a scheduled job |

#### Automated Notifications

Event-driven notifications keep all parties informed throughout the rental lifecycle.

| Trigger | Channel | Recipient |
|---|---|---|
| Booking confirmed | Email | Customer |
| 24h before rental start | Email + SMS | Customer |
| Rental dispatched | Email | Customer |
| 24h before return due | Email + SMS | Customer |
| Rental overdue (Day 1) | Email + SMS | Customer + Staff |
| Rental overdue (Day 3+) | Email | Tenant Admin |
| Maintenance due | Email | Tenant Admin |

- **Email Provider:** Transactional email via an SMTP provider (e.g., Resend, SendGrid). Templates are customizable per tenant with their branding.
- **SMS Provider:** Twilio (or equivalent). Optional; tenant must provide their own SMS credentials or opt into a platform-managed plan.
- **Notification Preferences:** End customers can manage their notification opt-ins in their profile.

---

### 3.4 Dashboards & Analytics

Data-driven insights for Tenant Admins to make smarter business decisions.

#### Tenant Admin Dashboard

A high-level overview displayed on the admin portal homepage.

**Key Metrics (KPIs):**

| Metric | Description |
|---|---|
| **Utilization Rate** | `(Days Rented / Total Available Days) × 100` per item or across the catalog. The primary indicator of asset efficiency. |
| **Active Bookings** | Count of currently dispatched rentals |
| **Overdue Rentals** | Count of bookings past their return date — shown prominently as an alert |
| **Revenue (MTD)** | Total confirmed rental payments in the current calendar month |
| **MRR (Monthly Recurring Revenue)** | Aggregate of all completed and active bookings for the month |

**Utilization Rate Details:**
- Visualized as a percentage bar per equipment item and as a global average.
- Benchmarked against the previous 30 days and previous month.
- Items with utilization below a configurable threshold (e.g., < 20%) are surfaced as "underperforming assets" to prompt Tenant Admins to adjust pricing or promote them.

#### Revenue Analytics

A dedicated analytics page with time-series data.

| Chart | Description |
|---|---|
| **Monthly Revenue** | Bar chart showing total rental revenue per month, last 12 months |
| **Revenue by Category** | Donut/pie chart showing revenue breakdown by equipment category |
| **Top 10 Performing Assets** | Ranked list by total revenue generated |
| **Booking Volume Trend** | Line chart showing number of bookings per week/month |
| **Average Rental Duration** | Average number of days per booking |

**Data Filters:**
- Date range picker (last 7 days, 30 days, 90 days, custom range)
- Filter by equipment category
- Filter by specific equipment item

#### Platform Owner Dashboard *(separate from Tenant dashboards)*

The Platform Owner has a super-admin view showing aggregate data across all tenants.

| Metric | Description |
|---|---|
| **Total Tenants** | Active tenant count |
| **New Tenants (MTD)** | Tenant signups in the current month |
| **Platform MRR** | Aggregate subscription revenue from all tenants |
| **Total Bookings (Platform-wide)** | Volume indicator for platform health |
| **Tenant Churn Rate** | Percentage of tenants who cancelled in the last 30 days |

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **App 1 — Platform** | [Vite](https://vitejs.dev/) + React | Serves `arkived.dev` — marketing site, tenant sign-up/login, and Platform Owner admin panel |
| **App 2 — Storefront** | [Vite](https://vitejs.dev/) + React | Serves `{slug}.arkived.dev` — each tenant's public-facing, branded equipment rental storefront |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS; each app has its own independent `tailwind.config.js` |
| **Backend API** | Node.js + [Express.js](https://expressjs.com/) | Shared REST API consumed by both Vite apps |
| **Backend Hosting** | [Azure App Service](https://azure.microsoft.com/en-us/products/app-service) | Managed PaaS for hosting the Express.js API; supports auto-scaling, deployment slots, and CI/CD integration |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Managed Postgres with built-in RLS, auth, and real-time subscriptions |
| **File Storage** | [Supabase Storage](https://supabase.com/storage) | S3-compatible, integrates natively with Supabase auth and RLS policies |
| **Authentication** | Supabase Auth | Handles JWT issuance, email/password, OAuth, and magic links |
| **DNS & Security** | [Cloudflare](https://www.cloudflare.com/) | Wildcard DNS for `*.arkived.dev`, DDoS protection, WAF, Universal SSL |
| **Email** | Resend / SendGrid | Transactional email with branded templates |
| **SMS** | Twilio | Optional SMS notifications |

### 4.2 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Cloudflare Edge                                │
│        arkived.dev + *.arkived.dev  →  WAF  →  DDoS  →  Universal SSL      │
└────────────────────┬──────────────────────────┬──────────────────────────── ┘
                     │                          │
          ┌──────────▼──────────┐    ┌──────────▼──────────┐
          │   Vite App 1         │    │   Vite App 2          │
          │   arkived.dev       │    │  {slug}.arkived.dev  │
          │                     │    │                      │
          │  • Marketing site   │    │  • Branded catalog   │
          │  • Tenant sign-up   │    │  • Equipment detail  │
          │  • Tenant login     │    │  • Availability view │
          │  • Platform Owner   │    │  • Booking inquiry   │
          │    admin panel      │    │  • Tenant branding   │
          └──────────┬──────────┘    └──────────┬───────────┘
                     │                          │
                     └──────────┬───────────────┘
                                │
                   ┌────────────▼────────────┐
                   │   Express.js API         │
                   │   (Azure App Service)    │
                   │   /api/v1/...            │
                   └────────────┬────────────┘
                                │
                   ┌────────────▼────────────┐
                   │        Supabase          │
                   │  ┌────────────────────┐  │
                   │  │  PostgreSQL + RLS  │  │
                   │  │  (Tenant data)     │  │
                   │  └────────────────────┘  │
                   │  ┌────────────────────┐  │
                   │  │  Supabase Auth     │  │
                   │  │  (JWT / Sessions)  │  │
                   │  └────────────────────┘  │
                   │  ┌────────────────────┐  │
                   │  │  Supabase Storage  │  │
                   │  │  (Images/Assets)   │  │
                   │  └────────────────────┘  │
                   └──────────────────────────┘
```

**Project Structure:**

All three parts of the platform live in a single repository under clearly named directories. There is no monorepo tooling (no Turborepo, no Nx, no workspace hoisting). Each directory is a self-contained project with its own `package.json` and is developed, built, and deployed independently.

```
arkived/
├── platform/       # App 1 — arkived.dev (Vite + React + Tailwind)
├── storefront/     # App 2 — {slug}.arkived.dev (Vite + React + Tailwind)
└── api/            # Express.js REST API (Node.js)
```

| Directory | What It Is | Deployed To |
|---|---|---|
| `platform/` | Marketing site, tenant login, admin dashboards | Static host (e.g., Vercel / Cloudflare Pages) |
| `storefront/` | Tenant-branded public equipment storefront | Static host (same or separate) |
| `api/` | Express.js REST API, shared by both frontends | Azure App Service |

> Each directory is fully standalone. `platform/` and `storefront/` do not import from each other or from `api/`. They communicate with `api/` only over HTTP.

**App 1 — Platform (`platform/` → `arkived.dev`):**
- Houses the marketing landing page, pricing, and feature overviews.
- Provides the tenant self-registration and login flow (powered by Supabase Auth).
- After authentication, Tenant Admins are redirected to their management dashboard — served within the same app under protected routes (using React Router).
- The Platform Owner accesses a super-admin panel gated by the `platform_owner` role.
- Has its own `tailwind.config.js` with the Arkived platform design tokens.

**App 2 — Storefront (`storefront/` → `{slug}.arkived.dev`):**
- Standalone Vite + React SPA — no code shared with `platform/`.
- On load, reads `window.location.hostname`, extracts the tenant slug, and calls the API to fetch that tenant's branding config and equipment catalog.
- Tenant colors are applied at runtime via injected CSS custom properties; `tailwind.config.js` is wired to read those variables.
- Publicly accessible — no login required for customers to browse.
- Meta tags managed via `react-helmet-async`.

**API (`api/` → Azure App Service):**
- Express.js REST API consumed by both `platform/` and `storefront/` over HTTP.
- All routes protected by JWT middleware (Supabase Auth tokens).
- Tenant scoping enforced on every request via JWT claims.

### 4.3 Database Design

#### Core Tables

```sql
-- Tenants
tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  logo_url     TEXT,
  accent_color TEXT DEFAULT '#6366f1',
  plan         TEXT DEFAULT 'starter',  -- e.g., starter, pro, enterprise
  created_at   TIMESTAMPTZ DEFAULT now()
)

-- Users (Staff + Admins per tenant)
users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  role       TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  full_name  TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Equipment
equipment (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL,
  daily_rate    DECIMAL(10,2) NOT NULL,
  deposit       DECIMAL(10,2) DEFAULT 0,
  quantity      INTEGER NOT NULL DEFAULT 1,
  status        TEXT DEFAULT 'available',
  condition     TEXT DEFAULT 'good',
  tags          TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ  -- soft delete
)

-- Equipment Images
equipment_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id  UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  storage_url   TEXT NOT NULL,
  is_primary    BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0
)

-- Customers (per tenant)
customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  full_name  TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Bookings
bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  equipment_id        UUID NOT NULL REFERENCES equipment(id),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'reserved',
  total_amount        DECIMAL(10,2) NOT NULL,
  deposit_paid        BOOLEAN DEFAULT false,
  payment_reference   TEXT,
  dispatch_condition  TEXT,
  return_condition    TEXT,
  overdue             BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now()
)

-- Maintenance Logs
maintenance_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  equipment_id     UUID NOT NULL REFERENCES equipment(id),
  service_date     DATE NOT NULL,
  service_type     TEXT NOT NULL,
  performed_by     TEXT,
  notes            TEXT,
  cost             DECIMAL(10,2),
  next_service_due DATE,
  created_at       TIMESTAMPTZ DEFAULT now()
)
```

#### Row-Level Security (RLS) Example

```sql
-- Enable RLS on the equipment table
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see equipment belonging to their tenant
CREATE POLICY "tenant_isolation" ON equipment
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
```

> The same pattern is applied to all tenant-scoped tables: `bookings`, `customers`, `maintenance_logs`, `equipment_images`, etc.

### 4.4 Security & Infrastructure

#### Cloudflare Configuration

| Feature | Configuration |
|---|---|
| **Wildcard DNS** | `*.arkived.dev` CNAME → platform deployment target |
| **Universal SSL** | Enabled for all `*.arkived.dev` subdomains automatically |
| **WAF (Web Application Firewall)** | Managed rulesets enabled; OWASP Core Ruleset active |
| **DDoS Protection** | Cloudflare's L3/L4/L7 DDoS mitigation is on by default |
| **Rate Limiting** | Custom rate limiting rules on `/api/*` routes (e.g., 100 req/min per IP) |
| **Bot Management** | Bot Fight Mode enabled to block malicious crawlers |
| **Turnstile (CAPTCHA)** | Cloudflare Turnstile on sign-up and login forms |

#### Authentication & Authorization

- **Auth Provider:** Supabase Auth handles all session management, JWT issuance, and token refresh.
- **Roles:** `platform_owner`, `tenant_admin`, `tenant_staff` — enforced at both the API middleware layer and via Supabase RLS policies.
- **JWT Claims:** Custom Supabase JWT claims include `tenant_id` and `role`, enabling fine-grained RLS policies without additional DB lookups.
- **Session Management:** Short-lived access tokens (1 hour) + refresh tokens. HTTPS-only, `HttpOnly` cookie storage.

#### API Security (Express.js)

- All routes protected by JWT validation middleware.
- Tenant ID extracted from JWT claims and injected into every database query.
- Input validation via `zod` schemas on all request bodies.
- `helmet.js` for standard HTTP security headers.
- CORS configured to allow only `*.arkived.dev` and `arkived.dev` origins.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Public storefront pages must achieve a Lighthouse Performance score ≥ 85. API response times under normal load should be < 300ms (p95). |
| **Availability** | Target 99.9% uptime SLA. Platform uses Cloudflare as a global CDN to serve static assets and cached pages at the edge. |
| **Scalability** | The multi-tenant architecture must support up to 1,000 tenants on shared infrastructure without performance degradation. Supabase connection pooling (PgBouncer) is enabled. |
| **Security** | OWASP Top 10 mitigations required. All data encrypted at rest (Supabase default) and in transit (TLS 1.2+). PII handled per applicable data protection regulations. |
| **SEO** | Public storefronts are client-side rendered Vite SPAs. Meta tags (`<title>`, `<meta name="description">`) are set dynamically via `react-helmet-async`. Full SSR is out of scope for v1.0. |
| **Accessibility** | Public-facing pages must conform to WCAG 2.1 Level AA. |
| **Data Retention** | Soft-deleted records retained for 90 days before hard deletion. Booking records retained for 7 years for financial compliance. |
| **Backups** | Supabase performs daily automated backups with 7-day point-in-time recovery (PITR) on Pro plan and above. |

---

## 6. Constraints & Assumptions

### Constraints

- **Supabase Limits:** Free tier is limited to 500MB database and 1GB storage — a paid Supabase plan is required for any real-world production deployment.
- **Cloudflare Wildcard SSL:** Wildcard certificates on Cloudflare require an active SSL/TLS mode of "Full (Strict)" and the subdomain must be proxied (orange cloud).
- **Subdomain Propagation:** DNS changes may take up to 5 minutes to propagate globally via Cloudflare's anycast network.
- **SMS:** SMS notifications are optional in v1.0 and require the tenant to configure their own Twilio credentials.

### Assumptions

- All monetary values are stored in a single currency per tenant, configured during onboarding (no multi-currency in v1.0).
- The platform does not directly integrate with a payment gateway in v1.0 — payments are logged manually by staff using a `payment_reference` field. Online payment integration (e.g., Stripe) is deferred to v2.0.
- Each tenant manages their own customer records — there is no shared global customer identity across tenants.
- The Platform Owner is a single superuser account managed directly via the database/Supabase dashboard in v1.0.

---

## 7. Out of Scope (v1.0)

The following features are acknowledged but explicitly excluded from the initial release to maintain focus:

| Feature | Rationale | Target Version |
|---|---|---|
| Online Payment Integration (Stripe) | Manual payment logging is sufficient for MVP | v2.0 |
| Customer Self-Service Portal | Customers book via direct contact in v1.0 | v2.0 |
| Mobile Native Apps (iOS/Android) | Responsive web first | v3.0 |
| Multi-Currency Support | Single-currency per tenant simplifies accounting | v2.0 |
| Equipment GPS Tracking | Hardware integration is out of scope | Future |
| AI-Powered Demand Forecasting | Requires significant booking history to be useful | Future |
| Tenant Custom Domain (bring-your-own-domain) | Wildcard subdomain is sufficient for v1.0 | v2.0 |
| In-App Messaging / Live Chat | Third-party integration deferred | v2.0 |
| Public API for Third-Party Integrations | Not enough tenant demand validated yet | Future |

---

## 8. Glossary

| Term | Definition |
|---|---|
| **Tenant** | A rental business that has signed up to use the Arkived platform. Each tenant has an isolated workspace. |
| **Tenant Slug** | A unique, URL-safe identifier for a tenant used to construct their subdomain (e.g., `constructionpro` → `constructionpro.arkived.dev`). |
| **Platform Owner** | The operator of the Arkived SaaS platform itself (not a tenant). |
| **RLS (Row-Level Security)** | A PostgreSQL feature that enforces data access policies at the database row level, ensuring tenants can only access their own data. |
| **Utilization Rate** | A KPI measuring what percentage of a piece of equipment's available time is spent actively rented. Formula: `(Rented Days / Total Available Days) × 100`. |
| **MRR (Monthly Recurring Revenue)** | The predictable total revenue generated by the platform (or a tenant) in a given month from all active rentals/subscriptions. |
| **Soft Delete** | A pattern where records are marked as deleted (via a `deleted_at` timestamp) rather than permanently removed from the database, preserving historical references. |
| **SPA (Single Page Application)** | A web app architecture (used by Vite + React) where the browser loads a single HTML file and JavaScript handles all rendering and navigation client-side. |
| **WAF (Web Application Firewall)** | A security layer (provided by Cloudflare) that filters and monitors HTTP traffic to block malicious requests. |
| **PgBouncer** | A lightweight connection pooler for PostgreSQL, used by Supabase to efficiently manage database connections at scale. |

---

*This document is a living artifact. Updates will be tracked via version history in this file's header.*
