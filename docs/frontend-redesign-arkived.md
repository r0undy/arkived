# Dashboard Redesign — Arkived

> **Version:** 0.1.0
> **Status:** Draft
> **Last Updated:** 2026-06-10
> **Owner:** Regalia Council
> **References:** [frontend-arkived.md](./frontend-arkived.md) · [dsd-arkived.md](./dsd-arkived.md) · [prd-arkived.md](./prd-arkived.md)

A focused initiative to elevate the **operator dashboard** (App 1, authenticated area) from "functional" to **polished, calm, and premium**. The marketing site and storefront are out of scope here — this doc targets the shell (sidebar, top bar) and the in-app pages (Overview, Equipment, Bookings, Calendar, Customers, Analytics, Branding, Team).

**Legend:** `[ ]` Not started · `[/]` In progress · `[x]` Done

---

## 1. Design Principles

1. **Calm by default, vivid on intent.** Neutral surfaces dominate; brand color is reserved for the active nav item, primary actions, and focus. No gradient-heavy "dashboards" — data is the hero.
2. **One elevation language.** Every panel is a `Card` (border `neutral-750`, surface `neutral-800`) on the `neutral-900` canvas. Depth comes from a single soft shadow on hover, never stacked borders.
3. **Consistent rhythm.** 4px base scale. Page padding `p-6`, card padding `p-5`, section gaps `gap-6`, control height `h-11` (44px touch target).
4. **Scannable hierarchy.** Page title → KPI row → primary panel → secondary panels. Each page opens with a `PageHeader` (title + subtitle + primary action).
5. **Motion that informs.** 150–250ms ease-out transitions on hover/active/mount. Everything behind the global `prefers-reduced-motion` guard.

---

## 2. Token Reference (already in `index.css`)

| Token | Value | Use |
|---|---|---|
| `--color-neutral-900` | `#0f172a` | App canvas / page background |
| `--color-neutral-800` | `#1e293b` | Card / panel surface |
| `--color-neutral-950` | `#080d1a` | Sidebar surface, deepest wells |
| `--color-neutral-750` | `#2d3f55` | Borders / dividers |
| `--color-neutral-400` | `#94a3b8` | Secondary text |
| `--color-brand-500 / 600` | `#6366f1 / #4f46e5` | Active nav, primary buttons |
| `--color-brand-400` | `#818cf8` | Accent text, focus ring |
| `success / warning / danger / info-500` | — | Status semantics only |

> Do **not** introduce new raw hex values in components. If a shade is missing (e.g. `neutral-850`, `brand-300`), add it to `@theme` first, then use the token.

---

## 3. Sidebar Redesign

**Current:** flat list, active item is a solid brand block, collapse toggle, mobile drawer. Works, but reads "utilitarian."

**Target aesthetic:**

- [ ] **Active state = pill + rail.** Active item gets a soft `bg-brand-500/12` fill, `text-brand-300`, and a 3px brand rail on the left edge (`absolute left-0 h-5 w-0.5 rounded-full bg-brand-500`) instead of a full solid block. Solid brand is reserved for buttons.
- [ ] **Hover** lifts to `bg-neutral-800/70` with `text-neutral-50`; icon shifts from `neutral-400` → `neutral-200`.
- [ ] **Grouped nav with quiet section labels.** Split into *Operations* (Overview, Equipment, Bookings, Calendar, Customers, Analytics) and *Settings* (Branding, Team) with an uppercase `text-[11px] tracking-[0.18em] text-neutral-500` label that hides when collapsed.
- [ ] **Footer user block.** Move the avatar + email out of the top bar into a sidebar footer card: avatar, name/email, and a quiet "Sign out" with `LogOut` icon. Collapses to just the avatar.
- [ ] **Workspace switcher header.** Replace the bare wordmark with a row showing the tenant logo/monogram + shop name + slug (`{slug}.arkived.dev` in `text-xs text-neutral-500`). Sets context immediately.
- [ ] **Smoother collapse.** Animate width via a `transition-[grid-template-columns] duration-200`; fade labels with `opacity` rather than hard unmount so it doesn't pop.
- [ ] **Inquiry badge polish.** Keep the count pill but use `bg-danger-500/90` with a subtle ring; in collapsed mode the dot gets a gentle `motion-safe:animate-pulse`.

---

## 4. Top Bar Redesign

**Current:** mobile menu button + "Rent smarter. Grow faster." + email + avatar.

**Target:**

- [ ] **Contextual breadcrumb / page title** on the left (driven by route), replacing the static tagline. e.g. `Dashboard / Bookings`.
- [ ] **Global quick actions** on the right: a `+ New` menu (new equipment / booking / customer), and the new-inquiry bell with the live count (reuse `useNewInquiries`).
- [ ] **Remove duplicate identity.** With the user block in the sidebar footer, the top bar drops the email; keep only what's contextual.
- [ ] **Sticky + blur** stays, but tighten to `h-14`, border-bottom `neutral-750`, `bg-neutral-900/80 backdrop-blur`.

---

## 5. Page-Level Patterns

### 5.1 Shared `PageHeader`
- [ ] Extract a `PageHeader` primitive: `title`, optional `subtitle`, optional `actions` slot. Used by every dashboard page for consistent top rhythm (`mb-6`, title `text-2xl font-bold tracking-tight`).

### 5.2 KPI cards (Overview)
- [ ] Standardize the stat card: label (`text-sm text-neutral-400`), value (`text-3xl font-bold tabular-nums`), optional `Sparkline`, optional delta chip (`+12%` in `success-500` / `danger-500`). Icon in a `rounded-xl bg-brand-500/10 text-brand-300` tile.
- [ ] Alert state (e.g. overdue > 0) tints the card border `danger-500/40` and the value `danger-400` — no full red fill.

### 5.3 Tables (Equipment, Bookings, Customers, Team)
- [ ] Unify on one table style: header row `text-xs uppercase tracking-wide text-neutral-500`, rows divided by `divide-neutral-800`, row hover `bg-neutral-800/60`, `h-12` rows.
- [ ] Status via `Badge` only (consistent variants). Right-align numeric/action columns.
- [ ] Loading = `Skeleton` rows (already present); empty = `EmptyState` with an icon + a primary action.
- [ ] Card/table toggle (already on Equipment) — apply the same affordance everywhere a grid makes sense.

### 5.4 Detail pages (Equipment, Customer, Booking)
- [ ] Two-column on `lg`: primary content + a sticky right rail for metadata/actions. Consistent back link (`← Bookings`).

### 5.5 Empty & error states
- [ ] Every list/section has a designed empty state (icon, one-line explanation, CTA) and a graceful error card — never a blank panel.

---

## 6. Component Polish

- [ ] **Buttons:** confirm `Button` covers `primary / secondary / ghost / danger` and sizes `sm / md`; `h-11` default, `h-9` for `sm`. Loading spinner inline.
- [ ] **Inputs:** unify on `h-11 rounded-lg border-neutral-750 bg-neutral-950 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40`, optional leading icon (matches the new auth pages).
- [ ] **Cards:** add an optional `eyebrow`/`icon` to `CardHeader`; ensure hover lift is opt-in via the existing `hover` prop.
- [ ] **Badge / Tabs / Tooltip / Switch:** audit for consistent radius (`rounded-md`/`rounded-full`), and that all interactive ones expose focus rings.
- [ ] **Scrollbars:** apply the thin styled scrollbar to in-app scroll regions for a finished feel.

---

## 7. Motion

- [ ] Page content mounts with a subtle `fadeInUp` (already defined) — stagger KPI cards by ~40ms.
- [ ] Nav active-rail slides between items (shared-layout feel) where cheap; otherwise a clean fade.
- [ ] All hover/active transitions `duration-150 ease-out`. Respect the global reduced-motion guard.

---

## 8. Accessibility

- [ ] Sidebar nav is a labeled `<nav aria-label="Primary">`; section groups use headings or `aria-label`.
- [ ] Active item exposes `aria-current="page"`.
- [ ] All icon-only controls keep `sr-only` text (collapsed sidebar, top-bar actions).
- [ ] Contrast: secondary text stays ≥ `neutral-400` on `neutral-800/900` (AA). Active-pill text `brand-300` verified on `brand-500/12`.
- [ ] Focus rings preserved on every new interactive element.

---

## 9. Phased Plan

| Phase | Scope | Exit criteria |
|---|---|---|
| **R1 — Shell** | Sidebar (grouping, active rail, user footer, workspace header), top bar (page title, `+ New`, bell) | Shell looks intentional; collapse animates; mobile drawer matches |
| **R2 — Page rhythm** | `PageHeader` primitive + adopt on all 8 pages; standardized KPI cards | Every page opens with consistent header + spacing |
| **R3 — Data surfaces** | Unified table style, badges, empty/error states across lists | One table language; no blank states |
| **R4 — Detail + polish** | Detail-page two-column rails, component audit, motion/stagger | Detail pages consistent; transitions smooth |
| **R5 — A11y + QA** | aria sweep, contrast checks, build verification both apps | Clean build, no contrast regressions |

---

## 10. Definition of Done

- [ ] `platform` builds clean under Node v25.8.2 with no Vite warnings.
- [ ] No raw hex outside `@theme`; all surfaces use tokens.
- [ ] Tailwind v4 shorthand only (`bg-linear-to-*`, `bg-size-[…]`, `mask-[…]`).
- [ ] Every page uses `PageHeader`; every list has empty + loading + error states.
- [ ] Keyboard-navigable shell with visible focus and `aria-current` on active nav.
- [ ] Reconcile [frontend-arkived.md](./frontend-arkived.md) F6 once R1–R4 land; bump its version.
