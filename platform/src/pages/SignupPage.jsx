import { useState } from 'react';
import { api } from '../lib/api';

const initialState = {
  name: '',
  slug: '',
  email: '',
  password: ''
};

export default function SignupPage() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    try {
      const result = await api.registerTenant(form);
      setStatus({
        loading: false,
        error: '',
        success: `Workspace ${result.tenant.slug}.arkived.dev created. You can now sign in.`
      });
      setForm(initialState);
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Create your tenant workspace</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Field label="Shop name" value={form.name} onChange={update('name')} />
        <Field label="Slug" value={form.slug} onChange={update('slug')} placeholder="constructionpro" />
        <Field label="Email" type="email" value={form.email} onChange={update('email')} />
        <Field label="Password" type="password" value={form.password} onChange={update('password')} />

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
