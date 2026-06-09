import { useEffect, useState } from 'react';
import { storefrontApi } from '../lib/api';

export default function TenantDebugger({ activeSlug, onChange }) {
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    storefrontApi
      .tenants()
      .then((result) => setTenants(result.data || []))
      .catch((err) => {
        setTenants([]);
        setError(err.message || 'Failed to load tenants');
      });
  }, []);

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-72 rounded-lg border border-slate-300 bg-white/95 p-3 text-slate-900 shadow-xl backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dev Tenant Debugger</p>
      <p className="mt-1 text-xs text-slate-600">Switch storefront tenant without changing host config.</p>

      <label className="mt-3 block text-xs font-semibold text-slate-700" htmlFor="tenant-debugger-select">
        Active tenant
      </label>
      <select
        id="tenant-debugger-select"
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={activeSlug}
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.slug}>
            {tenant.slug} - {tenant.name}
          </option>
        ))}
      </select>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {tenants.length === 0 && !error ? <p className="mt-2 text-xs text-slate-500">No tenants found.</p> : null}
    </aside>
  );
}
