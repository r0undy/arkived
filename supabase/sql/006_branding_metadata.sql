-- Arkived branding metadata fields (additive, non-breaking)
-- Supports storefront favicon + SEO/social metadata customization.
-- Run after 001_schema_and_rls.sql

alter table public.tenants
  add column if not exists tagline text,
  add column if not exists meta_description text,
  add column if not exists favicon_url text,
  add column if not exists og_image_url text;
