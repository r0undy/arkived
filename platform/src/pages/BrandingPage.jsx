import { useEffect, useMemo, useState } from 'react';
import { Monitor, Smartphone, Image as ImageIcon, Sparkles, Globe, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { hasSupabaseClient } from '../lib/supabase';
import { uploadTenantAsset } from '../lib/storage';
import { presetToPngBlob } from '../lib/logoRender.jsx';
import { contrastRatio, darken, readableTextColor } from '../lib/colors';
import { Button, Card, Input, Textarea, Switch, Modal, useToast, Skeleton } from '../components/ui';
import ImageUploader from '../components/ImageUploader';
import LogoPicker from '../components/LogoPicker';
import BusinessHoursEditor from '../components/BusinessHoursEditor';

const initialForm = {
  name: '',
  logo_url: '',
  accent_color: '#6366f1',
  banner_image_url: '',
  tagline: '',
  meta_description: '',
  favicon_url: '',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  business_hours: {},
  show_watermark: true
};

const SWATCHES = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#0f172a'];

export default function BrandingPage() {
  const auth = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [savedForm, setSavedForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, banner: false });
  const [uploadError, setUploadError] = useState({ logo: '', banner: '' });
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [slug, setSlug] = useState('');

  const loadBranding = async () => {
    setLoading(true);
    try {
      const result = await api.tenant();
      const tenant = result.tenant || {};
      setSlug(tenant.slug || '');
      const next = {
        name: tenant.name || '',
        logo_url: tenant.logo_url || '',
        accent_color: tenant.accent_color || '#6366f1',
        banner_image_url: tenant.banner_image_url || '',
        tagline: tenant.tagline || '',
        meta_description: tenant.meta_description || '',
        favicon_url: tenant.favicon_url || '',
        contact_email: tenant.contact_email || '',
        contact_phone: tenant.contact_phone || '',
        contact_address: tenant.contact_address || '',
        business_hours: tenant.business_hours || {},
        show_watermark: Boolean(tenant.show_watermark)
      };
      setForm(next);
      setSavedForm(next);
    } catch {
      toast.push('Failed to load branding settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const ratio = useMemo(() => contrastRatio(form.accent_color, '#ffffff'), [form.accent_color]);
  const passesAa = ratio ? ratio >= 4.5 : false;
  const accentText = readableTextColor(form.accent_color);
  const accentHover = darken(form.accent_color, 0.1);

  const uploadAsset = async (kind, file) => {
    setUploadError((prev) => ({ ...prev, [kind]: '' }));
    setUploading((prev) => ({ ...prev, [kind]: true }));
    try {
      const url = await uploadTenantAsset({ tenantId: auth.user?.tenant_id, kind, file });
      const patch = kind === 'logo' ? { logo_url: url, favicon_url: url } : { banner_image_url: url };
      setForm((prev) => ({ ...prev, ...patch }));
      await api.updateBranding(patch);
      setSavedForm((prev) => ({ ...prev, ...patch }));
      toast.push(`${kind === 'logo' ? 'Logo' : 'Banner'} uploaded.`, 'success');
    } catch (err) {
      setUploadError((prev) => ({ ...prev, [kind]: err.message || 'Upload failed' }));
      toast.push(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading((prev) => ({ ...prev, [kind]: false }));
    }
  };

  const applyPreset = async ({ preset, color, shape, background }) => {
    setApplyingPreset(true);
    try {
      const blob = await presetToPngBlob({ preset, color, shape, background });
      const file = new File([blob], `${preset.id}-logo.png`, { type: 'image/png' });
      const url = await uploadTenantAsset({ tenantId: auth.user?.tenant_id, kind: 'logo', file });
      const patch = { logo_url: url, favicon_url: url };
      setForm((prev) => ({ ...prev, ...patch }));
      await api.updateBranding(patch);
      setSavedForm((prev) => ({ ...prev, ...patch }));
      toast.push('Logo applied.', 'success');
      setLogoPickerOpen(false);
    } catch (err) {
      toast.push(err.message || 'Could not apply logo.', 'error');
    } finally {
      setApplyingPreset(false);
    }
  };

  const onSave = async (event) => {
    event.preventDefault();
    if (!passesAa) {
      toast.push('Accent color fails the AA contrast check. Pick a darker color.', 'warning');
      return;
    }
    setSaving(true);
    try {
      await api.updateBranding(form);
      setSavedForm(form);
      toast.push('Branding saved.', 'success');
    } catch (err) {
      toast.push(err.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm]
  );

  const resetToSaved = () => {
    if (!isDirty) return;
    setForm(savedForm);
    setUploadError({ logo: '', banner: '' });
    toast.push('Reverted to last saved.', 'info');
  };

  const metaPreview =
    form.meta_description ||
    `Browse equipment rentals from ${form.name || 'your shop'} and send a booking inquiry in minutes.`;

  // Mirror the storefront Meta OG fallback chain: og_image → banner → logo.
  const ogImage = form.banner_image_url || form.logo_url || '';
  const storefrontHost = slug ? `${slug}.arkived.dev` : 'your-shop.arkived.dev';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Branding studio</h1>
        <p className="text-sm text-neutral-400">Customize your storefront identity. Changes preview live — save when you're happy.</p>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,420px)]">
          {/* Controls */}
          <form className="space-y-5" onSubmit={onSave}>
            <Card>
              <h2 className="mb-3 text-md font-semibold">Identity</h2>
              <div className="space-y-4">
                <Input label="Shop name" value={form.name} onChange={(e) => setField('name')(e.target.value)} required />
                <Input
                  label="Tagline"
                  value={form.tagline}
                  onChange={(e) => setField('tagline')(e.target.value)}
                  placeholder="Pro gear for every project"
                  helper="A short value proposition shown under your shop name."
                  maxLength={160}
                />

                <div>
                  <p className="mb-1.5 text-sm font-medium text-neutral-200">Logo</p>
                  <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                    <ImageUploader
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      maxSizeMb={2}
                      aspect="aspect-square"
                      hint="PNG/SVG, ≤2MB"
                      previewUrl={form.logo_url}
                      uploading={uploading.logo}
                      disabled={!hasSupabaseClient || auth.loading}
                      error={uploadError.logo}
                      onFile={(file) => uploadAsset('logo', file)}
                      onClear={() => setForm((prev) => ({ ...prev, logo_url: '', favicon_url: '' }))}
                    />
                    <div className="flex flex-col justify-center gap-2">
                      <p className="text-sm text-neutral-400">No logo? Pick a designer-made mark and recolor it to match your brand.</p>
                      <Button type="button" variant="secondary" size="sm" icon={Sparkles} onClick={() => setLogoPickerOpen(true)}>
                        Choose from gallery
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 text-md font-semibold">Accent color</h2>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => setField('accent_color')(swatch)}
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        form.accent_color.toLowerCase() === swatch.toLowerCase() ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: swatch }}
                      aria-label={`Use ${swatch}`}
                    />
                  ))}
                </div>
                <div className="flex items-end gap-3">
                  <label className="text-sm text-neutral-200">
                    <span className="mb-1 block font-medium">Picker</span>
                    <input
                      type="color"
                      value={form.accent_color}
                      onChange={(e) => setField('accent_color')(e.target.value)}
                      className="h-10 w-14 rounded-md border border-neutral-750 bg-neutral-950"
                    />
                  </label>
                  <div className="flex-1">
                    <Input
                      label="Hex"
                      value={form.accent_color}
                      onChange={(e) => setField('accent_color')(e.target.value)}
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
                <div
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    passesAa ? 'border-success-500/30 text-success-500' : 'border-warning-500/30 text-warning-500'
                  }`}
                >
                  {passesAa ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
                  <span>
                    Contrast vs white {ratio ? `${ratio.toFixed(2)}:1` : '--'} —{' '}
                    {passesAa ? 'great contrast' : 'too light, text may be hard to read'}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 text-md font-semibold">Banner</h2>
              <ImageUploader
                accept="image/jpeg,image/webp,image/png"
                maxSizeMb={5}
                hint="JPEG/WebP, recommended 1440×560, ≤5MB"
                previewUrl={form.banner_image_url}
                uploading={uploading.banner}
                disabled={!hasSupabaseClient || auth.loading}
                error={uploadError.banner}
                onFile={(file) => uploadAsset('banner', file)}
                onClear={() => setField('banner_image_url')('')}
              />
            </Card>

            <Card>
              <h2 className="mb-1 text-md font-semibold">Metadata, favicon & SEO</h2>
              <p className="mb-3 text-sm text-neutral-400">How your storefront appears in browser tabs, search results, and shared links.</p>
              <div className="space-y-4">
                <Textarea
                  label="Search & social description"
                  value={form.meta_description}
                  onChange={(e) => setField('meta_description')(e.target.value)}
                  placeholder={metaPreview}
                  rows={3}
                  maxLength={300}
                  helper={`${form.meta_description.length}/300 — appears in Google results and social shares.`}
                />
                <div className="rounded-md border border-neutral-750 bg-neutral-950 p-3">
                  <div className="flex items-center gap-2">
                    {form.favicon_url || form.logo_url ? (
                      <img src={form.favicon_url || form.logo_url} alt="Favicon preview" className="h-5 w-5 rounded" />
                    ) : (
                      <div className="h-5 w-5 rounded" style={{ backgroundColor: form.accent_color }} />
                    )}
                    <span className="text-sm text-neutral-300">{form.name || 'Your shop'} — browser tab preview</span>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">The favicon is generated from your logo. Upload a logo or pick one from the gallery to set it.</p>
                </div>

                <div>
                  <p className="mb-1.5 text-sm font-medium text-neutral-200">Social share preview</p>
                  <div className="overflow-hidden rounded-lg border border-neutral-750 bg-neutral-950">
                    <div className="aspect-1200/630 w-full bg-neutral-900">
                      {ogImage ? (
                        <img src={ogImage} alt="Social card preview" className="h-full w-full object-cover" />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center"
                          style={{ backgroundColor: form.accent_color, color: accentText }}
                        >
                          <span className="text-lg font-bold">{form.name || 'Your shop'}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-neutral-750 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{storefrontHost}</p>
                      <p className="truncate text-sm font-semibold text-neutral-100">{form.name || 'Your shop'}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">{metaPreview}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">How your link looks when shared on social media. Uses your banner, then logo, as the image.</p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 text-md font-semibold">Contact & footer</h2>
              <div className="space-y-4">
                <Input label="Contact email" type="email" value={form.contact_email} onChange={(e) => setField('contact_email')(e.target.value)} />
                <Input label="Contact phone" value={form.contact_phone} onChange={(e) => setField('contact_phone')(e.target.value)} />
                <Input label="Contact address" value={form.contact_address} onChange={(e) => setField('contact_address')(e.target.value)} />
                <div>
                  <p className="mb-1.5 text-sm font-medium text-neutral-200">Business hours</p>
                  <p className="mb-2 text-xs text-neutral-400">Powers the storefront “Open now” indicator. Times use your shop’s local time.</p>
                  <BusinessHoursEditor value={form.business_hours} onChange={setField('business_hours')} />
                </div>
                <Switch
                  checked={form.show_watermark}
                  onChange={setField('show_watermark')}
                  label="Show “Powered by Arkived”"
                  description="Display the Arkived badge in your storefront footer."
                />
              </div>
            </Card>

            {!hasSupabaseClient ? (
              <p className="text-xs text-warning-500">Supabase not configured: uploads are disabled in this environment.</p>
            ) : null}

            <div className="pb-safe sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-neutral-750 bg-neutral-900/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-4">
              {isDirty ? (
                <span className="mr-auto inline-flex items-center gap-1.5 text-xs text-warning-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning-500" aria-hidden="true" />
                  Unsaved changes
                </span>
              ) : null}
              <Button type="button" variant="ghost" onClick={resetToSaved} disabled={saving || !isDirty}>
                Reset to last saved
              </Button>
              <Button type="submit" loading={saving} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </form>

          {/* Live preview */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-200">Live preview</p>
              <div className="inline-flex rounded-md border border-neutral-750 p-0.5">
                <button
                  type="button"
                  onClick={() => setDevice('desktop')}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${device === 'desktop' ? 'bg-neutral-750 text-neutral-50' : 'text-neutral-400'}`}
                  aria-pressed={device === 'desktop'}
                >
                  <Monitor className="h-3.5 w-3.5" aria-hidden="true" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('mobile')}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${device === 'mobile' ? 'bg-neutral-750 text-neutral-50' : 'text-neutral-400'}`}
                  aria-pressed={device === 'mobile'}
                >
                  <Smartphone className="h-3.5 w-3.5" aria-hidden="true" /> Mobile
                </button>
              </div>
            </div>

            <div className={`mx-auto overflow-hidden rounded-xl border border-neutral-750 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.5)] ${device === 'mobile' ? 'max-w-[320px]' : 'w-full'}`}>
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <div className="ml-2 flex items-center gap-1.5 rounded bg-white px-2 py-0.5 text-[10px] text-slate-500">
                  {form.favicon_url || form.logo_url ? (
                    <img src={form.favicon_url || form.logo_url} alt="" className="h-3 w-3 rounded-sm" />
                  ) : (
                    <Globe className="h-3 w-3" aria-hidden="true" />
                  )}
                  <span className="truncate">{form.name || 'your-shop'}</span>
                </div>
              </div>

              <div
                className="relative flex min-h-35 flex-col justify-end p-4"
                style={
                  form.banner_image_url
                    ? { backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.75), rgba(15,23,42,0.1)), url(${form.banner_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: `linear-gradient(135deg, ${form.accent_color}, ${accentHover})` }
                }
              >
                <div className="flex items-center gap-2">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="" className="h-8 w-8 rounded bg-white/90 object-contain p-0.5" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-white/90">
                      <ImageIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    </div>
                  )}
                  <span className="text-base font-bold text-white drop-shadow">{form.name || 'Your shop name'}</span>
                </div>
                <p className="mt-1 text-xs text-white/90 drop-shadow">{form.tagline || 'Your tagline goes here'}</p>
                <button
                  type="button"
                  className="mt-3 inline-flex w-fit rounded-md px-3 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: form.accent_color, color: accentText }}
                >
                  Browse the catalog
                </button>
              </div>

              <div className="space-y-3 p-4 text-slate-900">
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="overflow-hidden rounded-lg border border-slate-200">
                      <div className="h-14 bg-slate-100" />
                      <div className="p-2">
                        <p className="text-[11px] font-semibold">Sample item {i}</p>
                        <p className="text-[10px]" style={{ color: form.accent_color }}>PHP 1,200 / day</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-500">
                  <p>{form.contact_email || 'hello@example.com'}</p>
                  {form.show_watermark ? <p className="mt-1">Powered by Arkived</p> : null}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-neutral-750 bg-neutral-800 p-3">
              <p className="mb-2 text-xs font-semibold text-neutral-400">Search result preview</p>
              <p className="text-sm text-info-500">{form.name || 'Your shop'} — Equipment Rentals</p>
              <p className="text-xs text-success-500">{form.name ? `${form.name.toLowerCase().replace(/\s+/g, '')}.arkived.dev` : 'your-shop.arkived.dev'}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">{metaPreview}</p>
            </div>
          </div>
        </div>
      )}

      <Modal open={logoPickerOpen} onClose={() => setLogoPickerOpen(false)} title="Choose a logo" size="lg">
        <LogoPicker
          accentColor={form.accent_color}
          applying={applyingPreset}
          onApply={applyPreset}
          onCancel={() => setLogoPickerOpen(false)}
        />
      </Modal>
    </div>
  );
}
