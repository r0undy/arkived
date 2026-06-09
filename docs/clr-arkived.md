# Compliance & Legal Readiness Register (CLR) — Arkived

**Project:** Arkived
**Date:** 2026-06-09
**Version:** 0.1.0
**Owner:** Regalia Council
**Status:** Draft
**Last reconciled:** 2026-06-09
**PRD:** [prd-arkived.md](prd-arkived.md)
**SDD:** [sdd-arkived.md](sdd-arkived.md)

---

> [!WARNING]
> **Structural and regulatory awareness only — NOT legal advice.** This register maps data handling flows and surfaces obligations under Philippine (RA 10173), US, and EU regulations. It does not replace a licensed attorney. Any item flagged "counsel needed" must be reviewed by legal counsel before launch.

---

## 0. Target Markets

| Region | In scope? | Notes |
|--------|-----------|-------|
| European Union / UK (GDPR / UK GDPR) | Yes | Global web platform with no active geo-blocking. |
| California, USA (CCPA / CPRA) | Yes | Targeted for SaaS tenants and customers. |
| Philippines (Data Privacy Act 2012, RA 10173) | Yes | **Primary jurisdiction (Philippines First rule).** |

**Geo-blocking:** None. Accessible globally by default.

---

## 1. Data Inventory / Record of Processing

| Activity | Purpose | Data categories | Data subjects | Recipients / sub-processors | Cross-border transfer | Retention | Legal basis |
|----------|---------|-----------------|---------------|-----------------------------|-----------------------|-----------|-------------|
| Tenant Sign-up | Provision SaaS workspace | Name, Email, Password, Company Slug | Tenant Admins | Supabase Auth, Express API | US (Supabase host) | Term of SaaS contract | Contractual necessity |
| Booking Inquiry | Store rental requests | Customer Name, Email, Phone, Dates | End Customers | Supabase Database | US (Supabase host) | 7 years (tax/financial) | Contractual necessity |
| Notifications | Update booking status | Email, Phone Number, Booking status | Customers & Staff | Resend, Twilio APIs | US / Global | 30 days in logs | Legitimate interest |

**Sensitivity flags:**

| Data type | Collected? | Notes |
|-----------|-----------|-------|
| Basic PII (name, email) | Yes | For both Tenant Staff and End Customers. |
| Special-category / sensitive | No | No medical, religious, or sexual orientation data. |
| Children's data | No | Restricted to ages 18+ in Terms of Use. |
| Precise location | No | Street addresses collected for pickup locations only. |
| Photos / media | Yes | Equipment images uploaded by Tenant Admins. |
| Device IDs / advertising IDs | No | No mobile tracking SDKs in MVP. |
| Analytics / telemetry | Yes | Basic platform utilization metrics. |
| Crash logs | Yes | Standard server/client logs in dev/prod. |
| Payment / card data | No | **Manual recording only** (reference text fields). Card numbers never touch the system. |

---

## 2. Multi-Jurisdiction Obligations Matrix

| Dimension | EU / UK GDPR | California CCPA / CPRA | Philippines DPA 2012 |
|-----------|--------------|------------------------|----------------------|
| **Consent / legal basis** | Opt-in; explicit consent required for marketing. | Opt-out of sale/share. | Explicit consent required for processing customer contact details. |
| **Data subject rights** | Access, correct, delete, restrict, portability. | Know, delete, correct, opt-out of sale. | Access, correct, delete, block, object, claim damages. |
| **Breach notification** | Authority ≤ 72h; subjects without undue delay. | Reasonable delay; CA AG if >500 residents. | **NPC and subjects ≤ 72h** from knowledge if risk of serious harm. |
| **DPO / representative** | Large-scale requires DPO. | Not mandated. | **Mandatory DPO** registration with NPC + Privacy Impact Assessment. |
| **Our status / action** | Review SCCs for Supabase hosting data. | Draft CCPA-compliant footer options. | **Assign DPO role** to Regalia Council representative. |

---

## 3. Escalation Flags — Counsel Required

| Flag | Present? | Why it escalates |
|------|----------|------------------|
| Children's data | No | — |
| Health / medical data | No | — |
| Payments / card data | No | Payment processor details are logged manually, avoiding PCI-DSS direct scope. |
| Biometric data | No | — |
| Large-scale systematic monitoring | No | — |
| Automated decisions | No | — |
| Sale / share / adtech | No | No data monetization or behavioral tracking in v1.0. |
| Operating in a market with no local entity | Yes | EU/UK representation may be triggered if customers originate there. |

---

## 4. Terms of Use / EULA Readiness

| Clause | Present? | Evidence link | Counsel needed? |
|--------|----------|---------------|-----------------|
| License grant + scope | Yes | (To be drafted) | Yes |
| Acceptable use / prohibited conduct | Yes | (To be drafted) | Yes |
| Limitation of liability + warranty | Yes | (To be drafted) | Yes |
| Governing law + jurisdiction | Yes | (To be drafted - default Philippines) | Yes |
| Dispute resolution / arbitration | Yes | (To be drafted) | Yes |
| Account suspension rights | Yes | (To be drafted) | Yes |

---

## 5. IP Infringement & Protection Readiness

| Item | Status | Evidence link | Counsel needed? |
|------|--------|---------------|-----------------|
| Trademark knockout search | Pending | | Yes |
| SBOM maintained | Planned | `package.json` audits | No |
| Copyleft license scan | Planned | No copyleft modules used | No |
| Third-party asset verification | Complete | Lucide icons (MIT) | No |
| Assignment of IP from builders | Complete | Git author config | Yes |
