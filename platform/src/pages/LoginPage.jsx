import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { hasSupabaseClient } from '../lib/supabase';
import TurnstileWidget from '../components/TurnstileWidget';

export default function LoginPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '' });
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });
    try {
      await auth.signInWithPassword(email, password, turnstileToken);
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-neutral-400">
        {hasSupabaseClient ? 'Sign in with your workspace account.' : 'Supabase is not configured, using demo-only auth.'}
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm text-neutral-200">
          <span>Email</span>
          <input
            className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block text-sm text-neutral-200">
          <span>Password</span>
          <input
            className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <TurnstileWidget
          onExpire={() => setTurnstileToken('')}
          onToken={setTurnstileToken}
          siteKey={turnstileSiteKey}
        />

        {status.error ? <p className="text-sm text-danger-500">{status.error}</p> : null}

        <button
          className="w-full rounded-md bg-brand-500 px-4 py-3 font-semibold hover:bg-brand-600 disabled:opacity-60"
          disabled={status.loading || !hasSupabaseClient}
          type="submit"
        >
          {status.loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {!hasSupabaseClient ? (
        <button
          className="mt-4 w-full rounded-md border border-neutral-750 px-4 py-3 font-semibold hover:bg-neutral-800"
          onClick={auth.signInAsDemo}
          type="button"
        >
          Continue as Demo Admin
        </button>
      ) : null}
    </div>
  );
}
