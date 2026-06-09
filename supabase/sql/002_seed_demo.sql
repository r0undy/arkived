-- Arkived seed data (optional for local/dev)
-- Run after 001_schema_and_rls.sql

do $$
declare
  tenant_uuid uuid;
  customer_uuid uuid;
  eq1 uuid;
  eq2 uuid;
begin
  insert into public.tenants (slug, name, contact_email, contact_phone, contact_address)
  values ('demo', 'Demo Rentals', 'hello@demo-rentals.test', '+63 900 000 0000', 'Makati, Metro Manila')
  on conflict (slug) do update set name = excluded.name
  returning id into tenant_uuid;

  insert into public.customers (tenant_id, full_name, email, phone)
  values (tenant_uuid, 'Demo Customer', 'customer@demo.test', '+63 900 123 4567')
  returning id into customer_uuid;

  insert into public.equipment (tenant_id, name, description, category, daily_rate, deposit, quantity, status, condition, tags)
  values
    (tenant_uuid, 'Demo Equipment 1', 'Description for demo equipment 1.', 'Media & Film', 1300, 1000, 1, 'available', 'good', array['demo','rental']),
    (tenant_uuid, 'Demo Equipment 2', 'Description for demo equipment 2.', 'Construction', 1400, 1000, 1, 'available', 'good', array['demo','rental'])
  returning id into eq1;

  select id into eq2
  from public.equipment
  where tenant_id = tenant_uuid
  order by created_at asc
  limit 1 offset 1;

  if eq2 is null then
    eq2 := eq1;
  end if;

  insert into public.bookings (
    tenant_id,
    equipment_id,
    customer_id,
    start_date,
    end_date,
    status,
    total_amount,
    deposit_paid
  )
  values (
    tenant_uuid,
    eq2,
    customer_uuid,
    current_date,
    current_date,
    'reserved',
    1400,
    false
  );
end $$;
