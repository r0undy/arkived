# Design System Document — Arkived

> **Version:** 1.0.0
> **Status:** Draft
> **Last Updated:** 2026-06-06
> **Scope:** Arkived SaaS Platform (`arkived.dev` — App 1 only)
> **Styling Framework:** [Tailwind CSS v4](https://tailwindcss.com/) — CSS-first utility framework (released January 2025). All design tokens are defined via the `@theme` directive in a CSS file. There is no `tailwind.config.js`; the CSS file is the single source of truth for design tokens.
>
> **Note:** This document governs the design language of the Arkived product itself — the marketing site, the tenant onboarding flow, the Tenant Admin dashboard, and the Platform Owner panel. The tenant-facing storefront (App 2 — `{slug}.arkived.dev`) uses a separate theming system driven by each tenant's own branding configuration. See [§8 — App 2 Theming System](#8-app-2-theming-system) for details.

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Elevation & Depth](#5-elevation--depth)
6. [Iconography](#6-iconography)
7. [Motion & Animation](#7-motion--animation)
8. [App 2 Theming System](#8-app-2-theming-system)
9. [Voice & Tone](#9-voice--tone)

---

## 1. Brand Identity

### 1.1 Brand Essence

Arkived is a **professional, modern, and efficiency-first** B2B SaaS platform. The brand communicates reliability and operational clarity — a tool serious businesses trust to run their rental operations. It is not playful or consumer-facing; it is precise, capable, and quietly sophisticated.

**Brand Pillars:**
| Pillar | What It Means in Design |
|---|---|
| **Efficient** | Clean layouts, minimal noise, fast interactions — nothing wasted |
| **Trusted** | Structured hierarchy, consistent patterns, solid typography |
| **Modern** | Contemporary aesthetics — dark surfaces, crisp contrast, subtle depth |
| **Scalable** | A system that feels as comfortable for 1 tenant as it does for 1,000 |

### 1.2 Brand Name & Wordmark

- **Name:** Arkived
- **Pronunciation:** /ˈɑːr.kaɪvd/ — like "archived" with a stylized spelling
- **Tagline:** *Rent smarter. Grow faster.*
- **Wordmark:** The logotype is set in a geometric sans-serif (Inter or Geist) — lowercase `arkived` with a subtle `k` ligature or accent. The wordmark is always displayed in one of three approved variants:

| Variant | Usage |
|---|---|
| **Light (on dark)** | All surfaces — dashboards, nav bars, marketing pages (dark theme is universal) |
| **Monochrome** | Print, embossed, or single-color contexts |

- **Logo Mark:** A stylized bracket or box motif — evoking storage, archiving, and containers. Acts as an icon/favicon when the full wordmark cannot be displayed.
- **Clear Space:** Minimum clear space around the logo is equal to the cap-height of the wordmark on all sides. Never crowd it.
- **Prohibited Uses:** Do not stretch, recolor outside the approved palette, add drop shadows, or place on a busy background without an appropriate backing surface.

---

## 2. Color System

Arkived uses a **fixed dark theme** across all surfaces — dashboard, admin panels, and the marketing site. There is no light/dark mode toggle. This eliminates theme-switching complexity and creates a consistent, premium feel throughout the product. The palette is built on HSL-tuned values to ensure perceptual consistency.

All color tokens below are defined in App 1's main CSS file under `@theme`. Tailwind v4 automatically exposes these as native CSS custom properties (e.g., `--color-brand-500`) and generates utility classes (e.g., `bg-brand-500`, `text-brand-500`) from them.

### 2.1 Primary Palette

The primary brand color is a **deep indigo-blue** — authoritative and modern, carrying strong associations with technology and trust.

| `@theme` key | Name | Hex | HSL | Utility Class | Usage |
|---|---|---|---|---|---|
| `--color-brand-50` | Brand Lightest | `#EEF2FF` | `231 100% 97%` | `bg-brand-50` | Tints, highlights, selected states |
| `--color-brand-100` | Brand Tint | `#E0E7FF` | `230 100% 94%` | `bg-brand-100` | Subtle hover backgrounds |
| `--color-brand-200` | Brand Light | `#C7D2FE` | `231 97% 88%` | `border-brand-200` | Borders, focus rings |
| `--color-brand-400` | Brand Mid | `#818CF8` | `234 89% 74%` | `text-brand-400` | Secondary actions |
| `--color-brand-500` | Brand Base | `#6366F1` | `239 84% 67%` | `bg-brand-500` | **Primary buttons, links, active states** |
| `--color-brand-600` | Brand Hover | `#4F46E5` | `243 75% 59%` | `hover:bg-brand-600` | Button hover |
| `--color-brand-700` | Brand Dark | `#4338CA` | `245 68% 52%` | `active:bg-brand-700` | Button active/pressed |
| `--color-brand-900` | Brand Deepest | `#1E1B4B` | `244 48% 20%` | `bg-brand-900` | Deep dark accents |

### 2.2 Neutral Palette

Neutrals form the majority of the UI — surfaces, text, borders, and backgrounds. They are slightly warm-cool to feel refined rather than sterile.

| Token | Name | Hex | HSL | Usage |
|---|---|---|---|---|
| `--color-neutral-50` | Off-White | `#F8FAFC` | `210 40% 98%` | Primary text on dark surfaces |
| `--color-neutral-100` | Light Gray | `#F1F5F9` | `210 40% 96%` | Secondary text, headings |
| `--color-neutral-200` | Border Light | `#E2E8F0` | `214 32% 91%` | Subtle text, labels |
| `--color-neutral-400` | Muted | `#94A3B8` | `215 16% 65%` | Placeholder text, disabled states |
| `--color-neutral-500` | Subtle | `#64748B` | `215 19% 47%` | Secondary text, metadata |
| `--color-neutral-750` | Border | `#2D3F55` | `213 32% 26%` | Dividers, input borders |
| `--color-neutral-800` | Card | `#1E293B` | `222 39% 18%` | **Card/panel background** |
| `--color-neutral-900` | Base | `#0F172A` | `222 47% 11%` | **Page/body background** |
| `--color-neutral-950` | Deep | `#080D1A` | `222 50% 7%` | Inset elements, sidebar base |

### 2.3 Semantic Colors

| `@theme` key | Hex | Utility Class | Usage |
|---|---|---|---|
| `--color-success-500` | `#22C55E` | `text-success-500` | Booking confirmed, available status |
| `--color-success-100` | `#DCFCE7` | `bg-success-100` | Success background tint |
| `--color-warning-500` | `#F59E0B` | `text-warning-500` | Reserved/pending, overdue warnings |
| `--color-warning-100` | `#FEF3C7` | `bg-warning-100` | Warning background tint |
| `--color-danger-500` | `#EF4444` | `text-danger-500` | Overdue alerts, destructive actions |
| `--color-danger-100` | `#FEE2E2` | `bg-danger-100` | Danger background tint |
| `--color-info-500` | `#3B82F6` | `text-info-500` | In Maintenance, informational banners |
| `--color-info-100` | `#DBEAFE` | `bg-info-100` | Info background tint |

### 2.4 Surface Hierarchy

The dashboard uses a layered surface system to create depth. These map to Tailwind classes in App 1:

| Layer | Tailwind Class | Hex | Description |
|---|---|---|---|
| **Base** | `bg-neutral-900` | `#0F172A` | The outermost background (html/body) |
| **Raised** | `bg-neutral-800` | `#1E293B` | Cards, panels, modals |
| **Overlay** | `bg-neutral-750` | `#273548` | Dropdowns, popovers, tooltips |
| **Inset** | `bg-neutral-950` | `#080D1A` | Input fields, code blocks, table rows |

### 2.5 Color Usage Rules

- **Never** use pure black (`#000000`) or pure white (`#FFFFFF`) for large text blocks — use `bg-neutral-900` and `text-neutral-50` respectively.
- The brand primary (`bg-brand-500`) should appear sparingly — only on the most important interactive elements. Overuse dilutes its signal value.
- All text must meet **WCAG AA minimum contrast** (4.5:1 for normal text, 3:1 for large text) against its dark background.
- The dark theme is fixed and permanent — do not introduce conditional light-mode styles or `prefers-color-scheme` media queries into platform components.

---

## 3. Typography

Arkived uses **Inter** as its sole typeface — a humanist sans-serif designed for screen legibility. Loaded via the `@fontsource/inter` npm package and registered in the main CSS file using Tailwind v4's `@theme` directive:

```css
/* src/index.css (App 1) */
@import "tailwindcss";
@import "@fontsource/inter";

@theme {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
}
```

### 3.1 Type Scale

Sizes marked with ✦ are custom values defined in `@theme` (they differ from Tailwind v4 defaults).

| Tailwind Class | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text-xs` | `11px` ✦ | `16px` | 400 | Labels, badges, table meta |
| `text-sm` | `13px` ✦ | `20px` | 400 | Secondary body, helper text |
| `text-base` | `15px` ✦ | `24px` | 400 | **Primary body copy** |
| `text-md` | `16px` ✦ | `24px` | 500 | Emphasized body, form labels |
| `text-lg` | `18px` | `28px` | 500 | Section subheadings |
| `text-xl` | `22px` ✦ | `32px` | 600 | Page titles, dashboard KPI values |
| `text-2xl` | `28px` ✦ | `36px` | 700 | Section headers |
| `text-3xl` | `36px` | `44px` | 700 | Marketing hero headings |
| `text-4xl` | `48px` | `56px` | 800 | Hero display text |

### 3.2 Font Weight Mapping

| Weight | Value | Usage |
|---|---|---|
| Regular | 400 | Body copy, descriptions |
| Medium | 500 | Labels, nav items, form fields |
| Semibold | 600 | Section titles, button text, card headers |
| Bold | 700 | Page headings, modal titles |
| Extrabold | 800 | Hero headlines, marketing display |

### 3.3 Typography Rules

- **Line Length:** Body text should not exceed **72 characters per line** (approximately 680px container width). Use `max-w-prose` or `max-w-[68ch]` on prose containers.
- **Tracking:** Headlines at `text-3xl` and above use `tracking-tight` (`letter-spacing: -0.02em`) for a tighter, more premium feel. Body text uses default tracking.
- **Hierarchy:** Every page has exactly one `<h1>`. Heading levels are not skipped.
- **Numeric Figures:** Use `tabular-nums` (via Tailwind's `font-variant-numeric` or a custom class) for all data tables and KPI values to ensure columns align correctly.

---

## 4. Spacing & Layout

### 4.1 Base Unit

Arkived uses an **8px base unit** grid expressed through Tailwind's default spacing scale (which is 4px-based). All custom spacing values that fall outside Tailwind's defaults are added to `tailwind.config.js` under `theme.extend.spacing`.

The spacing tokens below map directly to Tailwind utility classes:

| Token | Value | Tailwind Class | Description |
|---|---|---|---|
| `space-0` | `0px` | `p-0` / `m-0` | — |
| `space-1` | `4px` | `p-1` / `m-1` | Micro gaps (icon-to-label, badge padding) |
| `space-2` | `8px` | `p-2` / `m-2` | Tight spacing (list items, inline elements) |
| `space-3` | `12px` | `p-3` / `m-3` | Input padding, small component gaps |
| `space-4` | `16px` | `p-4` / `m-4` | **Standard component padding** |
| `space-5` | `20px` | `p-5` / `m-5` | Card inner padding |
| `space-6` | `24px` | `p-6` / `m-6` | Section spacing within a card |
| `space-8` | `32px` | `p-8` / `m-8` | Between major sections |
| `space-10` | `40px` | `p-10` / `m-10` | Page section gaps |
| `space-12` | `48px` | `p-12` / `m-12` | Large section separators |
| `space-16` | `64px` | `p-16` / `m-16` | Page-level vertical rhythm |

### 4.2 Layout Grid

**Dashboard (App 1 — authenticated views):**
- **Layout:** Fixed left sidebar (240px) + fluid main content area
- **Sidebar:** Collapsible to icon-only mode (64px) on smaller viewports
- **Content max-width:** `max-w-7xl` (1280px), centered within the main area
- **Page padding:** `p-6` (24px) on all sides for the content area

**Marketing Site (App 1 — public pages):**
- **Layout:** Full-width sections with centered content columns
- **Content max-width:** `max-w-6xl` (~1100px)
- **Column system:** 12-column grid with `gap-6` gutters
- **Section vertical padding:** `py-16` (64px) top and bottom

### 4.3 Border Radius

| Token | Value | Tailwind Class | Usage |
|---|---|---|---|
| `radius-sm` | `4px` | `rounded-sm` | Badges, tags, small pills |
| `radius-md` | `8px` | `rounded-md` | **Default — buttons, inputs, cards** |
| `radius-lg` | `12px` | `rounded-lg` | Modals, larger panels |
| `radius-xl` | `16px` | `rounded-xl` | Feature cards on marketing pages |
| `radius-full` | `9999px` | `rounded-full` | Pills, avatars, toggle switches |

---

## 5. Elevation & Depth

Dark-mode UIs use **surface layering** rather than traditional drop shadows to convey depth. Shadows are used only on floating elements (dropdowns, modals, tooltips).

| Level | Context | Shadow |
|---|---|---|
| **0 — Flat** | Inline elements, dividers | `none` |
| **1 — Raised** | Cards, panels | `0 1px 3px rgba(0,0,0,0.3)` |
| **2 — Floating** | Dropdowns, datepickers | `0 4px 16px rgba(0,0,0,0.5)` |
| **3 — Modal** | Dialogs, drawers | `0 16px 48px rgba(0,0,0,0.6)` |

All interactive elements display a brand-colored focus ring on keyboard focus using Tailwind's `ring` utilities:

```html
<button class="focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-neutral-900">
```

---

## 6. Iconography

- **Library:** [Lucide Icons](https://lucide.dev/) — clean, consistent, stroke-based icons that align with Inter's humanist personality.
- **Stroke Width:** `1.5px` for all icons at standard sizes. Never bold or filled variants unless contextually necessary (e.g., active nav state uses filled variant).
- **Sizes:**

| Context | Size |
|---|---|
| Inline with text (body) | `16px` |
| Sidebar navigation | `20px` |
| Section headers / empty states | `24px` |
| Hero / large illustrations | `48px+` |

- **Color:** Icons inherit the text color of their context by default (`currentColor`). Interactive icons use `text-brand-500` on hover.
- **Prohibited:** Do not use multiple icon libraries within the same interface. Lucide only.

---

## 7. Motion & Animation

Motion in Arkived is **purposeful and restrained** — it reinforces interactions, not decorates them. Animations should never feel flashy or slow.

### 7.1 Duration & Easing

Duration and easing values are defined in `tailwind.config.js` under `theme.extend.transitionDuration` and `theme.extend.transitionTimingFunction`, then applied via Tailwind utility classes (`duration-*`, `ease-*`).

| Name | Duration | Tailwind Class | Easing | Usage |
|---|---|---|---|---|
| fast | `100ms` | `duration-[100ms]` | `ease-out` | Hover states, badge transitions |
| base | `150ms` | `duration-[150ms]` | `ease-out` | Button states, input focus |
| moderate | `200ms` | `duration-200` | `ease-in-out` | **Default — dropdowns, tooltips** |
| slow | `300ms` | `duration-300` | `ease-in-out` | Modals, drawers, page transitions |
| enter | `250ms` | `duration-[250ms]` | `ease-out` | Elements entering the viewport |
| exit | `200ms` | `duration-200` | `ease-in` | Elements leaving the viewport |

### 7.2 Motion Principles

- **Enter faster, exit faster:** Elements should appear slightly slower than they disappear. Waiting for an exit animation feels sluggish.
- **No layout animations** on frequently updated data (e.g., live booking counts) — this causes visual noise.
- **Skeleton loaders** replace spinners wherever the shape of the content is known. Skeletons use a shimmer animation (`background-position` sweep).
- **Respect `prefers-reduced-motion`:** All animations must be wrapped in a media query guard:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 7.3 Micro-interaction Patterns

| Interaction | Behavior |
|---|---|
| Button hover | Subtle brightness lift + `translateY(-1px)` |
| Button active | `translateY(0)` + slightly darker background |
| Card hover | `translateY(-2px)` + elevated shadow |
| Sidebar nav item | Background fill slides in from left over `150ms` |
| Status badge | Fade-in on first render only |
| Modal open | Scale from `0.96` to `1.0` + fade in over `300ms` |
| Toast notification | Slides in from bottom-right, auto-dismisses with slide-out |

---

## 8. App 2 Theming System

App 2 (`{slug}.arkived.dev`) is a **white-labeled storefront template** — its visual output is entirely driven by the tenant's branding configuration. Arkived does not impose its own brand colors or typography on tenant storefronts. Instead, it provides a structured set of **CSS custom property overrides** that tenants control through their dashboard settings.

### 8.1 What Tenants Control

Tenants configure their storefront appearance via the **Branding** settings page in App 1. The following values are editable:

| Setting | CSS Variable Injected | Default (if unset) |
|---|---|---|
| **Accent Color** | `--tenant-color-primary` | `#6366F1` (Arkived brand) |
| **Accent Hover** | `--tenant-color-primary-hover` | Auto-derived (darkened 10%) |
| **Shop Name** | Used in `<title>`, `<h1>`, meta tags | `"My Shop"` |
| **Logo** | `<img src="...">` in the header | Arkived logo as placeholder |
| **Banner Image** | Hero section `background-image` | Arkived default gradient |
| **"Powered by Arkived" Badge** | `--tenant-show-watermark: 1 / 0` | Visible by default (toggleable) |
| **Font Preference** *(v2.0)* | `--tenant-font-family` | `'Inter', sans-serif` |

### 8.2 How Theming is Applied

Tailwind v4 natively outputs all `@theme` tokens as CSS custom properties, which makes App 2's runtime theming straightforward. The approach is:

1. **App 2's CSS file defines tenant color slots as `@theme` variables with a fallback default:**

```css
/* storefront/src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: #6366f1;         /* fallback: Arkived brand indigo */
  --color-primary-hover: #4f46e5;   /* fallback */
}
```

Tailwind v4 generates `bg-primary`, `text-primary`, `border-primary` etc. from these variables automatically.

2. **At runtime, the app fetches the tenant config and overrides the CSS variables in `:root`:**

```js
// storefront/src/main.jsx
const res = await fetch(`/api/v1/tenant/${slug}/branding`);
const { primaryColor, primaryHover } = await res.json();

const style = document.createElement('style');
style.textContent = `
  :root {
    --color-primary: ${primaryColor};
    --color-primary-hover: ${primaryHover};
  }
`;
document.head.appendChild(style);
```

Because Tailwind v4's utility classes reference the CSS variables directly at runtime (not baked-in at build), overriding the variable immediately updates the entire UI — no rebuild needed.

All App 2 components use `bg-primary`, `text-primary`, etc. — never App 1's brand tokens.

### 8.3 What Tenants Cannot Change

To ensure the storefront template remains accessible, functional, and performant, the following are **non-negotiable and not configurable by tenants**:

| Element | Reason |
|---|---|
| Base layout structure | Structural consistency prevents broken UIs |
| Neutral surface colors | Dark/light contrast ratios are system-managed |
| Typography size scale | Accessibility and readability standards |
| Spacing and layout grid | Layout integrity |
| Semantic color meanings (danger = red, success = green) | UX convention — must not be overridden |

### 8.4 Branding Validation Rules

The platform enforces the following rules on tenant branding inputs:

- **Logo:** Must be PNG or SVG, max 2MB, max dimensions 400×200px. Stored in Supabase Storage.
- **Accent Color:** Must pass WCAG AA contrast ratio (4.5:1) against white — validated server-side on save. The UI shows a live contrast preview with a pass/fail indicator.
- **Banner Image:** Must be JPEG or WebP, max 5MB, recommended dimensions 1440×560px.
- **Slug / Shop URL:** Cannot be changed after registration without contacting support (to prevent broken links).

---

## 9. Voice & Tone

The Arkived copy voice is applied across all platform-authored text: UI labels, error messages, onboarding copy, email notifications, and the marketing site.

### 9.1 Brand Voice Attributes

| Attribute | Do | Don't |
|---|---|---|
| **Clear** | "Your booking has been confirmed." | "Reservation status has transitioned to confirmed state." |
| **Direct** | "Add your first item to get started." | "You may wish to consider adding an item at this time." |
| **Professional** | "Something went wrong. Try again or contact support." | "Oopsie! That didn't work 😬" |
| **Encouraging** | "You're all set. Your storefront is live." | "Process completed successfully." |
| **Precise** | "3 items are overdue for return." | "Several items might be overdue." |

### 9.2 UI Copy Conventions

- **Buttons:** Use sentence case, action verbs. `Save changes`, `Add equipment`, `View bookings` — never `SAVE CHANGES` or `Save Changes`.
- **Empty States:** Always explain why it's empty + provide a clear primary action. Example: *"No equipment yet. Add your first item to start accepting rentals."*
- **Error Messages:** Say what went wrong + what to do. Example: *"This email is already registered. Sign in instead."* — never just *"Invalid input."*
- **Confirmation Dialogs:** Restate the action in the button text. The destructive action button should name the thing being deleted: `Delete "Drill Press"`, not just `Delete` or `Confirm`.
- **Loading States:** Use active present tense: `Saving…`, `Loading bookings…`, `Uploading image…`
- **Success Toast:** Short, specific. `Equipment saved.` `Booking marked as returned.`

### 9.3 Terminology Consistency

The following terms are standardized across all UI copy and documentation:

| Correct | Avoid |
|---|---|
| Tenant | Client, Customer (when referring to rental businesses) |
| End Customer | User, Client (when referring to the people renting equipment) |
| Booking | Reservation, Order, Rental (pick one: **Booking** is canonical) |
| Equipment / Item | Asset, Product, Gear (use Equipment or Item in UI) |
| Storefront | Website, Shop Page, Portal |
| Dashboard | Admin Panel, Control Panel |
| Dispatch | Ship, Send, Hand Over |
| Return | Give Back, Check In |

---

*This document is a living artifact. Updates will be tracked via version history in this file's header.*
