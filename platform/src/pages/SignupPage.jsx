import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe } from 'lucide-react';
import { api } from '../lib/api';
import TurnstileWidget from '../components/TurnstileWidget';

const initialState = {
  name: '',
  slug: '',
  email: '',
  password: ''
};

const slugify = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-{2,}/g, '-')
  .slice(0, 32)
  .replace(/-+$/g, '');

export default function SignupPage() {
  const [form, setForm] = useState(initialState);
  const [slugTouched, setSlugTouched] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });
  const [provisioning, setProvisioning] = useState({
    active: false,
    done: false,
    progress: 0,
    tenantSlug: '',
    tenantUrl: '',
    accountEmail: '',
    warning: ''
  });
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
  const rootDomain = (import.meta.env.VITE_ROOT_DOMAIN || 'arkived.dev')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  const update = (key) => (event) => {
    const value = event.target.value;

    if (key === 'name') {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug: slugTouched ? prev.slug : slugify(value)
      }));
      return;
    }

    if (key === 'slug') {
      setSlugTouched(true);
      setForm((prev) => ({ ...prev, slug: slugify(value) }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const checkTenantRoute = async (tenantSlug, tenantUrl) => {
    try {
      await api.request(`/api/v1/tenant/${tenantSlug}/public`);
    } catch (_error) {
      return false;
    }

    try {
      await fetch(`${tenantUrl}/_edge/health?t=${Date.now()}`, {
        cache: 'no-store',
        mode: 'no-cors'
      });
      return true;
    } catch (_error) {
      return false;
    }
  };

  const runProvisioningFlow = async (tenantSlug, accountEmail) => {
    const tenantUrl = `https://${tenantSlug}.${rootDomain}`;
    setProvisioning({
      active: true,
      done: false,
      progress: 5,
      tenantSlug,
      tenantUrl,
      accountEmail: accountEmail || '',
      warning: ''
    });

    let finished = false;
    const smoothingTimer = setInterval(() => {
      setProvisioning((prev) => {
        if (finished || prev.done) return prev;
        const next = Math.min(prev.progress + (prev.progress < 70 ? 4 : 2), 92);
        return { ...prev, progress: next };
      });
    }, 800);

    let ready = false;
    for (let attempt = 1; attempt <= 20; attempt += 1) {
      ready = await checkTenantRoute(tenantSlug, tenantUrl);
      setProvisioning((prev) => ({
        ...prev,
        progress: Math.max(prev.progress, Math.min(95, 10 + attempt * 4))
      }));
      if (ready) break;
      await wait(2000);
    }

    finished = true;
    clearInterval(smoothingTimer);

      setProvisioning((prev) => ({
        ...prev,
        active: false,
        done: true,
      progress: 100,
      warning: ready ? '' : 'Workspace is created. DNS propagation may still be in progress.'
    }));
    setStatus({
      loading: false,
      error: '',
      success: `Workspace ${tenantSlug}.${rootDomain} created successfully.`
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    try {
      if (turnstileSiteKey && !turnstileToken) {
        throw new Error('Please complete the captcha challenge.');
      }

      const accountEmail = form.email;
      const result = await api.registerTenant({
        ...form,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {})
      });
      setForm(initialState);
      setSlugTouched(false);
      setTurnstileToken('');
      await runProvisioningFlow(result.tenant.slug, accountEmail);
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  if (provisioning.active || provisioning.done) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
          {provisioning.done ? 'Congratulations!' : 'Setting up your workspace'}
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          {provisioning.done
            ? `Your company storefront is ready at ${provisioning.tenantSlug}.${rootDomain}.`
            : 'We are provisioning your tenant and preparing your storefront domain.'}
        </p>

        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Provisioning progress</span>
            <span>{provisioning.progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${provisioning.progress}%` }}
            />
          </div>
          {provisioning.warning ? (
            <p className="mt-3 text-xs text-amber-400">{provisioning.warning}</p>
          ) : null}
        </div>

        {status.success ? <p className="mt-4 text-sm text-success-500">{status.success}</p> : null}

        {provisioning.done ? (
          <div className="mt-6 space-y-3">
            <button
              className="w-full rounded-md bg-brand-500 px-4 py-3 font-semibold text-white hover:bg-brand-600"
              onClick={() => {
                const email = encodeURIComponent(provisioning.accountEmail || '');
                const next = encodeURIComponent('/dashboard/settings/branding');
                window.location.href = `/login?email=${email}&next=${next}`;
              }}
              type="button"
            >
              Continue to onboarding
            </button>
            <button
              className="w-full rounded-md border border-neutral-750 px-4 py-3 font-semibold text-neutral-200 hover:bg-neutral-800"
              onClick={() => {
                window.location.href = provisioning.tenantUrl;
              }}
              type="button"
            >
              Open storefront domain
            </button>
            <a
              className="block text-center text-sm text-neutral-400 underline hover:text-neutral-200"
              href={provisioning.tenantUrl}
            >
              {provisioning.tenantUrl}
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden px-6 py-16">
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(99,102,241,0.18),transparent),radial-gradient(40%_40%_at_85%_30%,rgba(14,165,233,0.12),transparent)]"
      />

      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create your workspace</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Spin up your branded storefront and operator dashboard in minutes.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-750 bg-neutral-800/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
          <form className="space-y-5" onSubmit={onSubmit}>
            <Field label="Shop name" value={form.name} onChange={update('name')} placeholder="Construction Pro Rentals" />

            <div>
              <Field label="Slug" value={form.slug} onChange={update('slug')} placeholder="constructionpro" />
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-neutral-500">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                Your storefront:{' '}
                <span className="font-mono text-brand-400">{form.slug || 'your-shop'}.{rootDomain}</span>
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Email" type="email" value={form.email} onChange={update('email')} placeholder="you@yourshop.com" />
              <Field label="Password" type="password" value={form.password} onChange={update('password')} placeholder="••••••••" />
            </div>

            <TurnstileWidget
              onExpire={() => setTurnstileToken('')}
              onToken={setTurnstileToken}
              siteKey={turnstileSiteKey}
            />

            {status.error ? (
              <p className="rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-sm text-danger-500">
                {status.error}
              </p>
            ) : null}
            {status.success ? (
              <p className="rounded-lg border border-success-500/30 bg-success-500/10 px-3 py-2 text-sm text-success-500">
                {status.success}
              </p>
            ) : null}

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 font-semibold transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={status.loading}
              type="submit"
            >
              {status.loading ? 'Creating workspace…' : (
                <>
                  Create workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have a workspace?{' '}
          <Link className="font-semibold text-brand-400 transition hover:text-brand-300" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block text-sm font-medium text-neutral-200">
      <span>{label}</span>
      <input
        className="mt-1.5 h-11 w-full rounded-lg border border-neutral-750 bg-neutral-950 px-3 text-neutral-50 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
        required
        {...props}
      />
    </label>
  );
}
