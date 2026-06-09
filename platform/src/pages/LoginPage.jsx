import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const auth = useAuth();

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-neutral-400">Use the demo token flow for local setup.</p>
      <button
        className="mt-6 w-full rounded-md bg-brand-500 px-4 py-3 font-semibold hover:bg-brand-600"
        onClick={auth.signInAsDemo}
        type="button"
      >
        Continue as Demo Admin
      </button>
    </div>
  );
}
