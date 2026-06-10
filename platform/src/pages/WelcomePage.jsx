import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  PartyPopper,
  Sparkles,
  Store
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { LOGO_PRESETS, LogoPresetMark } from '../lib/logoPresets';
import { presetToPngBlob } from '../lib/logoRender.jsx';
import { uploadTenantAsset } from '../lib/storage';
import { contrastRatio, darken } from '../lib/colors';
import { dismissWelcome, GO_LIVE_STEP } from '../lib/onboarding';
import { Input, Textarea } from '../components/ui';
import Button from '../components/ui/Button';

const SWATCHES = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#0f172a'];
const STOREFRONT_DOMAIN = import.meta.env.VITE_STOREFRONT_DOMAIN || 'arkived.dev';

const STEPS = ['Your shop', 'Pick a look', 'First item', 'Go live'];

export default function WelcomePage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [tenant, setTenant] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [shopName, setShopName] = useState('');
  const [accent, setAccent] = useState('#6366f1');
  const [presetId, setPresetId] = useState('box');
  const [item, setItem] = useState({ name: '', category: '', daily_rate: '', description: '' });

  useEffect(() => {
    let mounted = true;
    api.tenant()
      .then((result) => {
        if (!mounted) return;
        const t = result.tenant;
        setTenant(t);
        setShopName(t?.name || '');
        if (/^#[0-9a-f]{6}$/i.test(t?.accent_color || '')) setAccent(t.accent_color);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const storefrontUrl = useMemo(
    () => (tenant?.slug ? `${tenant.slug}.${STOREFRONT_DOMAIN}` : `your-shop.${STOREFRONT_DOMAIN}`),
    [tenant]
  );

  const contrast = useMemo(() => contrastRatio(accent, '#ffffff'), [accent]);
  const passesAa = contrast >= 4.5;
  const accentHover = useMemo(() => darken(accent, 0.1), [accent]);
  const activePreset = useMemo(() => LOGO_PRESETS.find((p) => p.id === presetId) || LOGO_PRESETS[0], [presetId]);

  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const saveShopName = async () => {
    setError('');
    if (shopName.trim().length < 2) {
      setError('Please enter a shop name (at least 2 characters).');
      return;
    }
    setSaving(true);
    try {
      const result = await api.updateBranding({ name: shopName.trim() });
      setTenant(result.tenant);
      goNext();
    } catch (err) {
      setError(err.message || 'Could not save your shop name.');
    } finally {
      setSaving(false);
    }
  };

  const saveLook = async () => {
    setError('');
    if (!passesAa) {
      setError('That accent is too light for white text. Pick a deeper shade for readable buttons.');
      return;
    }
    setSaving(true);
    try {
      const payload = { accent_color: accent };
      const completed = ['set_accent_color'];
      try {
        const blob = await presetToPngBlob({ preset: activePreset, color: accent, shape: 'rounded', background: '#0f172a' });
        const file = new File([blob], `logo-${activePreset.id}.png`, { type: 'image/png' });
        const url = await uploadTenantAsset({ tenantId: auth.user?.tenant_id, kind: 'logo', file });
        payload.logo_url = url;
        payload.favicon_url = url;
        completed.push('upload_logo');
      } catch (_uploadError) {
        // Storage may be unconfigured locally — still save the accent color.
      }
      payload.onboarding_completed_steps = Array.from(
        new Set([...(tenant?.onboarding_completed_steps || []), ...completed])
      );
      const result = await api.updateBranding(payload);
      setTenant(result.tenant);
      goNext();
    } catch (err) {
      setError(err.message || 'Could not save your branding.');
    } finally {
      setSaving(false);
    }
  };

  const saveFirstItem = async () => {
    setError('');
    const rate = Number(item.daily_rate);
    if (item.name.trim().length < 2 || item.category.trim().length < 2 || !Number.isFinite(rate) || rate < 0) {
      setError('Add a name, category, and a daily rate to list your first item.');
      return;
    }
    setSaving(true);
    try {
      await api.createEquipment({
        name: item.name.trim(),
        category: item.category.trim(),
        daily_rate: rate,
        description: item.description.trim()
      });
      try {
        await api.updateBranding({
          onboarding_completed_steps: Array.from(
            new Set([...(tenant?.onboarding_completed_steps || []), 'set_accent_color', 'add_first_equipment'])
          )
        });
      } catch (_syncError) {
        // Non-blocking.
      }
      goNext();
    } catch (err) {
      setError(err.message || 'Could not add your first item.');
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setError('');
    setSaving(true);
    try {
      // Persisting `go_live` is what publishes the storefront and unlocks the
      // dashboard — it must succeed before we leave the wizard.
      const result = await api.updateBranding({
        onboarding_completed_steps: Array.from(
          new Set([...(tenant?.onboarding_completed_steps || []), GO_LIVE_STEP])
        )
      });
      setTenant(result.tenant);
      dismissWelcome();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not finish setup. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-neutral-900 text-neutral-100">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Store aria-hidden="true" className="h-5 w-5 text-brand-400" />
          Arkived
        </div>
        <span className="text-xs text-neutral-500">Finish setup to publish your storefront</span>
      </header>

      {/* Stepper */}
      <div className="mx-auto w-full max-w-2xl px-5 sm:px-8">
        <ol className="flex items-center gap-2">
          {STEPS.map((label, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? 'bg-success-500 text-white'
                      : active
                        ? 'bg-brand-500 text-white'
                        : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className={`hidden text-xs sm:block ${active ? 'text-neutral-100' : 'text-neutral-500'}`}>{label}</span>
                {index < STEPS.length - 1 ? (
                  <span className={`h-px flex-1 ${done ? 'bg-success-500/50' : 'bg-neutral-800'}`} />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      <main className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8">
        {error ? (
          <p className="mb-4 rounded-md border border-danger-500/40 bg-danger-500/10 px-3 py-2 text-sm text-danger-500" role="alert">
            {error}
          </p>
        ) : null}

        {/* Step 1 — Your shop */}
        {step === 0 ? (
          <section className="animate-[fadeInUp_0.3s_ease-out]">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome — let's name your shop</h1>
            <p className="mt-2 text-sm text-neutral-400">This is what customers see at the top of your storefront.</p>

            <div className="mt-6">
              <Input
                label="Shop name"
                value={shopName}
                onChange={(event) => setShopName(event.target.value)}
                placeholder="e.g. Northside Tool Rentals"
                autoFocus
              />
            </div>

            <div className="mt-4 rounded-lg border border-neutral-750 bg-neutral-950 px-4 py-3">
              <p className="text-xs text-neutral-500">Your storefront address</p>
              <p className="mt-0.5 font-mono text-sm text-brand-400">{storefrontUrl}</p>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={saveShopName} loading={saving} iconRight={ArrowRight}>
                Continue
              </Button>
            </div>
          </section>
        ) : null}

        {/* Step 2 — Pick a look */}
        {step === 1 ? (
          <section className="animate-[fadeInUp_0.3s_ease-out]">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pick a look</h1>
            <p className="mt-2 text-sm text-neutral-400">Choose a logo and an accent color. You can fine-tune everything later.</p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-neutral-200">Logo</p>
                <div className="grid grid-cols-4 gap-2">
                  {LOGO_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPresetId(preset.id)}
                      className={`flex aspect-square items-center justify-center rounded-lg border transition ${
                        preset.id === presetId
                          ? 'border-brand-500 ring-2 ring-brand-500/40'
                          : 'border-neutral-750 hover:border-neutral-600'
                      }`}
                      style={{ background: '#0f172a' }}
                      title={preset.name}
                      aria-label={preset.name}
                      aria-pressed={preset.id === presetId}
                    >
                      <LogoPresetMark preset={preset} color={accent} shape="none" className="h-8 w-8" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-neutral-200">Accent color</p>
                <div className="flex flex-wrap gap-2">
                  {SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => setAccent(swatch)}
                      className={`h-9 w-9 rounded-full border-2 transition ${
                        accent.toLowerCase() === swatch.toLowerCase() ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ background: swatch }}
                      aria-label={`Accent ${swatch}`}
                      aria-pressed={accent.toLowerCase() === swatch.toLowerCase()}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="color"
                    value={accent}
                    onChange={(event) => setAccent(event.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-neutral-750 bg-neutral-950"
                    aria-label="Custom accent color"
                  />
                  <span className="font-mono text-sm text-neutral-300">{accent.toUpperCase()}</span>
                </div>
                <p className={`mt-2 text-xs ${passesAa ? 'text-success-500' : 'text-warning-500'}`}>
                  {passesAa
                    ? `Great contrast (${contrast.toFixed(1)}:1 on white).`
                    : `Too light (${contrast.toFixed(1)}:1) — pick a deeper shade.`}
                </p>
              </div>
            </div>

            {/* Live mini preview */}
            <div className="mt-6 overflow-hidden rounded-xl border border-neutral-750">
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#0f172a' }}>
                <LogoPresetMark preset={activePreset} color={accent} shape="rounded" className="h-9 w-9" />
                <span className="text-sm font-semibold text-white">{shopName || 'Your Shop'}</span>
                <span
                  className="ml-auto rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ background: passesAa ? accent : accentHover }}
                >
                  Rent now
                </span>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={goBack} icon={ArrowLeft}>
                Back
              </Button>
              <Button onClick={saveLook} loading={saving} disabled={!passesAa} iconRight={ArrowRight}>
                Continue
              </Button>
            </div>
          </section>
        ) : null}

        {/* Step 3 — First item */}
        {step === 2 ? (
          <section className="animate-[fadeInUp_0.3s_ease-out]">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add your first item</h1>
            <p className="mt-2 text-sm text-neutral-400">Your storefront needs at least one thing to rent. Add more later.</p>

            <div className="mt-6 grid gap-4">
              <Input
                label="Item name"
                value={item.name}
                onChange={(event) => setItem((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Cordless Drill"
                autoFocus
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Category"
                  value={item.category}
                  onChange={(event) => setItem((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="e.g. Power Tools"
                />
                <Input
                  label="Daily rate (PHP)"
                  type="number"
                  min="0"
                  value={item.daily_rate}
                  onChange={(event) => setItem((prev) => ({ ...prev, daily_rate: event.target.value }))}
                  placeholder="500"
                />
              </div>
              <Textarea
                label="Short description"
                rows={3}
                value={item.description}
                onChange={(event) => setItem((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="What is it, and what's it good for?"
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={goBack} icon={ArrowLeft}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={goNext} disabled={saving}>
                  Skip
                </Button>
                <Button onClick={saveFirstItem} loading={saving} iconRight={ArrowRight}>
                  Add item
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {/* Step 4 — Go live */}
        {step === 3 ? (
          <section className="animate-[fadeInUp_0.3s_ease-out] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-500/15">
              <PartyPopper aria-hidden="true" className="h-8 w-8 text-success-500" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">You're live</h1>
            <p className="mt-2 text-sm text-neutral-400">Your storefront is ready. Share the link and start taking bookings.</p>

            <div className="mx-auto mt-6 max-w-md rounded-lg border border-neutral-750 bg-neutral-950 px-4 py-3">
              <p className="text-xs text-neutral-500">Your storefront</p>
              <p className="mt-0.5 font-mono text-sm text-brand-400">{storefrontUrl}</p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                as="a"
                href={`https://${storefrontUrl}`}
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                iconRight={ExternalLink}
              >
                View my storefront
              </Button>
              <Button onClick={finish} icon={Sparkles} loading={saving}>
                Go to dashboard
              </Button>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
