# Project Build Guide (BUILD) — Arkived

**Project:** Arkived
**Date:** 2026-06-09
**Version:** 0.1.0
**Owner:** Regalia Council
**Status:** Draft
**Last reconciled:** 2026-06-09
**PRD:** [prd-arkived.md](prd-arkived.md)
**SDD:** [sdd-arkived.md](sdd-arkived.md)
**SAD:** [sad-arkived.md](sad-arkived.md)

---

## 1. How to Build From These Docs

The documentation suite is the source of truth. Read in this order before writing code:
1. `docs/index.md` — Manifest of FMD documents.
2. `docs/prd-arkived.md` — Feature scope and definitions.
3. `docs/sdd-arkived.md` — Backend routes and RLS configurations.
4. `docs/dsd-arkived.md` — Styling tokens and UI guidelines.
5. This guide — Working conventions and code snippets.

### Traceability map

| To implement... | Read | Then verify against |
|---------------|------|---------------------|
| Multi-tenant isolation | SDD §3 / §5 | QAD AB-01, AB-02 |
| Front-end styling | DSD §2 / §8 | QAD H-04, S-03, AB-04 |
| Booking workflow transitions | PRD §3.3 / SDD §3 | QAD H-03, S-02 |
| Storefront deployment / DNS | PRD §3.1 / SDD §6 | QAD H-04 |

---

## 2. Subagents

If implementing complex packages in parallel, spawn specialist dev subagents per the definitions in `docs/sad-arkived.md`. Otherwise, perform changes inline.

---

## 3. Stack Currency & Deprecations

> [!IMPORTANT]
> **Do not rely on model training memory for Tailwind CSS v4 or React 19.** Both frameworks have significant syntax changes. Always refer to this living register.

### Pinned Stack

| Layer | Technology | Pinned version | Convention verified (date) | Authoritative source |
|-------|------------|----------------|-----------------------------|----------------------|
| Language | JavaScript / Node.js | v20+ | 2026-06-09 | Node.js Docs |
| Platform Web | React 19 + Vite | v19.x | 2026-06-09 | React Docs |
| Storefront Web | React 19 + Vite | v19.x | 2026-06-09 | React Docs |
| Styling | Tailwind CSS v4 | v4.x | 2026-06-09 | Tailwind v4 Docs |
| API | Express.js | v5.x | 2026-06-09 | Express v5 Docs |
| Database | Supabase Client | v2.x | 2026-06-09 | Supabase Docs |

### Deprecations & convention changes — DO NOT use the stale form

| ❌ Stale / deprecated | ✅ Current convention | Since (version/date) | Source |
|----------------------|----------------------|----------------------|--------|
| `tailwind.config.js` | CSS-first configuration via `@theme` in `src/index.css` | Tailwind v4 | Tailwind v4 Upgrade Guide |
| `react-helmet-async` | Native React 19 document metadata hoisting (using `<title>` in components) | React 19 | React 19 Metadata Guide |
| Express error handler | Async router wrappers or native Express v5 promise rejection handling | Express v5 | Express v5 Release notes |

---

## 4. Golden-Path Patterns

### Pattern 1: Tailwind v4 Theme Configuration (Vite Frontends)
Place theme customizations directly in your main CSS file. Do not create a JS configuration file.

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;
}
```

### Pattern 2: Runtime Storefront CSS Variable Overrides (App 2)
Inject tenant branding colors fetched dynamically from the backend into the CSS scope.

```js
// storefront/src/hooks/useTenant.js
import { useEffect, useState } from 'react';

export function useTenant(slug) {
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    async function loadTenant() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenant/${slug}/public`);
      if (res.ok) {
        const data = await res.json();
        setTenant(data);
        
        // Inject styles
        const styleId = 'tenant-branding-overrides';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleId;
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = `
          :root {
            --color-primary: ${data.accent_color};
            --color-primary-hover: ${data.accent_color_hover || data.accent_color};
          }
        `;
      }
    }
    if (slug) loadTenant();
  }, [slug]);

  return tenant;
}
```

### Pattern 3: Express JWT Authentication and Tenant Isolation
Validate authentication tokens and extract tenant context at the endpoint boundary.

```js
// api/src/middleware/auth.js
import { supabase } from '../config/supabase.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid authentication session' });
  }

  // Fetch tenant mapping
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: 'User profiles not registered' });
  }

  req.user = {
    id: user.id,
    tenant_id: profile.tenant_id,
    role: profile.role
  };

  next();
}
```

---

## 5. Conventions & Guardrails

- **Repo Isolation**: Frontends (`platform/` and `storefront/`) communicate with `api/` purely via HTTP/JSON. Do not cross-import packages or configurations.
- **Safe Database Queries**: Never construct raw query strings using user-provided parameters. Use parameterization or Supabase's JS query builder.
- **Soft Deletion**: For tables like `equipment`, flag the record with a `deleted_at` timestamp. Never trigger hard SQL `DELETE` operations on core entities.
- **Contrast Ratios**: Color definitions for buttons and backgrounds must pass WCAG AA levels.

**Definition of Done (one task):**
- [ ] Resolves the PRD acceptance criteria.
- [ ] No compilation warnings in Vite, and all JSDoc types validated.
- [ ] Passes unit/integration tests (`npm run test`).
- [ ] All inputs validated via Zod schemas.
- [ ] Code modifications do not bypass RLS checks.

---

## 6. Materialization

This guide canonicalizes at `docs/build-arkived.md` and materializes as `AGENTS.md` at the project root. Re-materialize via scripts if available, or write directly whenever this canonical spec changes.
