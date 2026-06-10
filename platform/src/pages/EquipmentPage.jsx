import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, LayoutGrid, List } from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';

const PAGE_SIZE = 6;

const STATUS_VARIANT = {
  available: 'success',
  rented: 'info',
  maintenance: 'warning',
  archived: 'neutral'
};

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
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');

  const loadItems = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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
      <PageHeader title="Equipment" subtitle="Browse and manage your rental inventory." />

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

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          {loading ? 'Loading inventory…' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
        </p>
        <div className="inline-flex rounded-md border border-neutral-750 bg-neutral-800 p-0.5">
          <button
            type="button"
            aria-label="Card view"
            aria-pressed={view === 'card'}
            onClick={() => setView('card')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition ${
              view === 'card' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Cards
          </button>
          <button
            type="button"
            aria-label="Table view"
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition ${
              view === 'table' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <List className="h-3.5 w-3.5" /> Table
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Package}
          title={filters.q || filters.category || filters.status ? 'No matching equipment' : 'Add your first item'}
          description={
            filters.q || filters.category || filters.status
              ? 'Try clearing your filters to see more of your inventory.'
              : 'Your storefront needs at least one item to rent. Add your first piece of equipment to go live.'
          }
          action={
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              + Add equipment
            </button>
          }
        />
      ) : view === 'card' ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <Badge variant={STATUS_VARIANT[item.status] || 'neutral'} icon={false} className="capitalize">
                  {item.status}
                </Badge>
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
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-750">
          <table className="w-full min-w-150 text-left text-sm">
            <thead className="bg-neutral-800 text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Daily rate</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {pageItems.map((item) => (
                <tr key={item.id} className="bg-neutral-900 hover:bg-neutral-800/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-800">
                        {imageById[item.id] ? (
                          <img alt={item.name} className="h-full w-full object-cover" src={imageById[item.id]} />
                        ) : (
                          <div className="flex h-full items-center justify-center text-neutral-600">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-neutral-100">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{item.category}</td>
                  <td className="px-4 py-3">PHP {Number(item.daily_rate).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[item.status] || 'neutral'} icon={false} className="capitalize">
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      className="rounded border border-neutral-750 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
                      to={`/dashboard/equipment/${item.id}`}
                    >
                      Open detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && items.length > 0 ? (
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
      ) : null}
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
