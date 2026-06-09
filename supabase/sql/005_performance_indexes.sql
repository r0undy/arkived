-- Arkived performance index patch
-- Apply after 001_schema_and_rls.sql

-- Equipment filters frequently use tenant + status.
create index if not exists idx_equipment_tenant_status
  on public.equipment(tenant_id, status)
  where deleted_at is null;

-- Booking queries frequently filter by tenant, status, and date windows.
create index if not exists idx_bookings_tenant_status
  on public.bookings(tenant_id, status);

create index if not exists idx_bookings_tenant_start_date
  on public.bookings(tenant_id, start_date);

create index if not exists idx_bookings_tenant_end_date
  on public.bookings(tenant_id, end_date);

create index if not exists idx_bookings_status_start_date
  on public.bookings(status, start_date);

create index if not exists idx_bookings_status_end_date
  on public.bookings(status, end_date);
