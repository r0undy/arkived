import { hasSupabaseClient, supabase } from './supabase.js';
import { compressImage } from './logoRender.jsx';

const fileExtension = (filename = '', fallback = 'png') => {
  const parts = String(filename).split('.');
  return parts.length > 1 ? parts.at(-1).toLowerCase() : fallback;
};

/**
 * Upload an image (File or Blob) to the tenant-scoped `tenant-assets` bucket.
 * Writes under `${tenantId}/...` to satisfy the storage RLS policy.
 */
export async function uploadTenantAsset({ tenantId, kind, file, filename, compress = true }) {
  if (!hasSupabaseClient || !supabase) {
    throw new Error('Supabase storage is not configured.');
  }
  if (!tenantId) {
    throw new Error('Tenant session not ready. Please retry in a moment.');
  }

  const isSvg = file.type === 'image/svg+xml';
  const payload = compress && !isSvg ? await compressImage(file) : file;
  const ext = isSvg ? 'svg' : fileExtension(filename || file.name || '', payload.type?.includes('png') ? 'png' : 'jpg');
  const path = `${tenantId}/${kind}/${kind}-${Date.now()}.${ext}`;
  const bucket = supabase.storage.from('tenant-assets');

  const { error: uploadError } = await bucket.upload(path, payload, {
    cacheControl: '3600',
    upsert: true,
    contentType: payload.type || file.type || undefined
  });

  if (uploadError) {
    throw new Error(uploadError.message || 'Upload failed');
  }

  const { data } = bucket.getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('Failed to resolve uploaded file URL');
  }
  return data.publicUrl;
}
