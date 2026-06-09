# Operations & Observability Runbook (OPS) — Arkived

**Project:** Arkived
**Date:** 2026-06-09
**Version:** 0.1.0
**Owner:** Regalia Council
**Status:** Draft
**Last reconciled:** 2026-06-09
**SDD:** [sdd-arkived.md](sdd-arkived.md)

---

## 1. SLOs & SLIs

| SLI (what you measure) | SLO (target) | Measured by | Breach action |
|------------------------|--------------|-------------|---------------|
| Uptime (Availability) | 99.9% / month | Cloudflare Health Checks / Azure Monitor | Page administrator via email / webhook if down for > 3 min. |
| API p95 Latency | < 300ms | Express.js middleware logs | Flag API metrics in Azure portal; inspect slow queries. |
| API Error Rate | < 1% error (5xx) | Azure App Service logs | Alert triggers if error rate > 2% over a 5-minute window. |
| Storefront Load Time | Lighthouse perf >= 85 | Weekly automated Lighthouse check | Flag frontend assets on bundle size warning. |

---

## 2. Observability — Logs, Metrics, Traces

**The three pillars — where each lives:**

| Pillar | Tool | What's captured | Retention |
|--------|------|-----------------|-----------|
| Logs | Azure Monitor Application Insights | Express server HTTP requests, database transaction errors, application trace statements. | 30 days |
| Metrics | Supabase Dashboard | Postgres CPU utilization, database connection count, transactional throughput. | 7 days (Free tier) |
| Traces | Azure App Service Profiler | Endpoint execution latency, database query times. | 15 days |

**Dashboards:**
- Azure Application Insights Dashboard: Tracking global API error rates and latencies.
- Supabase Console: Tracking table size, active database connections, and locks.

**Correlation ID:** The API middleware automatically injects a `x-request-id` into all logs. If available, the client-side SPA transmits this header during API calls so errors are traceable from the browser through to database logs.

**No-PII-in-logs rule:** User passwords are encrypted before they reach the API. Logs must never record full customer names, emails, or booking details (specifically pricing and contact info). Only database IDs are printed.

---

## 3. Alerting & On-Call

| Alert | Condition | Severity | Who / how notified |
|-------|-----------|----------|--------------------|
| API Down | Uptime probe fails 3x | P0 | Discord Webhook + Admin SMS (Twilio alert) |
| High Error Rate | > 2% requests fail (5xx) in 5 min | P1 | Discord Webhook + Admin email |
| Storage Limit Warning | Storage bucket > 80% capacity | P2 | Admin email notification |

**On-call model:** Solo operator best-effort. Alerts are routed to Discord channels and SMS/Email backstops.

---

## 4. Incident Response

**When an incident fires:**
1. **Acknowledge**: Post in the status log that the incident is acknowledged.
2. **Assess**: Determine the blast radius. Is it database-wide or tenant-specific?
3. **Mitigate first, diagnose later**:
   - For database load issues: Increase Supabase connection pool size.
   - For code failures: Roll back the latest git deployment tag in Azure App Service.
4. **Communicate**: Post an incident banner on the platform dashboard for tenants.
5. **Resolve & verify**: Verify all SLIs have returned to baseline targets.
6. **Postmortem**: For any P0 or P1 incident, write a Postmortem (`docs/pm-arkived-nnn.md`) within 48 hours.

**Rollback mechanism:**
- **Vite Frontends (Cloudflare Pages)**: Revert to the last successful production build hash in the Cloudflare dashboard.
- **Express API (Azure App Service)**: Deploy the previous Git tag release.

---

## 5. Routine Operations

- **Secret rotation**: Secret keys (Supabase service role keys, Resend keys) must be rotated annually.
- **Dependency updates**: Run `npm audit` weekly in all projects; update outdated packages.
- **Backup restore drill**: Perform a manual database restore trial in a test database instance semi-annually.
- **Cost review**: Review Supabase and Azure billing monthly to optimize computing instances.
