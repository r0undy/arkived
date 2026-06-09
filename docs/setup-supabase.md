# Supabase Setup Guide — Arkived

This guide provisions Supabase for Arkived and aligns with the current API/frontend environment variables.

## 1. Create a Supabase Project

1. Open Supabase Dashboard.
2. Create a new project (region close to API hosting).
3. Wait for project provisioning to complete.

Collect these values from `Project Settings -> API`:
- `Project URL`
- `anon public key`
- `service_role key`

## 2. Configure Local Environment Files

Create/update files with your project keys:

- `api/.env`
- `platform/.env`
- `storefront/.env`

Use the examples already in-repo:
- `api/.env.example`
- `platform/.env.example`
- `storefront/.env.example`

Required values:

```env
# api/.env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_ANON_KEY=<anon-key>
```

```env
# platform/.env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_URL=http://localhost:4000
```

```env
# storefront/.env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_URL=http://localhost:4000
```

## 3. Apply Database Schema and RLS

Open `SQL Editor` in Supabase and run scripts in order:

1. `supabase/sql/001_schema_and_rls.sql`
2. `supabase/sql/002_seed_demo.sql` (optional seed)
3. `supabase/sql/003_storage.sql`

What this creates:
- Core tables: `tenants`, `users`, `equipment`, `equipment_images`, `customers`, `bookings`, `maintenance_logs`
- Indexes and a booking overlap exclusion constraint
- RLS policies for tenant isolation
- Storage bucket `tenant-assets` with tenant-prefix policies

## 4. Create First Auth User + Tenant Membership

Create your first auth user in `Authentication -> Users` (email/password).

Then map that auth user to a tenant in SQL.
If `demo` does not exist yet, this snippet creates it first:

```sql
with tenant_row as (
  insert into public.tenants (slug, name, contact_email)
  values ('demo', 'Demo Rentals', 'hello@demo-rentals.test')
  on conflict (slug) do update set name = excluded.name
  returning id
)
insert into public.users (id, tenant_id, role, full_name)
select
  '<auth_user_uuid>'::uuid,
  tenant_row.id,
  'admin',
  'Demo Admin'
from tenant_row
on conflict (id) do update set
  tenant_id = excluded.tenant_id,
  role = excluded.role,
  full_name = excluded.full_name;
```

## 5. Run Apps

In three terminals:

```bash
cd api && npm run dev
cd platform && npm run dev
cd storefront && npm run dev
```

## 6. Verify

1. `GET /health` returns OK from API.
2. Register tenant works on `/signup` (or returns slug collision when duplicate).
3. Dashboard can fetch equipment/bookings with authenticated user.
4. Storefront resolves tenant branding from `/api/v1/tenant/:slug/public`.

## Notes

- Current API supports a dev fallback token (`dev-admin-token`) when Supabase keys are missing; with keys configured, auth middleware validates real Supabase JWTs.
- The Supabase CLI is not installed in this workspace. If you want, we can add CLI-based migration workflow next (`supabase init`, local containers, and `db push`).
