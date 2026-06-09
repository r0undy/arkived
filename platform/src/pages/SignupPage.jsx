import { useState } from 'react';
import { api } from '../lib/api';
import TurnstileWidget from '../components/TurnstileWidget';

const initialState = {
  name: '',
  slug: '',
  email: '',
  password: ''
};

export default function SignupPage() {
  const [form, setForm] = useState(initialState);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });
  const [provisioning, setProvisioning] = useState({
    active: false,
    done: false,
    progress: 0,
    tenantSlug: '',
    tenantUrl: '',
    warning: ''
  });
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
  const rootDomain = (import.meta.env.VITE_ROOT_DOMAIN || 'arkived.dev')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
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

  const runProvisioningFlow = async (tenantSlug) => {
    const tenantUrl = `https://${tenantSlug}.${rootDomain}`;
    setProvisioning({
      active: true,
      done: false,
      progress: 5,
      tenantSlug,
      tenantUrl,
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

      const result = await api.registerTenant({
        ...form,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {})
      });
      setForm(initialState);
      setTurnstileToken('');
      await runProvisioningFlow(result.tenant.slug);
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
                window.location.href = provisioning.tenantUrl;
              }}
              type="button"
            >
              Go to my storefront
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
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Create your tenant workspace</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Field label="Shop name" value={form.name} onChange={update('name')} />
        <Field label="Slug" value={form.slug} onChange={update('slug')} placeholder="constructionpro" />
        <Field label="Email" type="email" value={form.email} onChange={update('email')} />
        <Field label="Password" type="password" value={form.password} onChange={update('password')} />
        <TurnstileWidget
          onExpire={() => setTurnstileToken('')}
          onToken={setTurnstileToken}
          siteKey={turnstileSiteKey}
        />

        {status.error ? <p className="text-sm text-danger-500">{status.error}</p> : null}
        {status.success ? <p className="text-sm text-success-500">{status.success}</p> : null}

        <button
          className="w-full rounded-md bg-brand-500 px-4 py-3 font-semibold hover:bg-brand-600 disabled:opacity-60"
          disabled={status.loading}
          type="submit"
        >
          {status.loading ? 'Creating workspace...' : 'Create workspace'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block text-sm text-neutral-200">
      <span>{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2 text-neutral-50 outline-none focus:ring-2 focus:ring-brand-500"
        required
        {...props}
      />
    </label>
  );
}
