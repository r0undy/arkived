# Arkived

Arkived is a multi-tenant equipment rental SaaS platform with three standalone projects in one repository.

## Structure

- `platform/` - App 1 (`arkived.dev`): marketing, auth, tenant dashboard, platform-owner panel.
- `storefront/` - App 2 (`{slug}.arkived.dev`): tenant-branded public storefront.
- `api/` - Shared Express.js REST API consumed by both frontends.

Each directory has its own `package.json` and can be developed/deployed independently.

## Quick Start

### API

```bash
cd api
npm install
npm run dev
```

### Platform

```bash
cd platform
npm install
npm run dev
```

### Storefront

```bash
cd storefront
npm install
npm run dev
```

## Notes

- Frontends use Vite + React + Tailwind CSS v4.
- API uses Express + Supabase client + Zod validation.
- `.env.example` is provided for each app.
