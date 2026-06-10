# Storefront Redesign — Arkived

> **Version:** 0.1.0
> **Status:** Draft
> **Last Updated:** 2026-06-10
> **Owner:** Regalia Council
> **References:** [frontend-arkived.md](./frontend-arkived.md) · [frontend-redesign-arkived.md](./frontend-redesign-arkived.md) · [dsd-arkived.md](./dsd-arkived.md#8-app-2-theming-system) · [prd-arkived.md](./prd-arkived.md)

A focused initiative to fix the **public storefront** (App 2, `{slug}.arkived.dev`) — specifically the home page, which currently reads as a **stack of boxed "cards" on every section** ("AI slop"). The goal: a calmer, editorial, conversion-focused page where the **products and the brand** are the heroes, not the boxes around them.

**Legend:** `[ ]` Not started · `[/]` In progress · `[x]` Done

---

## 1. The Core Problem

The home page is **card-on-card-on-card**. Almost every section is a bordered white rounded box:

| Section | Current treatment | Why it feels generic |
|---|---|---|
| Hero | rounded-3xl image box | OK, but floats with no grounding |
| Trust strip | 4 bordered white cards | redundant boxing of tiny facts |
| Categories | 6 bordered cards w/ colored circle icons | "icon-in-a-circle-in-a-card" cliché |
| Featured | product cards (these are fine) | the only place cards belong |
| How it works | full dark rounded card | another floating slab |
| Why choose us | 3 bordered cards w/ circle icons | identical pattern to categories |
| Final CTA | gradient rounded card | the most generic SaaS trope |

**Result:** five different "card" rhythms competing, lots of borders, repeated `circle-icon` motif, and the actual equipment gets equal weight to filler. Everything is `space-y-12` floating panels.

---

## 2. Redesign Principles

1. **Cards are for products only.** Equipment cards stay. Everything else becomes open, full-width *sections* separated by whitespace and the occasional hairline rule — not boxes.
2. **The brand color is an accent, not a billboard.** Reserve `--color-primary` for the hero, buttons, and small accents. Kill the full-width gradient slabs.
3. **Editorial spacing over containers.** Use generous vertical rhythm and alignment to group content; let the page background (the existing soft radial wash) breathe between sections.
4. **Fewer, stronger sections.** Collapse 6 sections into ~4. Merge trust signals into the hero; fold "how it works" into a lightweight inline strip.
5. **Products front and center.** Featured catalog should appear earlier and get the most visual weight.
6. **Respect tenant theming.** All accents via the `--color-primary*` variables (DSD §8); never hardcode brand hex.

---

## 3. Section-by-Section Plan

### 3.1 Hero — keep, but ground it
- [ ] Keep the image/parallax (or animated gradient fallback) — this is the one place a big visual belongs.
- [ ] **Absorb the trust strip into the hero** as a thin inline row beneath the CTAs: `12 items · Fast replies · Quality maintained · Local pickup` rendered as muted text with small inline icons and dot separators — **no cards**.
- [ ] Keep the open-now badge + contact actions (these are good, lightweight).
- [ ] Slightly reduce hero corner rounding (`rounded-3xl` → `rounded-2xl`) so it feels grounded, or make it full-bleed within the content container.

### 3.2 Remove the standalone Trust strip
- [ ] Delete the 4-card `TrustItem` grid entirely; its content now lives inline in the hero (3.1). Removes 4 boxes immediately.

### 3.3 Featured equipment — promote it
- [ ] Move **Featured equipment above Categories** so products lead.
- [ ] Keep `EquipmentCard` (cards are correct here). Section header is a plain title + "See full catalog →" link — no wrapping panel.
- [ ] Consider a larger first row on `lg` (a 2-up "hero product" + smaller cards) for editorial weight — optional.

### 3.4 Categories — pills, not cards
- [ ] Replace the 6 bordered category **cards** with **chips/pills**: a horizontal wrap of rounded buttons (`border-slate-200 bg-white/70 hover:border-primary`) with the label and a small leading icon or the category's first letter. Drops the "circle icon in a card" cliché and the heavy grid.
- [ ] Place this directly under Featured as a quiet "Shop by category" filter row.

### 3.5 How it works — inline 3-step strip
- [ ] Remove the full **dark rounded slab**. Render the 3 steps as an open, centered row on the page background: number + title + one line, connected by a thin hairline/arrow between steps on `sm+`. No container, no dark box.
- [ ] Numbers use `--color-primary` text; icons optional and small.

### 3.6 Why choose us — editorial, not 3 cards
- [ ] Replace the 3 bordered **cards** with a clean 3-column (or alternating) list: small accent icon, bold one-liner, supporting sentence — separated by whitespace/hairlines, **no borders or shadows**.
- [ ] Keep the star row, but make it subtle. Drop the per-item white box.

### 3.7 Final CTA — minimal, no gradient slab
- [ ] Remove the **gradient card**. Replace with a centered, open CTA band on the page background: heading + one line + a single primary button (themed). Optionally a hairline top border to separate from the section above. (Mirrors the platform's de-carded CTA direction.)

---

## 4. Visual System Adjustments

- [ ] **One card style, one radius.** Only `EquipmentCard` uses the elevated white card (`rounded-xl border-slate-200`). Everything else: no border, no shadow.
- [ ] **Section headers** are consistent: `text-2xl font-bold tracking-tight text-slate-900` + an optional muted "View all →" link. No section sits inside a panel.
- [ ] **Hairlines over boxes.** Where separation is needed, use `border-t border-slate-200/70`, not a wrapping container.
- [ ] **Whitespace scale.** Increase section spacing to `space-y-16 sm:space-y-20`; let the page background show through.
- [ ] **Accent discipline.** Audit every `var(--color-primary)` usage — keep on hero, buttons, category-hover, step numbers; remove from large fills.
- [ ] **Icon-in-circle motif** retired except where genuinely useful (hero contact actions).

---

## 5. Other Storefront Pages (lighter pass)

- [ ] **Catalog** — ensure the filter bar isn't another heavy card; products grid is the focus. Reuse the new category pills.
- [ ] **Equipment detail** — verify the gallery + info rail aren't over-boxed; keep one card for the sticky inquiry/quote panel only.
- [ ] **Quote / Track request** — keep a single form card; remove decorative panels around supporting copy.
- [ ] **StorefrontLayout** — confirm header/footer are clean hairlines; open-now pill + schedule already good.

---

## 6. Accessibility & Theming

- [ ] Category pills and step rows remain keyboard-navigable with visible focus rings (storefront focus style already global).
- [ ] Text contrast on the soft page background stays AA (`slate-600`+ for body, `slate-900` for headings).
- [ ] All accents resolve from `--color-primary` / `--color-primary-hover` / `--color-primary-foreground`; nothing hardcoded so tenant themes stay intact.
- [ ] Reduced-motion guard already covers hero parallax + aurora; keep any new transitions behind it.

---

## 7. Phased Plan

| Phase | Scope | Exit criteria |
|---|---|---|
| **S1 — De-card the home page** | Remove trust-strip cards, dark how-it-works slab, why-choose cards, gradient CTA; convert to open sections | Home page has 1 card type (products) only |
| **S2 — Reorder + categories pills** | Featured above categories; categories → pills; trust facts inline in hero | Products lead; no category card grid |
| **S3 — Editorial polish** | Section header consistency, whitespace scale, hairlines, accent audit | Calm rhythm, minimal brand fills |
| **S4 — Other pages + QA** | Catalog/detail/quote light pass; build verify | Storefront builds clean; consistent system |

---

## 8. Definition of Done

- [ ] `storefront` builds clean under Node v25.8.2 with no Vite warnings.
- [ ] Home page uses **only** the product card as a boxed element; all other sections are open.
- [ ] No full-width gradient or dark "slab" cards remain.
- [ ] Featured products appear before categories; categories are pills.
- [ ] Tailwind v4 shorthand only; all accents via `--color-primary*` (no hardcoded brand hex).
- [ ] AA contrast preserved; focus rings intact; reduced-motion respected.
- [ ] Reconcile [frontend-arkived.md](./frontend-arkived.md) F5 once S1–S3 land; bump its version.
