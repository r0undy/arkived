<div align="center">

<img src="platform/src/assets/arkived-mark.svg" alt="Arkived" width="120" />

# Arkived

**Multi-Tenant Equipment Rental SaaS Platform.**

A branded, self-serve rental marketplace where any business can spin up its own storefront in minutes — unifying inventory, bookings, customers, and analytics across every tenant from a single cloud-native platform.

<br />

![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Static Web Apps](https://img.shields.io/badge/Frontend-Azure%20Static%20Web%20Apps-0078D4?logo=microsoftazure&logoColor=white)
![Container Apps](https://img.shields.io/badge/API-Azure%20Container%20Apps-0078D4?logo=microsoftazure&logoColor=white)

![PostgreSQL](https://img.shields.io/badge/Database-Azure%20Database%20for%20PostgreSQL-336791?logo=postgresql&logoColor=white)
![Entra ID](https://img.shields.io/badge/Auth-Microsoft%20Entra%20ID-0078D4?logo=microsoftentra&logoColor=white)
![Front Door](https://img.shields.io/badge/Edge-Azure%20Front%20Door-0078D4?logo=microsoftazure&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)

<br />

🗄️ Welcome to Arkived — your cloud-native home for effortless equipment rentals.

</div>

---

## Overview

Arkived is a multi-tenant equipment rental SaaS platform with three standalone projects in one repository. Each directory has its own `package.json` and can be developed and deployed independently.

- `platform/` — App 1 (`arkived.dev`): marketing, auth, tenant dashboard, platform-owner panel.
- `storefront/` — App 2 (`{slug}.arkived.dev`): tenant-branded public storefront.
- `api/` — Shared Express.js REST API consumed by both frontends.

## Tech Stack (Azure — Target Architecture)

The ideal, fully Azure-native deployment topology for Arkived:

| Layer | Technology | Azure Service |
| --- | --- | --- |
| Platform frontend | React 19 · Vite 6 · Tailwind CSS v4 · React Router 7 | **Azure Static Web Apps** |
| Storefront frontend | React 19 · Vite 6 · Tailwind CSS v4 · React Router 7 | **Azure Static Web Apps** |
| REST API | Node.js 24 · Express 5 · Zod · Helmet · node-cron | **Azure Container Apps** (containerized, auto-scaling) |
| Container images | Docker | **Azure Container Registry** |
| Database | PostgreSQL | **Azure Database for PostgreSQL Flexible Server** |
| Authentication | JWT / OIDC | **Microsoft Entra ID** (External ID for B2C tenants) |
| File & image storage | Logos, banners, uploads | **Azure Blob Storage** |
| Edge & multi-tenant routing | `{slug}.arkived.dev` subdomains, CDN, WAF | **Azure Front Door** |
| Secrets & config | API keys, connection strings | **Azure Key Vault** |
| Background jobs | Daily scheduler / reminders | **Azure Container Apps Jobs** |
| Observability | Logs, metrics, tracing | **Azure Monitor + Application Insights** |
| CI/CD | Build, test, deploy | **GitHub Actions** (OIDC federated to Azure) |

### Deployment topology

- **Frontends** build with Vite and ship to **Azure Static Web Apps**, fronted by **Azure Front Door** for global CDN, custom domains, and wildcard `{slug}.arkived.dev` tenant routing.
- **API** is containerized and runs on **Azure Container Apps** with images stored in **Azure Container Registry**, scaling to zero when idle.
- **Data** lives in **Azure Database for PostgreSQL Flexible Server**; uploads go to **Azure Blob Storage**; secrets are held in **Azure Key Vault** and injected via managed identity.
- **Auth** is handled by **Microsoft Entra ID / External ID**, replacing third-party auth with first-party Azure identity.
- **Scheduled jobs** (reminders, daily scheduler) run as **Azure Container Apps Jobs**, and everything is instrumented with **Application Insights**.

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
