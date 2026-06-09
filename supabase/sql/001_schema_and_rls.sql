-- Arkived Supabase bootstrap: schema + RLS
-- Apply in Supabase SQL Editor (or supabase db push).

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  accent_color text not null default '#6366f1' check (accent_color ~* '^#[0-9A-F]{6}$'),
  banner_image_url text,
  contact_email text,
  contact_phone text,
  contact_address text,
  show_watermark boolean not null default true,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null check (role in ('admin', 'staff', 'platform_owner')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  daily_rate numeric(10, 2) not null check (daily_rate >= 0),
  deposit numeric(10, 2) not null default 0 check (deposit >= 0),
  quantity integer not null default 1 check (quantity >= 1),
  status text not null default 'available' check (status in ('available', 'rented', 'maintenance', 'archived')),
  condition text not null default 'good' check (condition in ('excellent', 'good', 'fair', 'needs_repair')),
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.equipment_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  storage_url text not null,
  is_primary boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'reserved' check (status in ('reserved', 'payment', 'dispatched', 'returned', 'inspected', 'closed')),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  deposit_paid boolean not null default false,
  payment_reference text,
  dispatch_condition text,
  return_condition text,
  overdue boolean not null default false,
  created_at timestamptz not null default now(),
  check (start_date <= end_date)
);

create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  service_date date not null,
  service_type text not null check (service_type in ('routine', 'repair', 'inspection', 'cleaning')),
  performed_by text,
  notes text,
  cost numeric(10, 2),
  next_service_due date,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_tenant_id on public.users(tenant_id);
create index if not exists idx_equipment_tenant_id on public.equipment(tenant_id);
create index if not exists idx_equipment_deleted_at on public.equipment(deleted_at);
create index if not exists idx_equipment_name on public.equipment(name);
create index if not exists idx_bookings_tenant_id on public.bookings(tenant_id);
create index if not exists idx_bookings_equipment_id on public.bookings(equipment_id);
create index if not exists idx_bookings_date_span on public.bookings(start_date, end_date);
create index if not exists idx_customers_tenant_id on public.customers(tenant_id);
create index if not exists idx_maintenance_logs_tenant_id on public.maintenance_logs(tenant_id);

-- Prevent overlapping active booking windows per equipment.
alter table public.bookings
  drop constraint if exists bookings_no_overlap_active;

alter table public.bookings
  add constraint bookings_no_overlap_active
  exclude using gist (
    equipment_id with =,
    daterange(start_date, end_date, '[]') with &&
  )
  where (status in ('reserved', 'payment', 'dispatched'));

alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_images enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.maintenance_logs enable row level security;

-- Tenant helper expression.
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select u.tenant_id
  from public.users u
  where u.id = auth.uid();
$$;

-- users
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
for select
using (id = auth.uid());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
for update
using (id = auth.uid())
with check (id = auth.uid());

-- tenants: public read for storefront resolution; tenant admins/staff can read own tenant row too.
drop policy if exists tenants_public_read on public.tenants;
create policy tenants_public_read on public.tenants
for select
using (true);

drop policy if exists tenants_update_own on public.tenants;
create policy tenants_update_own on public.tenants
for update
using (id = public.current_tenant_id())
with check (id = public.current_tenant_id());

-- common tenant isolation policies
drop policy if exists equipment_tenant_isolation on public.equipment;
create policy equipment_tenant_isolation on public.equipment
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists equipment_images_tenant_isolation on public.equipment_images;
create policy equipment_images_tenant_isolation on public.equipment_images
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists customers_tenant_isolation on public.customers;
create policy customers_tenant_isolation on public.customers
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists bookings_tenant_isolation on public.bookings;
create policy bookings_tenant_isolation on public.bookings
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists maintenance_logs_tenant_isolation on public.maintenance_logs;
create policy maintenance_logs_tenant_isolation on public.maintenance_logs
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());
