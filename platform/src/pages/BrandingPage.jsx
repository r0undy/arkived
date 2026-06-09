import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { hasSupabaseClient, supabase } from '../lib/supabase';

const initialForm = {
  name: '',
  logo_url: '',
  accent_color: '#6366f1',
  banner_image_url: '',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  show_watermark: true
};

const hexToRgb = (hex) => {
  const match = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!match) return null;
  const value = match[1];
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
};

const linearize = (channel) => {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
};

const contrastRatio = (hexA, hexB) => {
  const a = luminance(hexA);
  const b = luminance(hexB);
  if (a === null || b === null) return null;

  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
};

const fileExtension = (filename = '') => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.at(-1).toLowerCase() : 'png';
};

export default function BrandingPage() {
  const auth = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ saving: false, error: '', message: '' });
  const [uploading, setUploading] = useState({ logo: false, banner: false });
  const [lastFailedUpload, setLastFailedUpload] = useState(null);

  const loadBranding = async () => {
    setLoading(true);
    try {
      const result = await api.tenant();
      const tenant = result.tenant;
      setForm({
        name: tenant.name || '',
        logo_url: tenant.logo_url || '',
        accent_color: tenant.accent_color || '#6366f1',
        banner_image_url: tenant.banner_image_url || '',
        contact_email: tenant.contact_email || '',
        contact_phone: tenant.contact_phone || '',
        contact_address: tenant.contact_address || '',
        show_watermark: Boolean(tenant.show_watermark)
      });
    } catch (_err) {
      setStatus((prev) => ({ ...prev, error: 'Failed to load branding settings' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  const updateField = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadAsset = async (kind, file) => {
    if (!file) return;
    if (!hasSupabaseClient || !supabase) {
      setStatus({ saving: false, error: 'Supabase client is not configured for uploads.', message: '' });
      return;
    }

    const tenantId = auth.user?.tenant_id;
    if (!tenantId) {
      setStatus({ saving: false, error: 'User session not ready. Please retry in a moment.', message: '' });
      return;
    }

    setUploading((prev) => ({ ...prev, [kind]: true }));
    setStatus((prev) => ({ ...prev, error: '', message: '' }));

    try {
      const ext = fileExtension(file.name);
      const path = `${tenantId}/branding/${kind}-${Date.now()}.${ext}`;
      const bucket = supabase.storage.from('tenant-assets');

      const { error: uploadError } = await bucket.upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || undefined
      });

      if (uploadError) {
        throw new Error(uploadError.message || 'Upload failed');
      }

      const { data } = bucket.getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) {
        throw new Error('Failed to resolve uploaded file URL');
      }

      const patch = kind === 'logo'
        ? { logo_url: publicUrl }
        : { banner_image_url: publicUrl };

      await api.updateBranding(patch);

      setForm((prev) => ({
        ...prev,
        ...(kind === 'logo' ? { logo_url: publicUrl } : { banner_image_url: publicUrl })
      }));

      setStatus({ saving: false, error: '', message: `${kind === 'logo' ? 'Logo' : 'Banner'} uploaded.` });
      setLastFailedUpload(null);
    } catch (err) {
      setStatus({ saving: false, error: err.message || 'Upload failed', message: '' });
      setLastFailedUpload({ kind, file });
    } finally {
      setUploading((prev) => ({ ...prev, [kind]: false }));
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ saving: true, error: '', message: '' });

    try {
      await api.updateBranding(form);
      setStatus({ saving: false, error: '', message: 'Branding settings saved.' });
      await loadBranding();
    } catch (err) {
      setStatus({ saving: false, error: err.message || 'Failed to save', message: '' });
    }
  };

  const ratio = useMemo(() => contrastRatio(form.accent_color, '#ffffff'), [form.accent_color]);
  const ratioText = ratio ? ratio.toFixed(2) : '--';
  const passesAa = ratio ? ratio >= 4.5 : false;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Branding</h1>
      <p className="mt-2 text-sm text-neutral-400">Customize your storefront identity and contact display.</p>

      {loading ? <p className="mt-4 text-sm text-neutral-400">Loading settings...</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <form className="space-y-4 rounded-lg border border-neutral-750 bg-neutral-800 p-4" onSubmit={onSubmit}>
          <Field label="Shop name" value={form.name} onChange={updateField('name')} required />

          <Field label="Logo URL" value={form.logo_url} onChange={updateField('logo_url')} placeholder="https://..." />
          <UploadField
            disabled={!hasSupabaseClient || auth.loading || uploading.logo}
            label="Upload logo"
            onFile={(file) => uploadAsset('logo', file)}
            uploading={uploading.logo}
          />

          <div className="grid gap-3 md:grid-cols-[120px_1fr]">
            <label className="block text-sm text-neutral-200">
              <span>Accent color</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-neutral-750 bg-neutral-950 px-1"
                type="color"
                value={form.accent_color}
                onChange={updateField('accent_color')}
              />
            </label>
            <Field
              label="Hex value"
              value={form.accent_color}
              onChange={updateField('accent_color')}
              pattern="^#[0-9A-Fa-f]{6}$"
              required
            />
          </div>

          <div className="rounded-md border border-neutral-750 bg-neutral-900 px-3 py-2 text-sm">
            <p>
              Contrast vs white text: <span className="font-semibold">{ratioText}:1</span>{' '}
              <span className={passesAa ? 'text-success-500' : 'text-warning-500'}>
                {passesAa ? 'AA pass' : 'AA fail'}
              </span>
            </p>
          </div>

          <Field label="Banner image URL" value={form.banner_image_url} onChange={updateField('banner_image_url')} placeholder="https://..." />
          <UploadField
            disabled={!hasSupabaseClient || auth.loading || uploading.banner}
            label="Upload banner"
            onFile={(file) => uploadAsset('banner', file)}
            uploading={uploading.banner}
          />

          <Field label="Contact email" type="email" value={form.contact_email} onChange={updateField('contact_email')} />
          <Field label="Contact phone" value={form.contact_phone} onChange={updateField('contact_phone')} />
          <Field label="Contact address" value={form.contact_address} onChange={updateField('contact_address')} />

          <label className="flex items-center gap-2 text-sm text-neutral-200">
            <input
              type="checkbox"
              checked={form.show_watermark}
              onChange={updateField('show_watermark')}
            />
            <span>Show “Powered by Arkived” watermark</span>
          </label>

          {!hasSupabaseClient ? (
            <p className="text-xs text-warning-500">Supabase not configured: uploads are disabled, but URL fields still work.</p>
          ) : null}

          {status.error ? <p className="text-sm text-danger-500">{status.error}</p> : null}
          {status.message ? <p className="text-sm text-success-500">{status.message}</p> : null}
          {status.error && lastFailedUpload ? (
            <button
              className="rounded-md border border-neutral-750 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
              onClick={() => uploadAsset(lastFailedUpload.kind, lastFailedUpload.file)}
              type="button"
            >
              Retry failed upload
            </button>
          ) : null}

          <button
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
            disabled={status.saving}
            type="submit"
          >
            {status.saving ? 'Saving...' : 'Save branding'}
          </button>
        </form>

        <aside className="rounded-lg border border-neutral-750 bg-neutral-900 p-4">
          <p className="text-sm font-semibold text-neutral-200">Storefront Preview</p>
          <div className="mt-3 overflow-hidden rounded-md border border-neutral-750 bg-white">
            <div
              className="h-24"
              style={
                form.banner_image_url
                  ? {
                      backgroundImage: `url(${form.banner_image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }
                  : { background: 'linear-gradient(120deg, #e2e8f0, #f8fafc)' }
              }
            />
            <div className="space-y-2 p-3 text-slate-900">
              <div className="flex items-center gap-2">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="logo preview" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded bg-slate-200" />
                )}
                <p className="font-semibold">{form.name || 'Your shop name'}</p>
              </div>
              <button
                className="rounded px-3 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: form.accent_color || '#6366f1' }}
                type="button"
              >
                View catalog
              </button>
              <div className="pt-2 text-xs text-slate-600">
                <p>{form.contact_email || 'no-email@example.com'}</p>
                <p>{form.contact_phone || '+1 000 000 0000'}</p>
                <p>{form.contact_address || 'No address configured'}</p>
                {form.show_watermark ? <p className="mt-1">Powered by Arkived</p> : null}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block text-sm text-neutral-200">
      <span>{label}</span>
      <input className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2" {...props} />
    </label>
  );
}

function UploadField({ disabled, label, onFile, uploading }) {
  return (
    <label className="block text-sm text-neutral-200">
      <span>{label}</span>
      <input
        accept="image/*"
        className="mt-1 block w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2 text-xs"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
        type="file"
      />
      {uploading ? <span className="mt-1 block text-xs text-neutral-400">Uploading...</span> : null}
    </label>
  );
}
