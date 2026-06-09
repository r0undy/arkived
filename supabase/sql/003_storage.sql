-- Arkived storage bucket and policies
-- Run after 001_schema_and_rls.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-assets',
  'tenant-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Users can only write into their tenant prefix: {tenant_id}/...
drop policy if exists tenant_assets_insert on storage.objects;
create policy tenant_assets_insert on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'tenant-assets'
  and split_part(name, '/', 1) = (public.current_tenant_id())::text
);

drop policy if exists tenant_assets_select on storage.objects;
create policy tenant_assets_select on storage.objects
for select
to authenticated
using (
  bucket_id = 'tenant-assets'
  and split_part(name, '/', 1) = (public.current_tenant_id())::text
);

drop policy if exists tenant_assets_update on storage.objects;
create policy tenant_assets_update on storage.objects
for update
to authenticated
using (
  bucket_id = 'tenant-assets'
  and split_part(name, '/', 1) = (public.current_tenant_id())::text
)
with check (
  bucket_id = 'tenant-assets'
  and split_part(name, '/', 1) = (public.current_tenant_id())::text
);

drop policy if exists tenant_assets_delete on storage.objects;
create policy tenant_assets_delete on storage.objects
for delete
to authenticated
using (
  bucket_id = 'tenant-assets'
  and split_part(name, '/', 1) = (public.current_tenant_id())::text
);
