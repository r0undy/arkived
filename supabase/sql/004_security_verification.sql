-- Arkived security verification script
-- Run in Supabase SQL editor after:
--   001_schema_and_rls.sql
--   003_storage.sql

-- 1) Verify RLS is enabled on all tenant-scoped tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'users',
    'equipment',
    'equipment_images',
    'customers',
    'bookings',
    'maintenance_logs',
    'tenants'
  )
order by c.relname;

-- 2) Verify expected policies exist.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'users',
    'equipment',
    'equipment_images',
    'customers',
    'bookings',
    'maintenance_logs',
    'tenants'
  )
order by tablename, policyname;

-- 3) Verify storage policies exist for tenant-assets.
select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'tenant_assets_insert',
    'tenant_assets_select',
    'tenant_assets_update',
    'tenant_assets_delete'
  )
order by policyname;

-- 4) Inspect users mapped to tenants (copy IDs for step 5).
select id as user_id, tenant_id, role
from public.users
order by created_at asc
limit 20;

-- 5) Tenant isolation smoke tests (manual substitutions required):
-- Replace:
--   <USER_A_UUID> with a user id in tenant A
--   <USER_B_UUID> with a user id in tenant B
--   <TENANT_B_UUID> with tenant B id
--
-- 5a) As user A, reads should only return tenant A rows.
-- begin;
-- select set_config('request.jwt.claim.sub', '<USER_A_UUID>', true);
-- select id, tenant_id from public.equipment limit 10;
-- select id, tenant_id from public.bookings limit 10;
-- rollback;
--
-- 5b) As user A, cross-tenant insert should fail RLS check.
-- begin;
-- select set_config('request.jwt.claim.sub', '<USER_A_UUID>', true);
-- insert into public.customers (tenant_id, full_name, email)
-- values ('<TENANT_B_UUID>', 'RLS Probe', 'rls-probe@example.com');
-- rollback;
--
-- 5c) As user B, user A data should not be visible.
-- begin;
-- select set_config('request.jwt.claim.sub', '<USER_B_UUID>', true);
-- select id, tenant_id from public.equipment limit 10;
-- rollback;
