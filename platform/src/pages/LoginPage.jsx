import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { hasSupabaseClient } from '../lib/supabase';
import TurnstileWidget from '../components/TurnstileWidget';

export default function LoginPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const auth = useAuth();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '' });
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
  const nextPath = searchParams.get('next') || '';

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });
    try {
      await auth.signInWithPassword(email, password, turnstileToken, nextPath);
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden px-6 py-16">
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(99,102,241,0.18),transparent),radial-gradient(40%_40%_at_85%_30%,rgba(14,165,233,0.12),transparent)]"
      />

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm text-neutral-400">
            {hasSupabaseClient ? 'Sign in to your Arkived workspace.' : 'Supabase is not configured — using demo-only auth.'}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-750 bg-neutral-800/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
          <form className="space-y-5" onSubmit={onSubmit}>
            <label className="block text-sm font-medium text-neutral-200">
              <span>Email</span>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                <input
                  className="h-11 w-full rounded-lg border border-neutral-750 bg-neutral-950 pl-10 pr-3 text-neutral-50 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@yourshop.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </label>

            <label className="block text-sm font-medium text-neutral-200">
              <span>Password</span>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                <input
                  className="h-11 w-full rounded-lg border border-neutral-750 bg-neutral-950 pl-10 pr-3 text-neutral-50 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
              </div>
            </label>

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

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 font-semibold transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={status.loading || !hasSupabaseClient}
              type="submit"
            >
              {status.loading ? 'Signing in…' : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {!hasSupabaseClient ? (
            <button
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg border border-neutral-750 px-4 font-semibold text-neutral-100 transition hover:bg-neutral-700"
              onClick={auth.signInAsDemo}
              type="button"
            >
              Continue as Demo Admin
            </button>
          ) : null}
        </div>

        <p className="mt-6 text-center text-sm text-neutral-400">
          New to Arkived?{' '}
          <Link className="font-semibold text-brand-400 transition hover:text-brand-300" to="/signup">
            Create a workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
