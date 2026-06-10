import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, LayoutGrid, List } from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Table, TableContainer, THead, Th, TBody, Tr, Td } from '../components/ui/Table';

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

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      const base64 = value.includes(',') ? value.split(',')[1] : value;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export default function EquipmentPage() {
  const [items, setItems] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [newImages, setNewImages] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [filters, setFilters] = useState({ q: '', category: '', status: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState('card');

  const loadItems = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await api.equipment({
        q: filters.q || undefined,
        category: filters.category || undefined,
        status: filters.status || undefined
      });
      setItems(result.data || []);
      setPage(1);
    } catch (error) {
      setItems([]);
      setLoadError(error?.message || 'Could not load your inventory. Please try again.');
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

  // The list endpoint now returns each item's images, so resolve the cover
  // photo directly instead of an extra request per card.
  const imageById = useMemo(() => {
    const map = {};
    for (const item of items) {
      const images = item.images || [];
      const primary = images.find((entry) => entry.is_primary) || images[0] || null;
      map[item.id] = primary?.storage_url || '';
    }
    return map;
  }, [items]);

  const updateForm = (key) => (event) => {
    const value = ['daily_rate', 'deposit', 'quantity'].includes(key)
      ? Number(event.target.value)
      : event.target.value;

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSelectImages = (event) => {
    const files = Array.from(event.target.files || []);
    setNewImages(files);
  };

  const onCreate = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });

    try {
      const created = await api.createEquipment(form);
      const newId = created?.data?.id;

      let imageError = '';
      if (newId && newImages.length > 0) {
        try {
          for (let index = 0; index < newImages.length; index += 1) {
            const file = newImages[index];
            const content_base64 = await fileToBase64(file);
            await api.uploadEquipmentImage(newId, {
              file_name: file.name,
              mime_type: file.type || 'image/png',
              content_base64,
              is_primary: index === 0,
              display_order: index
            });
          }
        } catch (uploadError) {
          // The item itself was created — don't lose it just because a photo
          // upload failed. Surface a soft warning and still refresh the list.
          imageError = uploadError.message || 'Item created, but a photo failed to upload.';
        }
      }

      setForm(initialForm);
      setNewImages([]);
      setStatus({ loading: false, error: imageError });
      setFormOpen(!imageError ? false : true);
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

          <label className="block text-sm text-neutral-200 md:col-span-3">
            <span>Photos</span>
            <input
              className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-750 file:px-3 file:py-1 file:text-sm file:text-neutral-100"
              type="file"
              accept="image/*"
              multiple
              onChange={onSelectImages}
            />
            {newImages.length > 0 ? (
              <span className="mt-1 block text-xs text-neutral-400">
                {newImages.length} {newImages.length === 1 ? 'image' : 'images'} selected — the first becomes the cover photo.
              </span>
            ) : (
              <span className="mt-1 block text-xs text-neutral-400">Optional. The first image becomes the cover photo.</span>
            )}
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
      ) : loadError ? (
        <div className="mt-6 rounded-lg border border-danger-500/40 bg-danger-500/10 p-4">
          <p className="text-sm font-semibold text-danger-500">Couldn't load your inventory</p>
          <p className="mt-1 text-sm text-neutral-300">{loadError}</p>
          <button
            type="button"
            onClick={loadItems}
            className="mt-3 rounded-md border border-neutral-750 bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-100 transition hover:bg-neutral-800"
          >
            Retry
          </button>
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
        <TableContainer className="mt-4">
          <Table className="min-w-150">
            <THead>
              <Th>Item</Th>
              <Th>Category</Th>
              <Th align="right">Daily rate</Th>
              <Th>Status</Th>
              <Th align="right">Action</Th>
            </THead>
            <TBody>
              {pageItems.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-900">
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
                  </Td>
                  <Td className="text-neutral-400">{item.category}</Td>
                  <Td align="right" className="tabular-nums text-neutral-200">PHP {Number(item.daily_rate).toLocaleString()}</Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[item.status] || 'neutral'} icon={false} className="capitalize">
                      {item.status}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <Link
                      className="inline-flex items-center rounded-md border border-neutral-750 px-3 py-1 text-xs font-medium text-neutral-200 transition hover:bg-neutral-700 hover:text-white"
                      to={`/dashboard/equipment/${item.id}`}
                    >
                      Open detail
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableContainer>
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
