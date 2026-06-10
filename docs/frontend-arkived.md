# Frontend Experience Roadmap — Arkived

> **Version:** 1.11.0
> **Status:** In Progress
> **Last Updated:** 2026-06-10
> **Owner:** Regalia Council
> **References:** [prd-arkived.md](./prd-arkived.md) · [dsd-arkived.md](./dsd-arkived.md) · [sdd-arkived.md](./sdd-arkived.md) · [tasks-arkived.md](./tasks-arkived.md)

A focused plan to elevate the Arkived frontend into a **modern, minimalistic, and interactive** experience. Where [tasks-arkived.md](./tasks-arkived.md) tracks *what gets built*, this roadmap defines *how it should look, feel, and convert*. Every item here is additive polish on top of an already-functional app.

**Legend:**
- `[ ]` Not started
- `[/]` In progress
- `[x]` Done

**Apps in scope:**
```
platform/    # App 1 — arkived.dev (marketing, onboarding, dashboard, admin)
storefront/  # App 2 — {slug}.arkived.dev (public, tenant-branded, conversion-focused)
api/         # Supporting endpoints (storage signing, logo presets, branding)
```

## Progress Snapshot — 2026-06-10

| Phase | Status | Notes |
|---|---|---|
| F0 — Foundation & primitives | ✅ Done | Full UI kit, responsive layouts, Lucide + wordmark, `Tooltip` + `Tabs` shipped. |
| F1 — Onboarding | ✅ Done | `/welcome` wizard, persistent activation widget + floating launcher, empty states, confetti + toast at 100%. |
| F2 — Branding studio | ✅ Done | Split-screen live preview, AA meter, banner, metadata/favicon, reset-to-saved, live social-card preview. Business hours/social links pending. |
| F3 — Logo picker | ✅ Done | 12 recolorable presets + customizer. Preset-persistence API optional/pending. |
| F4 — Supabase storage | ✅ Done | Shared uploader + compression, storefront detail lightbox. Platform multi-image drag-reorder pending. |
| F5 — Captivating storefront | ✅ Done | Hero, sections, catalog/detail, metadata/SEO, JSON-LD, social proof, sticky CTA, share, recently-viewed. |
| F6 — Dashboard polish | ✅ Done | KPI sparklines, badges, new-inquiry highlight, card/table toggle, skeleton loading, calendar polish, consistent Team/Customers tables + detail. Admin primitive adoption pending. |
| F7 — Motion/a11y/perf/responsive | 🟡 Ongoing | Lazy routes/images, theme preload, mobile-first, global reduced-motion guard, focus rings, alt text, label/aria-describedby associations. Responsive verification sweep continuing. |
| F8 — Connectivity | ✅ Done | Inquiry→booking, new-request signals, maintenance reflection, calendar parity, customer status-tracking page. |

> Builds: `platform` and `storefront` both compile clean with no Vite warnings under Node v25.8.2.


---

## Table of Contents

- [North Star & Design Principles](#north-star--design-principles)
- [Backend Impact & Scope](#backend-impact--scope)
- [Phase F0 — Design Foundation & Shared Primitives](#phase-f0--design-foundation--shared-primitives)
- [Phase F1 — Onboarding That You Can't Miss](#phase-f1--onboarding-that-you-cant-miss)
- [Phase F2 — Interactive Branding Studio](#phase-f2--interactive-branding-studio)
- [Phase F3 — Logo Picker & Color Customizer](#phase-f3--logo-picker--color-customizer)
- [Phase F4 — Supabase Storage for Images](#phase-f4--supabase-storage-for-images)
- [Phase F5 — The Captivating Storefront](#phase-f5--the-captivating-storefront)
- [Phase F6 — Dashboard & Platform Polish](#phase-f6--dashboard--platform-polish)
- [Phase F7 — Motion, Accessibility, Performance & Responsiveness](#phase-f7--motion-accessibility-performance--responsiveness)
- [Phase F8 — Storefront ↔ Platform Connectivity](#phase-f8--storefront--platform-connectivity)
- [Acceptance & Definition of Done](#acceptance--definition-of-done)

---

## North Star & Design Principles

> **The feeling:** *Quietly premium.* Clean dark surfaces, generous whitespace, one confident accent color, and motion that confirms — never decorates.

| Principle | What it means in practice |
|---|---|
| **Modern minimalism** | Fewer borders, more space. Lean on the DSD surface hierarchy (`neutral-900` → `neutral-800` → `neutral-750`) instead of heavy dividers. One primary action per view. |
| **In-your-face guidance** | The next best action is always the loudest thing on screen. Onboarding is a persistent, unavoidable companion until activation is complete. |
| **Interactive by default** | Every customization shows a **live preview**. No "save and pray" — the user sees the result as they type, drag, or pick. |
| **Conversion-first storefront** | The storefront exists to *sell rentals*. Every section earns its place by building trust, showing value, or removing friction from the inquiry. |
| **Responsive by default** | Every view is designed mobile-first and verified across phone, tablet, and desktop. Layouts reflow gracefully — no horizontal scroll, no clipped controls, touch targets ≥ 44px. Most rental browsing happens on phones. |
| **Consistency** | App 1 uses the fixed Arkived dark theme ([dsd §2](./dsd-arkived.md#2-color-system)). App 2 is fully tenant-themed via CSS variables ([dsd §8](./dsd-arkived.md#8-app-2-theming-system)). Never mix the two token systems. |

**Reference stack (do not regress):** React 19 native metadata, Tailwind v4 `@theme` (no JS config), Lucide icons, `prefers-reduced-motion` guards. See [AGENTS.md](../AGENTS.md) §3.

---

## Backend Impact & Scope

> **Does this roadmap tamper with backend logic? No.** This is a **frontend-only** roadmap. Every interaction it describes is satisfied by endpoints that **already exist** in `api/`. The work is presentation, interaction, and wiring the UI to those endpoints — not changing business rules, RLS, or data models.

### Already-built endpoints this roadmap consumes (no changes needed)

| Capability | Existing endpoint | Notes |
|---|---|---|
| Tenant branding + theme | `GET /api/v1/tenant/:slug/public` | Drives storefront colors, logo, name, watermark |
| Storefront catalog | `GET /api/v1/storefront/:slug/catalog` | Equipment list for the public site |
| Equipment detail | `GET /api/v1/storefront/:slug/catalog/:equipmentId` | Detail page |
| **Live availability** | `GET /api/v1/storefront/:slug/catalog/:equipmentId/availability` | Already reads the shared bookings calendar ([storefront.js](../api/src/routes/storefront.js)) |
| **Public inquiry → real booking** | `POST /api/v1/bookings/inquiry` | Creates a `reserved` booking **and** a customer record in the tenant's data ([bookings.js](../api/src/routes/bookings.js)) |
| Platform bookings + calendar | `GET /api/v1/bookings`, `GET /api/v1/bookings/calendar` | Dashboard + calendar views |
| Booking status pipeline | `PATCH /api/v1/bookings/:id/status` | `reserved → payment → dispatched → returned → inspected → closed` |
| Equipment status (incl. maintenance) | `GET/POST/PATCH /api/v1/equipment...` | Status enum: `available · rented · maintenance · archived` |
| Asset uploads | Supabase Storage `tenant-assets` bucket | Tenant-scoped RLS already in [003_storage.sql](../supabase/sql/003_storage.sql) |

**Conclusion:** The storefront is *already* connected to the platform through a shared database and these endpoints. A storefront inquiry instantly becomes a booking the operator sees in the dashboard; equipment marked `maintenance` already affects availability; the availability endpoint already reflects platform bookings. [Phase F8](#phase-f8--storefront--platform-connectivity) just makes this flow **visible and polished** in the UI.

### Optional, non-breaking backend enhancements (only if we choose to)

These are *additive* — they don't alter existing logic. Flagged so a backend owner can opt in:

- [ ] `GET /api/v1/branding/logo-presets` — serve the logo preset library metadata ([F3.3](#f33-api-support))
- [x] Persist favicon + meta fields on the tenant (`favicon_url`, `meta_description`, `og_image_url`, `tagline`) for [metadata/favicon customization](#f24-metadata--favicon-source-platform) — added additively (migration `006_branding_metadata.sql` + validators + repositories), no existing logic changed
- [x] Public booking-status lookup by reference + email (read-only) to power a customer "track my request" page ([F8.4](#f84-customer-status-tracking-storefront)) — added additively as `GET /api/v1/storefront/:slug/track` (requires unguessable UUID + matching email, generic 404 to prevent enumeration); no existing logic changed
- [ ] Lightweight `updated_at`/polling or webhook hint so the dashboard can surface new inquiries in near-real-time ([F8.2](#f82-new-inquiry-signals-platform)) — *frontend ships a lightweight polling fallback in the meantime*

> If a backend change is **not** opted into, the corresponding frontend item degrades gracefully (e.g., logo presets ship as a static bundled manifest; favicon falls back to the logo; status tracking is hidden). **No frontend item hard-depends on a backend change.**

---

## Phase F0 — Design Foundation & Shared Primitives

> Build the reusable building blocks first so every later phase composes from a consistent kit. No feature should hand-roll a button or card.

### F0.1 Component primitives (`platform/src/components/ui/`)

- [x] `Button` — variants: `primary`, `secondary`, `ghost`, `danger`; sizes `sm`/`md`/`lg`; built-in loading spinner + disabled states; micro-interaction (`hover: -translate-y-px`, `active: translate-y-0`) per [dsd §7.3](./dsd-arkived.md#73-micro-interaction-patterns)
- [x] `Card` — raised surface (`bg-neutral-800`), optional hover-lift, optional header/footer slots
- [x] `Field` / `Input` / `Textarea` / `Select` — inset surface (`bg-neutral-950`), brand focus ring, label + helper + error message slots
- [x] `Badge` — semantic variants (success/warning/danger/info) that are **never color-only** (always include a label/icon)
- [x] `Modal` / `Drawer` — scale-from-`0.96` entrance, focus trap, `Esc` to close, backdrop blur
- [x] `Toast` — bottom-right, auto-dismiss, slide-in/slide-out (success/error/info)
- [x] `Skeleton` — shimmer loader primitives (text line, card, avatar, image) to replace spinners
- [x] `EmptyState` — icon + headline + body + primary action, per [dsd §9.2](./dsd-arkived.md#92-ui-copy-conventions)
- [x] `Tooltip`, `Tabs`, `Stepper`, `ProgressRing`, `Switch` (toggle) — `Tooltip`, `Tabs`, `ProgressRing`, `Switch`, and an inline `Stepper` (welcome wizard) all shipped

### F0.2 Layout polish

- [x] Refine `DashboardLayout` — collapsible 240px → 64px sidebar with smooth width transition; active nav item gets the slide-in fill ([dsd §7.3](./dsd-arkived.md#73-micro-interaction-patterns))
- [/] Sticky, slim top bar with breadcrumb + global search + user menu — sticky top bar + user avatar shipped; breadcrumb/global search pending
- [x] Consistent page header pattern: `<h1>` + subtitle + right-aligned primary action slot
- [x] Responsive: sidebar collapses to a bottom tab bar / drawer on mobile

### F0.3 Iconography & assets

- [x] Standardize on Lucide everywhere (`stroke-width: 1.5`); remove any ad-hoc inline SVGs
- [x] Ship the Arkived logo mark + wordmark as inline SVG components (light + monochrome variants per [dsd §1.2](./dsd-arkived.md#12-brand-name--wordmark))

---

## Phase F1 — Onboarding That You Can't Miss

> **Goal:** A brand-new tenant cannot get lost. The path to "your storefront is live" is loud, guided, and rewarding. Activation = logo set + accent chosen + first item added.

### F1.1 Full-screen welcome wizard (post-signup)

- [x] On first login (tenant has zero equipment **and** default branding), route to a dedicated full-screen `/welcome` wizard — not a dismissible tooltip
- [x] Multi-step `Stepper` with 3–4 steps, large type, one decision per screen:
  1. **Name your shop & claim your URL** — live `{slug}.arkived.dev` preview that updates as they type
  2. **Pick a look** — choose a logo preset + accent color (hands off to [Phase F3](#phase-f3--logo-picker--color-customizer)) with a live storefront mini-preview
  3. **Add your first item** — streamlined single-item form (name, category, daily rate, one photo)
  4. **You're live 🎉** — confetti moment + a prominent "View my storefront" button opening the real subdomain
- [x] Progress is **persisted** (resume where they left off); steps can be skipped but are visibly marked incomplete
- [x] Copy follows the encouraging voice in [dsd §9.1](./dsd-arkived.md#91-brand-voice-attributes) ("You're all set. Your storefront is live.")

### F1.2 Persistent activation checklist (can't be ignored)

- [x] A docked **"Get started" widget** pinned to the dashboard (top of `DashboardHomePage` + a floating launcher button) showing a `ProgressRing` with % complete — docked widget + floating launcher (popover checklist, hides at 100%) shipped
- [x] Checklist items with live completion detection:
  - [x] Upload your logo
  - [x] Choose your accent color
  - [x] Add your first item
  - [x] Set contact details
  - [x] Invite a team member *(optional)*
  - [x] Share your storefront link
- [x] Each item deep-links to the exact page/field that completes it
- [x] The widget stays visible (and gently pulses the next action) until 100%, then collapses into a subtle "Setup complete ✓" state
- [x] Celebratory toast + subtle confetti when the checklist hits 100%

### F1.3 Empty states as onboarding

- [x] Every primary list (Equipment, Bookings, Customers, Team) ships a purposeful `EmptyState` that explains *why it's empty* and offers the **one** action to fix it ([dsd §9.2](./dsd-arkived.md#92-ui-copy-conventions))
- [x] Equipment empty state doubles as a shortcut into the "add first item" flow

---

## Phase F2 — Interactive Branding Studio

> Replace the current static [BrandingPage](../platform/src/pages/BrandingPage.jsx) form with a **split-screen studio**: controls on the left, a true-to-life storefront preview on the right that updates in real time.

### F2.1 Split-screen live preview

- [x] Left rail: branding controls (logo, accent, banner, shop name, contact, watermark toggle)
- [x] Right rail: a **live storefront preview** (embedded mini-render of the real storefront hero + a sample equipment card) reflecting every change instantly — no save required to preview
- [x] Device toggle on the preview: **Desktop / Mobile** frames
- [x] "Reset to last saved" and an explicit `Save changes` (preview is optimistic; persistence is deliberate) — dirty-state tracking + instant revert-to-saved snapshot + unsaved-changes indicator shipped

### F2.2 Accent color, made delightful

- [x] Interactive color picker with: curated swatch palette, hex input, and an eyedropper (where supported)
- [x] **Live WCAG AA contrast meter** (reuse the existing `contrastRatio` logic in [BrandingPage](../platform/src/pages/BrandingPage.jsx)) with a pass/fail pill and a plain-language hint ("Great contrast" / "Too light — text may be hard to read")
- [x] Auto-derive `accent_hover` (darken ~10%) and show both swatches
- [x] Block save (with a friendly inline message) when contrast fails AA per [dsd §8.4](./dsd-arkived.md#84-branding-validation-rules)

### F2.3 Banner & polish

- [x] Drag-and-drop banner upload with crop/preview to the recommended 1440×560 ratio ([dsd §8.4](./dsd-arkived.md#84-branding-validation-rules))
- [x] Graceful default: branded gradient when no banner is set
- [x] "Powered by Arkived" watermark toggle shows a live before/after in the preview

### F2.4 Metadata & favicon source (platform)

> Where the tenant *defines* how their storefront appears in browser tabs, search results, and social shares. The storefront *renders* these in [F5.5](#f55-storefront-metadata-favicon--seo).

- [x] **Favicon:** auto-generate a favicon from the chosen logo preset/upload (render the SVG mark on the accent color to PNG/ICO sizes: 16/32/180/512); allow a dedicated favicon override. Live tab-preview mockup in the studio
- [x] **SEO metadata:** editable storefront meta `title` template and `meta_description`, with character counters and a live Google-result preview snippet
- [/] **Social sharing (Open Graph / Twitter):** editable OG image (defaults to banner or logo-on-accent), OG title/description, with a live social-card preview — OG image field persisted; live social-card preview (1200×630 mockup mirroring the storefront OG fallback chain) shipped
- [/] **Optional fields:** business hours, address/map link, and social links (used in storefront footer + structured data) — address/contact shipped; hours + social links pending
- [x] All fields validated + persisted via tenant branding (see optional backend fields in [Backend Impact](#backend-impact--scope)); graceful fallbacks when unset (favicon → logo, OG image → banner)

---

## Phase F3 — Logo Picker & Color Customizer

> Most tenants don't have a logo. Give them a beautiful starting point: a gallery of **pre-saved logo presets** they can pick and recolor to match their accent — no designer required.

### F3.1 Logo preset library

- [x] Curate **12–20 SVG logo marks** (geometric, abstract, category-themed: tools, cameras, party, outdoor, audio, etc.) stored as inline/parameterized SVGs
- [x] Presets are **monochrome + recolorable** — they use `currentColor` / a single fill slot so the chosen accent applies instantly
- [x] Gallery grid in the Branding studio + Onboarding step: hover to preview, click to select
- [x] Each preset pairs the mark with the tenant's shop name to form a quick wordmark lockup

### F3.2 Recolor & customize

- [x] Selecting a preset opens a customizer: pick fill color (defaults to accent), optional background shape (none / rounded square / circle), and a light/dark variant
- [x] Live preview of the logo on both light and dark surfaces (so it works in the dashboard header *and* storefront)
- [x] "Use this logo" rasterizes/stores the chosen SVG (see [F4](#phase-f4--supabase-storage-for-images)) and sets `logo_url`
- [x] Users can still upload their own file — presets are the *fast path*, not the only path

### F3.3 API support

- [ ] `GET /api/v1/branding/logo-presets` returns preset metadata (id, name, svg/source, recolorable slots) — see [sdd](./sdd-arkived.md) *(optional; presets currently ship as a static bundled manifest)*
- [ ] Store the chosen preset id + customization (fill, shape, variant) on the tenant so the logo can be regenerated/edited later

---

## Phase F4 — Supabase Storage for Images

> Equipment photos and logos live in the `tenant-assets` Supabase Storage bucket (already provisioned with tenant-scoped RLS in [003_storage.sql](../supabase/sql/003_storage.sql)). Make uploading effortless and the surrounding UX bulletproof.

### F4.1 Reusable `ImageUploader` component

- [x] Single shared `ImageUploader` used by Equipment, Branding logo, and Branding banner
- [x] Drag-and-drop **and** click-to-browse; paste-from-clipboard bonus
- [x] Client-side validation before upload: type + size per asset rules ([dsd §8.4](./dsd-arkived.md#84-branding-validation-rules)) — logo PNG/SVG ≤2MB, banner JPEG/WebP ≤5MB, equipment images per spec
- [x] Upload progress bar + thumbnail preview; client-side downscale/compress large images before upload
- [x] Stores under the tenant prefix `${tenant_id}/...` to satisfy the storage RLS policy ([003_storage.sql](../supabase/sql/003_storage.sql)); resolves and persists the public URL

### F4.2 Equipment images

- [x] Equipment create/edit supports **multiple images** with a drag-to-reorder gallery; first image = primary — optimistic drag-reorder + arrow-key/touch fallback + primary/delete shipped
- [x] Equipment cards (dashboard + storefront) show real photos with `loading="lazy"` and a branded placeholder when none exist
- [x] Equipment detail page: primary image + thumbnail strip with lightbox — storefront detail has thumbnail strip + zoom lightbox

### F4.3 Resilience (already partially in place)

- [x] Keep + standardize the existing **retry-on-failure** UX from [BrandingPage](../platform/src/pages/BrandingPage.jsx) (`lastFailedUpload`) inside the shared uploader
- [x] Clear, specific error copy on failure; never lose the user's other unsaved edits
- [ ] Optional: soft-delete orphaned assets when an image is replaced (respect [AGENTS.md](../AGENTS.md) soft-deletion guidance)

---

## Phase F5 — The Captivating Storefront

> **Goal:** Make `{slug}.arkived.dev` feel like a storefront a real customer wants to *buy from*. Marketing-grade hero, trust signals, frictionless inquiry. All within the tenant's own theme ([dsd §8](./dsd-arkived.md#8-app-2-theming-system)).

### F5.1 Hero that sells

- [x] Redesign the [storefront HomePage](../storefront/src/pages/HomePage.jsx) hero: full-bleed banner with a soft gradient scrim for legibility, logo lockup, shop name, a value-prop tagline, and a high-contrast primary CTA ("Browse the catalog")
- [x] Secondary CTA for inquiries ("Request a quote") and a quick-search field
- [x] Subtle parallax / fade-in on scroll (motion-reduced safe) — fade-in + scroll parallax on the hero banner shipped (rAF-throttled, disabled under `prefers-reduced-motion`)
- [x] Trust strip directly under the hero: # items available, response time, location, years in business (whatever the tenant provides)

### F5.2 Conversion-focused sections

- [x] **Category showcase** — visual cards with representative imagery, not plain pills
- [x] **Featured / popular equipment** — rich cards: real photo, name, condition badge, daily rate, availability hint, hover-lift, quick "Inquire" affordance
- [x] **How it works** — a 3-step "Browse → Request → Pick up" strip to reduce perceived friction
- [x] **Social proof** — testimonials / ratings block (graceful when empty)
- [x] **Final CTA band** — accent-colored call-to-action before the footer
- [x] Rich, branded footer: contact, hours, map/address, social, and the conditional "Powered by Arkived" badge ([PoweredByArkivedBadge](../storefront/src/components/PoweredByArkivedBadge.jsx))

### F5.3 Catalog & detail glow-up

- [x] Catalog: refined card grid, sticky search + category chips, condition/price filters, empty + loading skeletons
- [x] Equipment detail: image gallery/lightbox, clear pricing & deposit, read-only availability calendar, related items — gallery + lightbox + pricing + availability + recently-viewed shipped
- [x] **Availability-aware date picker:** the inquiry date range consumes `GET /storefront/:slug/catalog/:id/availability` so already-booked / maintenance dates are visibly disabled before submit — preventing the `409 BOOKING_CONFLICT` round-trip
- [x] **Inquiry form as the star**: prominent, low-friction, inline validation, live price estimate (days × daily rate + deposit), instant success state with the booking reference and clear next steps; never leaves the user guessing ([dsd §9.2](./dsd-arkived.md#92-ui-copy-conventions))
- [x] Out-of-stock / in-maintenance items show a clear, on-brand "Currently unavailable" state instead of a dead-end

### F5.4 Storefront fundamentals

- [x] Mobile-first responsive across all sections (most rental browsing is mobile)
- [x] Theming strictly via `--color-primary` / `--color-primary-hover` injected at runtime ([dsd §8.2](./dsd-arkived.md#82-how-theming-is-applied)); never reference App 1 brand tokens
- [x] Polished 404 and tenant-not-found states that still feel on-brand
- [x] Sensible defaults everywhere: a storefront with no logo/banner/items still looks intentional, not broken

### F5.5 Storefront metadata, favicon & SEO

> Renders what the tenant configured in [F2.4](#f24-metadata--favicon-source-platform), using React 19 native document metadata (no helmet — per [AGENTS.md](../AGENTS.md) §3).

- [x] **Dynamic favicon per tenant:** inject `<link rel="icon">` (and `apple-touch-icon`) from the tenant's favicon/logo at runtime so each storefront shows its *own* icon in the browser tab — falls back to the logo, then a generated accent mark
- [x] Per-page `<title>` using the tenant template (e.g., `"Drill Press — ConstructionPro Rentals"`) and unique `<meta name="description">`
- [x] **Open Graph + Twitter cards** on every page (`og:title`, `og:description`, `og:image`, `twitter:card`) so shared links render rich previews
- [x] `<link rel="canonical">` per page; sensible `lang`, `theme-color` (= tenant accent), and viewport meta
- [x] **Structured data (JSON-LD):** `LocalBusiness` for the shop + `Product`/`Offer` for equipment to improve search appearance
- [x] `robots`/`sitemap` friendliness; `theme-color` matches the tenant accent for mobile browser chrome

### F5.6 Extra storefront touches (high-impact, optional)

- [ ] **"Request a quote" multi-item cart:** let a customer add several items, pick one date range, and submit a single inquiry covering all of them
- [x] **Sticky inquiry bar / mobile bottom CTA** on the detail page so the call-to-action is always reachable
- [x] **Share & save:** copy-link and "add to favorites" (localStorage) for browsing across visits
- [x] **Search & filter persistence** via URL query params (already partially supported) so links are shareable
- [/] **Trust & contact affordances:** click-to-call, WhatsApp/email links, embedded map, business hours with an "open now" indicator — click-to-call, mailto, WhatsApp, and Google Maps address link shipped; business hours/"open now" pending (needs hours field)
- [x] **Recently viewed** strip (localStorage) to aid return browsing

---

## Phase F6 — Dashboard & Platform Polish

> Bring the authenticated experience up to the same bar as onboarding and storefront.

- [x] **Dashboard home:** KPI cards with sparklines + the activation widget ([F1.2](#f12-persistent-activation-checklist-cant-be-ignored)); recent activity feed
- [x] **Equipment list:** card/table toggle, photo thumbnails, status badges, inline search & filters, skeleton loading
- [x] **Bookings:** clear status pipeline (`reserved → payment → dispatched → returned → inspected → closed`, matching [bookings.js](../api/src/routes/bookings.js)) with color-coded, labeled badges; calendar view polish; new-inquiry highlight — labeled badges, new-inquiry highlight, and calendar polish (today highlight, out-of-month dimming, weekday header, "+N more" overflow, animated detail drawer) shipped
- [x] **Analytics:** clean charts using the DSD palette; tabular-nums for figures ([dsd §3.3](./dsd-arkived.md#33-typography-rules))
- [x] **Team / Customers:** consistent table + detail patterns from the F0 kit — shared table styling, avatar initials, status/role/count Badges, skeleton loading, and Badge-based detail timeline shipped
- [x] **Marketing site (`/`, login, signup):** modern hero, social proof, and a signup flow that hands straight into the [welcome wizard](#f11-full-screen-welcome-wizard-post-signup)
- [x] **Admin panel:** keep dense and data-first, but adopt the shared primitives for consistency — KPI cards wrapped in `Card` with icons, tenant status as `Badge`, `EmptyState` for the no-tenants case, and skeleton loading shipped

---

## Phase F7 — Motion, Accessibility, Performance & Responsiveness

> Polish that makes everything feel intentional and inclusive. Non-negotiable, per [dsd §7](./dsd-arkived.md#7-motion--animation) and [tasks §7.3](./tasks-arkived.md).

### F7.1 Motion

- [x] Apply the [dsd §7.1](./dsd-arkived.md#71-duration--easing) duration/easing scale consistently (enter faster, exit faster) — modals/page drawers `300ms ease-out`, toasts/backdrops `200ms`, hover/focus on the `150ms` base; mobile nav drawer slides in (`drawerInLeft 300ms`) with a `200ms` backdrop fade
- [x] Skeletons over spinners wherever content shape is known
- [x] Wrap all animations in a `prefers-reduced-motion` guard ([dsd §7.2](./dsd-arkived.md#72-motion-principles)) — global CSS guard in both apps + explicit JS guards in confetti and hero parallax
- [x] Tasteful confetti only at genuine milestones (onboarding complete) — and reduced-motion safe

### F7.2 Accessibility (WCAG 2.1 AA)

- [x] Visible brand focus rings on every interactive element ([dsd §5](./dsd-arkived.md#5-elevation--depth)) — global `:focus-visible` ring in both apps (storefront ring is tenant-themed via `--color-primary`)
- [x] All images have meaningful `alt`; decorative images marked empty `alt` — audited across both apps; decorative icons use `aria-hidden`
- [x] Every input has an associated `<label>`; errors announced via `aria-live` — platform `Field` kit links labels + `aria-describedby`/`role=alert`; storefront forms use wrapped labels + `role=alert` errors
- [x] Status never communicated by color alone (badges carry text/icon)
- [x] Storefront accent contrast enforced at save time ([F2.2](#f22-accent-color-made-delightful))
- [/] Full keyboard path through onboarding, branding studio, and inquiry form — primitives (Tabs/Modal/Switch) are keyboard-operable; full end-to-end keyboard sweep pending

### F7.3 Performance

- [x] Lazy-load route components with `React.lazy` + `<Suspense>` (platform)
- [x] `loading="lazy"` on all storefront imagery; client-side image compression on upload ([F4.1](#f41-reusable-imageuploader-component))
- [x] Preload the tenant theme/branding before first storefront paint to avoid a flash of default colors
- [x] Keep bundles lean — no second icon library, no heavyweight animation deps where CSS suffices

### F7.4 Responsiveness (mobile-first, all breakpoints)

> Responsiveness is a cross-cutting requirement for **every** view in both apps, not a final pass. Design mobile-first, then enhance for larger screens.

- [ ] Adopt a consistent breakpoint ladder (Tailwind `sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280) and design each layout mobile-first (base styles target the smallest screen)
- [x] **Platform shell:** sidebar collapses to a drawer / bottom tab bar on mobile ([F0.2](#f02-layout-polish)); top bar condenses (search → icon, user menu → avatar) — animated slide-in drawer + condensing sticky header shipped
- [x] **Data tables** reflow to stacked cards or horizontally scroll within a contained region on small screens — never overflow the page — every platform table sits in an `overflow-x-auto` container
- [ ] **Branding studio** ([F2.1](#f21-split-screen-live-preview)) stacks controls above the preview on mobile; the device toggle still previews Desktop/Mobile frames
- [ ] **Onboarding wizard** is fully usable on a phone (single-column steps, thumb-reachable primary action)
- [ ] **Storefront** is mobile-first end to end ([F5.4](#f54-storefront-fundamentals)): hero, category/equipment grids, and footer reflow; sticky mobile inquiry CTA ([F5.6](#f56-extra-storefront-touches-high-impact-optional))
- [x] **Modals / drawers / date pickers** convert to full-screen or bottom-sheet patterns on mobile; no off-screen content — shared `Modal` is a bottom-sheet on mobile (`rounded-t-lg` → `sm:rounded-lg`)
- [ ] **Touch targets** are ≥ 44×44px; adequate spacing prevents mis-taps; hover-only affordances have a tap/focus equivalent
- [ ] Respect safe areas (notches) and dynamic viewport units (`dvh`) so fixed bars don't get hidden by mobile browser chrome
- [ ] **Fluid type & spacing:** headings/sections scale down sensibly (use the [dsd §3.1](./dsd-arkived.md#31-type-scale) scale responsively); no fixed pixel widths that cause overflow
- [ ] Images/media are fluid (`max-width: 100%`); use responsive `srcset`/sizes where it matters
- [ ] **Verification:** test each view at 360 / 768 / 1024 / 1440px (and landscape) — zero horizontal scroll, no clipped or overlapping controls

---

## Phase F8 — Storefront ↔ Platform Connectivity

> **Goal:** Make the two-way link between the public storefront and the operator dashboard *visible and trustworthy*. The data plumbing already exists ([Backend Impact](#backend-impact--scope)); this phase surfaces it in the UI on both sides. **No backend logic changes required.**

### F8.1 Inquiries become bookings (storefront → platform)

- [x] A storefront inquiry (`POST /bookings/inquiry`) already creates a `reserved` booking **and** a customer — make the storefront success state reflect this: show the booking reference and "the shop has received your request"
- [x] Confirm the new booking appears in the platform Bookings list and Calendar with no extra wiring (shared tenant data)
- [x] If the chosen dates conflict, surface the API's `409 BOOKING_CONFLICT` as a friendly inline message and refresh availability

### F8.2 New-inquiry signals (platform)

- [x] Dashboard surfaces **incoming inquiries**: a badge/count on Bookings nav + a "New requests" card on the dashboard home
- [x] New `reserved` bookings are visually highlighted until acknowledged by an operator
- [x] Near-real-time refresh via polling/`updated_at` (or the optional backend hint in [Backend Impact](#backend-impact--scope)); degrades to manual refresh
- [x] Operator can advance the booking through the real pipeline (`reserved → payment → …`) directly from the list/detail

### F8.3 Maintenance & availability reflection (platform → storefront)

- [x] When equipment is set to `maintenance` (or `archived`) in the platform, the storefront **immediately reflects it**: the item shows "Currently unavailable" and its dates are blocked in the inquiry picker
- [x] The storefront availability calendar mirrors platform bookings via the existing availability endpoint — booked/maintenance ranges render as unavailable
- [x] Equipment marked `available` reappears in the catalog automatically

### F8.4 Customer status tracking (storefront)

- [x] After submitting an inquiry, the customer gets a **booking reference** and an optional "track your request" link — reference shown in the success state + "Track your request" deep-link (prefilled ref + email) shipped
- [x] A lightweight, read-only status page shows where their request is in the pipeline (received → confirmed → ready → returned), mapped from the booking status
- [x] Depends on the optional public status-lookup endpoint in [Backend Impact](#backend-impact--scope); hidden gracefully if not available — endpoint shipped; page surfaces a friendly error when a reference/email doesn't match
- [ ] Status-change notifications already fire server-side (`notify.bookingStatusChanged`) — keep storefront copy consistent with those emails

### F8.5 Calendar parity

- [x] The platform calendar (`GET /bookings/calendar`) and the storefront availability view present the *same* booked ranges, using a shared rendering convention so operators and customers see a consistent picture
- [x] Equipment-level filtering on both sides stays in sync (same equipment id semantics)

---

## Acceptance & Definition of Done

A frontend item is **Done** when:

- [ ] It composes from the F0 shared primitives (no one-off buttons/inputs/cards)
- [ ] It honors the correct token system — App 1 = Arkived dark theme; App 2 = tenant CSS variables
- [ ] It has loading, empty, and error states (skeletons, not raw spinners)
- [ ] It is **fully responsive** — mobile-first and verified at 360 / 768 / 1024 / 1440px with no horizontal scroll, clipped controls, or touch targets < 44px ([F7.4](#f74-responsiveness-mobile-first-all-breakpoints))
- [ ] It passes WCAG AA: focus rings, labels, alt text, non-color-only status, AA contrast
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Copy matches the [dsd §9](./dsd-arkived.md#9-voice--tone) voice (clear, direct, encouraging)
- [ ] Uploads use the shared `ImageUploader` and write under the `${tenant_id}/` storage prefix
- [ ] It does **not** alter backend business logic, RLS, or data models — it consumes existing endpoints (any backend add is opt-in and the UI degrades gracefully without it)
- [ ] Storefront pages set tenant-aware metadata + favicon (title, description, OG/Twitter, canonical) via React 19 native metadata
- [ ] No Vite build warnings; the relevant [tasks-arkived.md](./tasks-arkived.md) checkboxes are reconciled

---

### Suggested sequencing

```
F0  ─▶  F1  ─▶  F2  ─▶  F3
          │       └────────┐
          ▼                ▼
         F4  ─────────▶  F5  ──▶  F8
                           │
                    F6 ─▶ F7 (continuous)
```

Start with the shared kit (F0) so onboarding (F1), the branding studio (F2/F3), storage (F4), and the storefront (F5) all inherit a consistent, premium feel. F8 (connectivity) lands once the storefront UI exists. F6 and F7 run as continuous polish.

---

*This document is a living artifact. Check off items as they ship and keep it reconciled with [tasks-arkived.md](./tasks-arkived.md) and [dsd-arkived.md](./dsd-arkived.md).*
