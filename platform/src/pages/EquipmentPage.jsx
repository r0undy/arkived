import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const initialForm = {
  name: '',
  description: '',
  category: 'Construction',
  daily_rate: 0,
  deposit: 0,
  quantity: 1,
  status: 'available',
  condition: 'good',
  tags: []
};

export default function EquipmentPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ loading: false, error: '' });

  const loadItems = async () => {
    try {
      const result = await api.equipment();
      setItems(result.data || []);
    } catch (_error) {
      setItems([]);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const updateForm = (key) => (event) => {
    const value = ['daily_rate', 'deposit', 'quantity'].includes(key)
      ? Number(event.target.value)
      : event.target.value;

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onCreate = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });

    try {
      await api.createEquipment(form);
      setForm(initialForm);
      await loadItems();
      setStatus({ loading: false, error: '' });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  const onArchive = async (id) => {
    try {
      await api.archiveEquipment(id);
      await loadItems();
    } catch (_error) {
      // Keep current list if archive request fails.
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Equipment</h1>
      <p className="mt-2 text-sm text-neutral-400">Catalog of rentable assets for your tenant.</p>

      <form className="mt-6 grid gap-3 rounded-lg border border-neutral-750 bg-neutral-800 p-4 md:grid-cols-3" onSubmit={onCreate}>
        <Field label="Name" value={form.name} onChange={updateForm('name')} required />
        <Field label="Category" value={form.category} onChange={updateForm('category')} required />
        <Field label="Daily rate" type="number" min="0" value={form.daily_rate} onChange={updateForm('daily_rate')} required />
        <Field label="Deposit" type="number" min="0" value={form.deposit} onChange={updateForm('deposit')} />
        <Field label="Quantity" type="number" min="1" value={form.quantity} onChange={updateForm('quantity')} required />
        <label className="block text-sm text-neutral-200">
          <span>Status</span>
          <select
            className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
            value={form.status}
            onChange={updateForm('status')}
          >
            <option value="available">available</option>
            <option value="rented">rented</option>
            <option value="maintenance">maintenance</option>
          </select>
        </label>
        <label className="block text-sm text-neutral-200 md:col-span-3">
          <span>Description</span>
          <textarea
            className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
            rows={3}
            value={form.description}
            onChange={updateForm('description')}
          />
        </label>

        {status.error ? <p className="text-sm text-danger-500 md:col-span-3">{status.error}</p> : null}

        <div className="md:col-span-3">
          <button
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
            disabled={status.loading}
            type="submit"
          >
            {status.loading ? 'Adding...' : 'Add equipment'}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-750">
        <table className="w-full text-left text-sm tabular-nums">
          <thead className="bg-neutral-800 text-neutral-200">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Rate/Day</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-neutral-750 bg-neutral-900">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3 text-neutral-300">{item.category}</td>
                <td className="px-4 py-3">PHP {Number(item.daily_rate).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs capitalize">{item.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    className="rounded border border-neutral-750 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
                    onClick={() => onArchive(item.id)}
                    type="button"
                  >
                    Archive
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-neutral-400" colSpan="5">
                  No equipment yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block text-sm text-neutral-200">
      <span>{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
        {...props}
      />
    </label>
  );
}
