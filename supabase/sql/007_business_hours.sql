-- Arkived business hours field (additive, non-breaking)
-- Stores per-day open/close times used by the storefront "open now" indicator.
-- Shape: { "mon": { "open": "09:00", "close": "17:00" }, ..., "sun": null }
--   - A day mapped to null (or omitted) is treated as closed.
--   - Times are 24h "HH:MM" strings in the shop's local time.
-- Run after 001_schema_and_rls.sql

alter table public.tenants
  add column if not exists business_hours jsonb;
