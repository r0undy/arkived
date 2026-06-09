# Implementation Plan — Arkived

> **Version:** 1.0.0
> **Status:** In Progress
> **Last Updated:** 2026-06-06
> **References:** [prd-arkived.md](./prd-arkived.md) · [dsd-arkived.md](./dsd-arkived.md)

**Legend:**
- `[ ]` Not started
- `[/]` In progress
- `[x]` Done

**Repo structure reminder:**
```
arkived/
├── platform/     # App 1 — arkived.dev
├── storefront/   # App 2 — {slug}.arkived.dev
└── api/          # Express.js REST API
```

---

## Table of Contents

- [Phase 0 — Project Setup](#phase-0--project-setup)
- [Phase 1 — API Foundation](#phase-1--api-foundation)
- [Phase 2 — Multi-Tenant Core](#phase-2--multi-tenant-core)
- [Phase 3 — Inventory & Asset Management](#phase-3--inventory--asset-management)
- [Phase 4 — Rental & Scheduling Engine](#phase-4--rental--scheduling-engine)
- [Phase 5 — Dashboards & Analytics](#phase-5--dashboards--analytics)
- [Phase 6 — Storefront App](#phase-6--storefront-app)
- [Phase 7 — Polish & Hardening](#phase-7--polish--hardening)

---

## Phase 0 — Project Setup

> Stand up all three project directories with their base tooling. No features yet — just a clean, runnable skeleton for each.

### 0.1 Repository

- [ ] Initialize git repository at the repo root
- [ ] Create `.gitignore` covering `node_modules/`, `.env*`, `dist/`, `.DS_Store`
- [ ] Create root-level `README.md` explaining the three-directory structure
- [ ] Create `.env.example` files in each of `platform/`, `storefront/`, and `api/`

---

### 0.2 `api/` — Express.js Setup

- [ ] Initialize `package.json` (`npm init`)
- [ ] Install core dependencies:
  - `express` (v5)
  - `@supabase/supabase-js`
  - `zod` (request validation)
  - `helmet` (security headers)
  - `cors`
  - `dotenv`
- [ ] Install dev dependencies:
  - `nodemon`
  - `typescript` + `ts-node` + `@types/express` (optional: use JSDoc instead)
- [ ] Create folder structure:
  ```
  api/
  ├── src/
  │   ├── index.js          # Entry point
  │   ├── config/           # Env config, Supabase client
  │   ├── middleware/        # Auth, error handler, tenant scope
  │   ├── routes/           # Route files per resource
  │   └── validators/       # Zod schemas
  ├── .env.example
  └── package.json
  ```
- [ ] Set up `src/index.js` with Express app, `helmet`, `cors`, and a health check route (`GET /health`)
- [ ] Create `src/config/supabase.js` — initialize Supabase client using env vars
- [ ] Confirm API starts with `nodemon src/index.js`

---

### 0.3 `platform/` — Vite + React + Tailwind v4 Setup

- [ ] Scaffold with Vite: `npm create vite@latest . -- --template react`
- [ ] Install Tailwind CSS v4: `npm install tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.js` to include `@tailwindcss/vite` plugin
- [ ] Create `src/index.css` with:
  ```css
  @import "tailwindcss";
  @import "@fontsource/inter";

  @theme {
    --font-sans: 'Inter', system-ui, sans-serif;
    /* Brand and neutral color tokens per DSD §2 */
  }
  ```
- [ ] Install `@fontsource/inter`
- [ ] Install `react-router-dom` (v7) for client-side routing
- [ ] Install `@supabase/supabase-js` and `@supabase/auth-ui-react`
- [ ] Create folder structure:
  ```
  platform/
  ├── src/
  │   ├── assets/
  │   ├── components/       # Shared UI components (within this app only)
  │   ├── pages/            # Route-level page components
  │   ├── layouts/          # Dashboard layout, Auth layout, Marketing layout
  │   ├── hooks/            # Custom React hooks
  │   ├── lib/              # Supabase client, API client
  │   └── main.jsx          # Entry point with router
  ├── index.html
  ├── vite.config.js
  ├── .env.example
  └── package.json
  ```
- [ ] Set up React Router with placeholder routes for `/`, `/login`, `/signup`, `/dashboard`
- [ ] Confirm app runs with `npm run dev`

---

### 0.4 `storefront/` — Vite + React + Tailwind v4 Setup

- [ ] Scaffold with Vite: `npm create vite@latest . -- --template react`
- [ ] Install Tailwind CSS v4 and `@tailwindcss/vite` plugin
- [ ] Create `src/index.css` with:
  ```css
  @import "tailwindcss";
  @import "@fontsource/inter";

  @theme {
    --font-sans: 'Inter', system-ui, sans-serif;
    /* Tenant-overrideable primary color slots */
    --color-primary: #6366f1;
    --color-primary-hover: #4f46e5;
  }
  ```
- [ ] Install `react-router-dom` for page routing within the storefront
- [ ] Create folder structure:
  ```
  storefront/
  ├── src/
  │   ├── components/
  │   ├── pages/
  │   ├── hooks/
  │   │   └── useTenant.js  # Fetches tenant branding by slug from hostname
  │   ├── lib/
  │   │   └── api.js        # API client pointing to api/
  │   └── main.jsx
  ├── index.html
  ├── vite.config.js
  ├── .env.example
  └── package.json
  ```
- [ ] Implement `useTenant.js` hook:
  - Reads `window.location.hostname`
  - Extracts the subdomain slug
  - Calls `GET /api/v1/tenant/:slug/public` to fetch branding
  - Injects CSS variable overrides into `:root` via a `<style>` tag
- [ ] Confirm app runs with `npm run dev`

---

## Phase 1 — API Foundation

> Build the shared infrastructure all routes depend on: auth middleware, error handling, and tenant scoping.

### 1.1 Supabase Project

- [ ] Create Supabase project (or use existing free-tier project)
- [ ] Save `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `api/.env`
- [ ] Save `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `platform/.env` and `storefront/.env`

### 1.2 Database Schema

- [ ] Create `tenants` table (see PRD §4.3)
- [ ] Create `users` table linked to `auth.users`
- [ ] Create `equipment` table with soft-delete (`deleted_at`)
- [ ] Create `equipment_images` table
- [ ] Create `customers` table
- [ ] Create `bookings` table
- [ ] Create `maintenance_logs` table
- [ ] Enable Row-Level Security (RLS) on all tenant-scoped tables
- [ ] Write RLS policy for each table: `tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())`
- [ ] Create a public-read policy on `tenants` for the `slug`, `name`, `logo_url`, `accent_color` columns (needed by storefront without auth)
- [ ] Create Supabase Storage bucket: `tenant-assets` with RLS scoped to `{tenant_id}/` path prefix

### 1.3 API Middleware

- [x] `src/middleware/auth.js` — verify Supabase JWT from `Authorization: Bearer` header; attach `req.user` (id, tenant_id, role)
- [x] `src/middleware/requireRole.js` — factory middleware: `requireRole('admin')`, `requireRole('platform_owner')`, etc.
- [x] `src/middleware/errorHandler.js` — global Express error handler; returns structured JSON errors
- [x] `src/middleware/notFound.js` — 404 handler for unknown routes
- [x] Apply middleware in `src/index.js`: `helmet` → `cors` → routes → `notFound` → `errorHandler`

### 1.4 API Versioning & Base Routes

- [x] Create `src/routes/index.js` mounting all route groups under `/api/v1/`
- [x] `GET /health` — returns `{ status: 'ok', timestamp }`
- [x] `GET /api/v1/tenant/:slug/public` — returns public branding data for storefront (no auth required)

---

## Phase 2 — Multi-Tenant Core

> Tenant registration, onboarding, workspace provisioning, and branding.

### 2.1 API — Tenant & Auth Routes

- [/] `POST /api/v1/auth/register` — create Supabase auth user + insert into `users` and `tenants` tables; seed default categories and notification templates; create `{tenant_id}/` folder path in `tenant-assets` storage
- [ ] `POST /api/v1/auth/login` — proxy to Supabase Auth (or handle on client directly via `@supabase/auth-ui-react`)
- [x] `GET /api/v1/me` — return current user's profile and tenant info (auth required)
- [x] `PATCH /api/v1/tenant` — update tenant branding settings (admin only): name, logo_url, accent_color, banner_image_url, contact info, show_watermark

### 2.2 API — Staff Management

- [x] `GET /api/v1/staff` — list all staff users for the tenant (admin only)
- [x] `POST /api/v1/staff/invite` — send invite email and create user record (admin only)
- [x] `DELETE /api/v1/staff/:id` — remove staff member (admin only)
- [x] `PATCH /api/v1/staff/:id/role` — change role between `admin` and `staff`

### 2.3 `platform/` — Auth Pages

- [x] **Marketing / Landing Page** (`/`) — hero section, feature highlights, CTA to sign up
- [x] **Sign Up Page** (`/signup`) — email + password + shop name + slug field; calls `POST /api/v1/auth/register`
  - [ ] Slug availability checker (debounced API call)
  - [ ] Cloudflare Turnstile CAPTCHA widget
- [x] **Login Page** (`/login`) — email + password via Supabase Auth UI or custom form
- [/] **Auth redirect logic** — after login, redirect to `/dashboard` if `tenant_admin` / `tenant_staff`, or `/admin` if `platform_owner`
- [x] **Protected route wrapper** — HOC or layout that redirects unauthenticated users to `/login`

### 2.4 `platform/` — Onboarding Wizard

- [x] **Onboarding Checklist Component** — shown after first login if setup is incomplete
  - [x] Step 1: Upload logo
  - [x] Step 2: Set accent color (with live contrast preview and WCAG pass/fail indicator)
  - [x] Step 3: Add first equipment item
  - [x] Step 4: Invite a team member
- [x] Mark steps as complete in `tenants` table via a `onboarding_completed_steps` JSON column
- [x] Dismiss wizard once all steps are done

### 2.5 `platform/` — Branding Settings Page

- [x] `/dashboard/settings/branding` route
- [x] Logo upload → Supabase Storage → save URL to `tenants.logo_url`
- [x] Accent color picker with live WCAG contrast ratio indicator (against white)
- [x] Banner image upload
- [x] Shop name, contact info fields
- [x] "Powered by Arkived" badge toggle
- [x] Live storefront preview panel (iframe or simulated preview)

### 2.6 `platform/` — Staff Management Page

- [x] `/dashboard/settings/team` route
- [x] List current team members with role badges
- [x] Invite by email form
- [x] Change role dropdown
- [x] Remove member button with confirmation dialog

---

## Phase 3 — Inventory & Asset Management

### 3.1 API — Equipment Routes

- [/] `GET /api/v1/equipment` — list all equipment (with filters: category, status, search query); paginated
- [/] `GET /api/v1/equipment/:id` — get single equipment item with images and maintenance history
- [x] `POST /api/v1/equipment` — create new equipment item (admin/staff)
- [x] `PATCH /api/v1/equipment/:id` — update equipment fields (admin/staff)
- [x] `DELETE /api/v1/equipment/:id` — soft delete (sets `deleted_at`; admin only)
- [x] `POST /api/v1/equipment/:id/images` — upload image to Supabase Storage, insert into `equipment_images`
- [x] `DELETE /api/v1/equipment/:id/images/:imageId` — delete image from storage and DB
- [x] `PATCH /api/v1/equipment/:id/images/:imageId/primary` — set as primary image

### 3.2 API — Maintenance Log Routes

- [x] `GET /api/v1/equipment/:id/maintenance` — list maintenance logs for an item
- [x] `POST /api/v1/equipment/:id/maintenance` — create maintenance log entry
- [x] `PATCH /api/v1/equipment/:id/maintenance/:logId` — update a log entry
- [x] `DELETE /api/v1/equipment/:id/maintenance/:logId` — delete a log entry

### 3.3 `platform/` — Equipment Catalog Pages

- [x] **Catalog List Page** (`/dashboard/equipment`)
  - [x] Filterable grid/table: search bar, category filter, status filter
  - [x] Equipment card with primary image, name, status badge, daily rate
  - [x] Add Equipment button → opens modal or navigates to add form
  - [x] Pagination or infinite scroll
- [x] **Equipment Detail / Edit Page** (`/dashboard/equipment/:id`)
  - [x] All fields editable inline or via edit form (name, description, category, daily rate, deposit, quantity, condition, tags)
  - [x] Image gallery with drag-to-reorder, set-primary, delete controls
  - [x] Status badge with manual override dropdown
  - [x] Maintenance log section (inline log list + add log form)
  - [x] Soft-delete (Archive) button with confirmation dialog
- [x] **Add Equipment Form** — create new equipment; validates all required fields before submit

---

## Phase 4 — Rental & Scheduling Engine

### 4.1 API — Customer Routes

- [x] `GET /api/v1/customers` — list customers (searchable by name, email, phone)
- [x] `POST /api/v1/customers` — create customer record
- [x] `PATCH /api/v1/customers/:id` — update customer details
- [x] `GET /api/v1/customers/:id/bookings` — booking history for a customer

### 4.2 API — Booking Routes

- [x] `GET /api/v1/bookings` — list bookings with filters (status, date range, equipment, customer); paginated
- [x] `GET /api/v1/bookings/:id` — get single booking with full details
- [x] `POST /api/v1/bookings` — create booking; checks date overlap conflict before inserting
- [x] `PATCH /api/v1/bookings/:id/status` — advance booking to next status stage with validation:
  - `reserved` → `payment` → `dispatched` → `returned` → `inspected` → `closed`
- [x] `PATCH /api/v1/bookings/:id` — update mutable booking fields (dispatch condition, return condition, payment reference)
- [x] `GET /api/v1/bookings/calendar` — returns bookings within a date range, formatted for calendar display
- [x] Scheduled job (cron via `node-cron`):
  - [x] Daily: flag bookings where `end_date < today` and `status != closed` as `overdue = true`
  - [x] Daily: trigger maintenance-due notifications for equipment with `next_service_due = today`

### 4.3 API — Availability Route

- [x] `GET /api/v1/equipment/:id/availability?from=&to=` — return available and booked date ranges for a given equipment item (used by storefront and admin calendar)

### 4.4 API — Notification Triggers

- [x] Create `src/lib/notify.js` — helper that sends email via Resend/SendGrid API
- [x] Trigger notifications on booking status changes:
  - [x] Booking confirmed → email customer
  - [x] Booking dispatched → email customer
  - [x] Booking overdue (Day 1) → email + SMS customer and staff
  - [x] Booking overdue (Day 3+) → email tenant admin
- [x] Scheduled notification job (cron):
  - [x] 24h before `start_date` → remind customer
  - [x] 24h before `end_date` → remind customer of return

### 4.5 `platform/` — Bookings Pages

- [x] **Bookings List Page** (`/dashboard/bookings`)
  - [x] Table with columns: Customer, Equipment, Start, End, Status badge, Actions
  - [x] Filter by status, date range, equipment, customer
  - [x] "Overdue" alert banner if any bookings are flagged overdue
  - [x] Create Booking button
- [x] **Booking Detail Page** (`/dashboard/bookings/:id`)
  - [x] Full booking info — customer, equipment, dates, amounts
  - [x] Status pipeline visualizer (step indicator showing current stage)
  - [x] Action buttons per stage: `Confirm Payment`, `Mark Dispatched`, `Mark Returned`, `Complete Inspection`, `Close Booking`
  - [x] Dispatch condition and return condition text areas (appear at appropriate stages)
  - [x] Payment reference field
- [x] **Create Booking Modal / Page**
  - [x] Customer selector (search existing or create new inline)
  - [x] Equipment selector with availability check for selected date range
  - [x] Date range picker (blocks unavailable dates)
  - [x] Auto-calculated total amount (daily rate × days)
  - [x] Deposit toggle

### 4.6 `platform/` — Availability Calendar Page

- [x] **Calendar Page** (`/dashboard/calendar`)
  - [x] Month / Week / Day views
  - [x] Color-coded events: 🟢 Available · 🔴 Rented · 🟡 Reserved · 🔵 In Maintenance
  - [x] Filter by equipment or category
  - [x] Click event → open booking detail slide-over

### 4.7 `platform/` — Customer Directory Page

- [x] `/dashboard/customers` — searchable customer list with booking count and last activity
- [x] Customer profile view with booking history timeline

---

## Phase 5 — Dashboards & Analytics

### 5.1 API — Analytics Routes

- [x] `GET /api/v1/analytics/overview` — KPIs: active bookings, overdue count, revenue MTD, utilization rate (global)
- [x] `GET /api/v1/analytics/revenue` — monthly revenue breakdown for the last 12 months
- [x] `GET /api/v1/analytics/revenue-by-category` — revenue split by equipment category
- [x] `GET /api/v1/analytics/top-equipment` — top 10 items by total revenue
- [x] `GET /api/v1/analytics/utilization` — per-equipment utilization rate; supports date range filter
- [x] `GET /api/v1/analytics/booking-volume` — booking count per week/month

### 5.2 API — Platform Owner Routes (Super-Admin)

- [x] Separate router mounted only when `req.user.role === 'platform_owner'`
- [x] `GET /api/v1/admin/tenants` — list all tenants with signup date and status
- [x] `GET /api/v1/admin/overview` — platform-wide KPIs: total tenants, new MTD, total bookings, churn rate

### 5.3 `platform/` — Tenant Admin Dashboard

- [x] **Dashboard Home** (`/dashboard`)
  - [x] KPI cards: Utilization Rate, Active Bookings, Overdue Rentals (alert style), Revenue MTD
  - [x] Quick actions: `+ Add Equipment`, `+ New Booking`, `View Calendar`
  - [x] Recent bookings table (last 5)
  - [x] Underperforming assets list (utilization < 20%)
- [x] **Analytics Page** (`/dashboard/analytics`)
  - [x] Date range picker (7d / 30d / 90d / custom)
  - [x] Monthly Revenue bar chart (last 12 months)
  - [x] Revenue by Category donut chart
  - [x] Top 10 Performing Assets ranked list
  - [x] Booking Volume Trend line chart
  - [x] Average Rental Duration stat card

### 5.4 `platform/` — Platform Owner Admin Panel

- [x] `/admin` route (gated by `platform_owner` role)
- [x] Platform KPI cards: Total Tenants, New This Month, Total Bookings, Churn Rate
- [x] Tenant list table: name, slug, plan, signup date, status

---

## Phase 6 — Storefront App

> The public-facing tenant storefront (`{slug}.arkived.dev`). Completely standalone from `platform/`.

### 6.1 Tenant Resolution & Theming

- [x] `useTenant` hook fully implemented:
  - [x] Extracts slug from `window.location.hostname` (first subdomain segment)
  - [x] Falls back to a `?tenant=` query param for local dev
  - [x] Calls `GET /api/v1/tenant/:slug/public`
  - [x] On success: injects CSS variable overrides into `:root` (`--color-primary`, `--color-primary-hover`)
  - [x] On error (tenant not found): renders a 404 page
- [x] Loading state: full-page skeleton while tenant config loads
- [x] "Powered by Arkived" badge component (conditionally rendered based on `show_watermark` flag from API)

### 6.2 Storefront Pages

- [x] **Homepage** (`/`)
  - [x] Hero section: tenant banner image, shop name, tagline
  - [x] Equipment category grid (links to filtered catalog)
  - [x] Featured / recently added equipment carousel
  - [x] Contact info footer
- [x] **Catalog Page** (`/catalog`)
  - [x] Equipment grid with search bar and category filter chips
  - [x] Equipment card: primary image, name, condition badge, daily rate
  - [x] Pagination
- [x] **Equipment Detail Page** (`/catalog/:id`)
  - [x] Image gallery (primary + thumbnails)
  - [x] Name, description, category, condition, daily rate, deposit amount
  - [x] Read-only availability calendar (highlights unavailable date ranges)
  - [x] Inquiry / booking request form (name, email, phone, desired dates, message)
    - [x] On submit: creates a `reserved` booking record via `POST /api/v1/bookings/inquiry` (unauthenticated public endpoint)
  - [x] Related equipment section (same category)
- [x] **404 Page** — shown for invalid tenant slugs or unknown routes

### 6.3 Storefront SEO (React 19 Native)

- [x] Use React 19's native document metadata hoisting — render `<title>` and `<meta>` tags directly in page components; no external library needed
- [x] Each page sets a unique `<title>` using the tenant's shop name: e.g., `"Drill Press — ConstructionPro Rentals"`
- [x] `<meta name="description">` set per page
- [x] `<link rel="canonical">` on all pages

---

## Phase 7 — Polish & Hardening

### 7.1 Security

- [ ] Confirm `helmet` is configured with appropriate CSP headers in `api/`
- [ ] Confirm CORS allows only `arkived.dev` and `*.arkived.dev`
- [ ] Confirm all Express routes have Zod validation on request bodies
- [ ] Confirm RLS is enabled and tested on all Supabase tables — write test queries as a non-owner user to verify isolation
- [ ] Set up Cloudflare WAF managed ruleset
- [ ] Set up Cloudflare rate limiting on `/api/*`
- [ ] Add Cloudflare Turnstile to `platform/` sign-up and login pages

### 7.2 Error Handling & Edge Cases

- [ ] API: global error handler returns `{ error: { message, code } }` — never leaks stack traces in production
- [ ] `platform/`: global error boundary component wrapping the router
- [ ] `storefront/`: loading and error states for all async data fetches
- [ ] Handle booking conflict gracefully: if double-booking attempted, return clear 409 error with message
- [ ] Handle Supabase Storage upload failures with retry UI

### 7.3 Accessibility (WCAG 2.1 AA)

- [ ] All interactive elements keyboard-accessible and have visible focus rings
- [ ] All images have meaningful `alt` text
- [ ] All form inputs have associated `<label>` elements
- [ ] Color contrast checked for all text/background combinations (use DSD §2.5 as reference)
- [ ] Status badges and icons are not color-only — include text labels

### 7.4 Performance

- [ ] `platform/`: lazy-load route components with `React.lazy` + `<Suspense>`
- [ ] `storefront/`: lazy-load catalog images with `loading="lazy"` attribute
- [ ] `api/`: add database indexes on commonly queried columns (`tenant_id`, `status`, `start_date`, `end_date`)
- [ ] Confirm Supabase connection pooling (PgBouncer) is enabled on the project

### 7.5 Environment & Deployment

- [ ] `platform/.env.example` — `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] `storefront/.env.example` — `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] `api/.env.example` — `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`, `RESEND_API_KEY`, `TWILIO_*`
- [ ] Deploy `api/` to Azure App Service; set environment variables
- [ ] Deploy `platform/` to static host (Vercel / Cloudflare Pages); set `VITE_*` env vars
- [ ] Deploy `storefront/` to static host; configure wildcard domain `*.arkived.dev`
- [ ] Verify Cloudflare wildcard DNS (`*.arkived.dev` → storefront deployment)
- [ ] Smoke-test full flow end-to-end: sign up → onboard → add equipment → create booking → advance through all stages

---

*This document is a living artifact. Check off tasks as they are completed and update statuses accordingly.*
