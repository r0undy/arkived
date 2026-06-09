import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const PAGE_SIZE = 6;

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
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [filters, setFilters] = useState({ q: '', category: '', status: '' });
  const [page, setPage] = useState(1);
  const [imageById, setImageById] = useState({});

  const loadItems = async () => {
    try {
      const result = await api.equipment({
        q: filters.q || undefined,
        category: filters.category || undefined,
        status: filters.status || undefined
      });
      setItems(result.data || []);
      setPage(1);
    } catch (_error) {
      setItems([]);
    }
  };

  useEffect(() => {
    loadItems();
  }, [filters.q, filters.category, filters.status]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = useMemo(() => items.slice(start, start + PAGE_SIZE), [items, start]);

  useEffect(() => {
    let mounted = true;

    const loadImages = async () => {
      const pairs = await Promise.all(
        pageItems.map(async (item) => {
          try {
            const detail = await api.equipmentById(item.id);
            const images = detail.data?.images || [];
            const primary = images.find((entry) => entry.is_primary) || images[0] || null;
            return [item.id, primary?.storage_url || ''];
          } catch (_error) {
            return [item.id, ''];
          }
        })
      );

      if (!mounted) return;

      setImageById((prev) => {
        const next = { ...prev };
        for (const [id, url] of pairs) {
          next[id] = url;
        }
        return next;
      });
    };

    if (pageItems.length > 0) {
      loadImages();
    }

    return () => {
      mounted = false;
    };
  }, [pageItems]);

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
      setStatus({ loading: false, error: '' });
      setFormOpen(false);
      await loadItems();
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  const updateFilter = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Equipment</h1>
      <p className="mt-2 text-sm text-neutral-400">Browse and manage your rental inventory.</p>

      <div className="mt-6 grid gap-3 rounded-lg border border-neutral-750 bg-neutral-800 p-4 md:grid-cols-4">
        <Field label="Search" value={filters.q} onChange={updateFilter('q')} placeholder="Name or keyword" />
        <Field label="Category" value={filters.category} onChange={updateFilter('category')} placeholder="Construction" />
        <label className="block text-sm text-neutral-200">
          <span>Status</span>
          <select
            className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
            value={filters.status}
            onChange={updateFilter('status')}
          >
            <option value="">all</option>
            <option value="available">available</option>
            <option value="rented">rented</option>
            <option value="maintenance">maintenance</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            className="w-full rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600"
            onClick={() => setFormOpen((prev) => !prev)}
            type="button"
          >
            {formOpen ? 'Close Add Form' : '+ Add Equipment'}
          </button>
        </div>
      </div>

      {formOpen ? (
        <form className="mt-4 grid gap-3 rounded-lg border border-neutral-750 bg-neutral-800 p-4 md:grid-cols-3" onSubmit={onCreate}>
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
              {status.loading ? 'Adding...' : 'Create equipment'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((item) => (
          <article key={item.id} className="rounded-lg border border-neutral-750 bg-neutral-800 p-4">
            <div className="h-32 overflow-hidden rounded-md bg-neutral-900">
              {imageById[item.id] ? (
                <img alt={item.name} className="h-full w-full object-cover" src={imageById[item.id]} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-500">No image</div>
              )}
            </div>
            <p className="mt-3 text-xs uppercase tracking-wide text-neutral-400">{item.category}</p>
            <h2 className="mt-1 text-lg font-semibold">{item.name}</h2>
            <p className="mt-2 text-sm">PHP {Number(item.daily_rate).toLocaleString()} / day</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="rounded-full bg-neutral-900 px-2 py-1 text-xs capitalize">{item.status}</span>
              <Link
                className="rounded border border-neutral-750 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
                to={`/dashboard/equipment/${item.id}`}
              >
                Open detail
              </Link>
            </div>
          </article>
        ))}
      </div>

      {items.length === 0 ? <p className="mt-4 text-sm text-neutral-400">No equipment found.</p> : null}

      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          className="rounded border border-neutral-750 px-3 py-1 text-sm disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          type="button"
        >
          Prev
        </button>
        <p className="text-sm text-neutral-400">Page {page} of {totalPages}</p>
        <button
          className="rounded border border-neutral-750 px-3 py-1 text-sm disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          type="button"
        >
          Next
        </button>
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
