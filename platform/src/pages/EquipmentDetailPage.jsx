import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

const initialMaintenance = {
  service_date: '',
  service_type: 'routine',
  performed_by: '',
  notes: '',
  cost: '',
  next_service_due: ''
};

const initialDetailForm = {
  name: '',
  description: '',
  category: '',
  daily_rate: 0,
  deposit: 0,
  quantity: 1,
  status: 'available',
  condition: 'good',
  tags_text: ''
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

export default function EquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [detailForm, setDetailForm] = useState(initialDetailForm);
  const [detailStatus, setDetailStatus] = useState({ loading: false, error: '', message: '' });
  const [confirmArchive, setConfirmArchive] = useState(false);

  const [imageStatus, setImageStatus] = useState({ loading: false, error: '' });
  const [lastFailedImageFile, setLastFailedImageFile] = useState(null);
  const [dragImageId, setDragImageId] = useState('');

  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [maintenanceForm, setMaintenanceForm] = useState(initialMaintenance);
  const [maintenanceStatus, setMaintenanceStatus] = useState({ loading: false, error: '' });
  const [editingLogId, setEditingLogId] = useState('');

  const images = detail?.images || [];

  const loadDetail = async () => {
    if (!id) return;
    try {
      const result = await api.equipmentById(id);
      setDetail(result.data || null);
    } catch (_error) {
      setDetail(null);
    }
  };

  const loadMaintenanceLogs = async () => {
    if (!id) return;
    try {
      const result = await api.maintenanceLogs(id);
      setMaintenanceLogs(result.data || []);
    } catch (_error) {
      setMaintenanceLogs([]);
    }
  };

  useEffect(() => {
    loadDetail();
    loadMaintenanceLogs();
  }, [id]);

  useEffect(() => {
    if (!detail) {
      setDetailForm(initialDetailForm);
      return;
    }

    setDetailForm({
      name: detail.name || '',
      description: detail.description || '',
      category: detail.category || '',
      daily_rate: Number(detail.daily_rate || 0),
      deposit: Number(detail.deposit || 0),
      quantity: Number(detail.quantity || 1),
      status: detail.status || 'available',
      condition: detail.condition || 'good',
      tags_text: Array.isArray(detail.tags) ? detail.tags.join(', ') : ''
    });
    setDetailStatus({ loading: false, error: '', message: '' });
  }, [detail]);

  const updateDetail = (key) => (event) => {
    const value = ['daily_rate', 'deposit', 'quantity'].includes(key)
      ? Number(event.target.value)
      : event.target.value;

    setDetailForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateMaintenance = (key) => (event) => {
    setMaintenanceForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onSaveEquipmentDetail = async (event) => {
    event.preventDefault();
    if (!id) return;

    setDetailStatus({ loading: true, error: '', message: '' });

    const payload = {
      name: detailForm.name,
      description: detailForm.description,
      category: detailForm.category,
      daily_rate: Number(detailForm.daily_rate),
      deposit: Number(detailForm.deposit),
      quantity: Number(detailForm.quantity),
      status: detailForm.status,
      condition: detailForm.condition,
      tags: detailForm.tags_text
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    };

    try {
      await api.updateEquipment(id, payload);
      await loadDetail();
      setDetailStatus({ loading: false, error: '', message: 'Equipment details updated.' });
    } catch (error) {
      setDetailStatus({ loading: false, error: error.message || 'Failed to update equipment', message: '' });
    }
  };

  const onConfirmArchive = async () => {
    if (!id) return;
    try {
      await api.archiveEquipment(id);
      navigate('/dashboard/equipment', { replace: true });
    } catch (_error) {
      setConfirmArchive(false);
    }
  };

  const uploadImageFile = async (file) => {
    if (!file || !id) return;
    setImageStatus({ loading: true, error: '' });

    try {
      const base64 = await fileToBase64(file);
      await api.uploadEquipmentImage(id, {
        file_name: file.name,
        mime_type: file.type || 'image/png',
        content_base64: base64,
        is_primary: images.length === 0
      });

      await loadDetail();
      setImageStatus({ loading: false, error: '' });
      setLastFailedImageFile(null);
    } catch (error) {
      setImageStatus({ loading: false, error: error.message || 'Upload failed' });
      setLastFailedImageFile(file);
    }
  };

  const onUploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    await uploadImageFile(file);
  };

  const onSetPrimaryImage = async (imageId) => {
    if (!id) return;
    try {
      await api.setPrimaryEquipmentImage(id, imageId);
      await loadDetail();
    } catch (_error) {
      // Keep current state if update fails.
    }
  };

  const onDeleteImage = async (imageId) => {
    if (!id) return;
    try {
      await api.deleteEquipmentImage(id, imageId);
      await loadDetail();
    } catch (_error) {
      // Keep current state if delete fails.
    }
  };

  const onDragStartImage = (imageId) => {
    setDragImageId(imageId);
  };

  const onDropImage = async (targetImageId) => {
    if (!id || !dragImageId || dragImageId === targetImageId) {
      setDragImageId('');
      return;
    }

    const current = images.map((entry) => entry.id);
    const from = current.indexOf(dragImageId);
    const to = current.indexOf(targetImageId);
    if (from < 0 || to < 0) {
      setDragImageId('');
      return;
    }

    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    try {
      await api.reorderEquipmentImages(id, next);
      await loadDetail();
    } catch (_error) {
      // Keep current order if request fails.
    } finally {
      setDragImageId('');
    }
  };

  const onSubmitMaintenance = async (event) => {
    event.preventDefault();
    if (!id) return;

    setMaintenanceStatus({ loading: true, error: '' });

    const payload = {
      service_date: maintenanceForm.service_date,
      service_type: maintenanceForm.service_type,
      performed_by: maintenanceForm.performed_by || null,
      notes: maintenanceForm.notes || null,
      cost: maintenanceForm.cost === '' ? null : Number(maintenanceForm.cost),
      next_service_due: maintenanceForm.next_service_due || null
    };

    try {
      if (editingLogId) {
        await api.updateMaintenanceLog(id, editingLogId, payload);
      } else {
        await api.createMaintenanceLog(id, payload);
      }

      setMaintenanceForm(initialMaintenance);
      setEditingLogId('');
      await loadMaintenanceLogs();
      setMaintenanceStatus({ loading: false, error: '' });
    } catch (error) {
      setMaintenanceStatus({ loading: false, error: error.message });
    }
  };

  const onEditLog = (log) => {
    setEditingLogId(log.id);
    setMaintenanceForm({
      service_date: log.service_date || '',
      service_type: log.service_type || 'routine',
      performed_by: log.performed_by || '',
      notes: log.notes || '',
      cost: log.cost ?? '',
      next_service_due: log.next_service_due || ''
    });
  };

  const onDeleteLog = async (logId) => {
    if (!id) return;

    try {
      await api.deleteMaintenanceLog(id, logId);
      if (editingLogId === logId) {
        setEditingLogId('');
        setMaintenanceForm(initialMaintenance);
      }
      await loadMaintenanceLogs();
    } catch (_error) {
      // Keep current state if delete fails.
    }
  };

  const headerText = useMemo(() => {
    if (!detail) return 'Loading equipment...';
    return `Editing: ${detail.name}`;
  }, [detail]);

  return (
    <div>
      <div className="mb-4">
        <Link className="text-sm text-neutral-300 hover:text-brand-400" to="/dashboard/equipment">
          ← Back to equipment list
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Equipment Detail</h1>
      <p className="mt-2 text-sm text-neutral-400">{headerText}</p>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Equipment Details</h2>

        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={onSaveEquipmentDetail}>
          <Field label="Name" value={detailForm.name} onChange={updateDetail('name')} required />
          <Field label="Category" value={detailForm.category} onChange={updateDetail('category')} required />
          <Field label="Daily rate" type="number" min="0" value={detailForm.daily_rate} onChange={updateDetail('daily_rate')} required />
          <Field label="Deposit" type="number" min="0" value={detailForm.deposit} onChange={updateDetail('deposit')} />
          <Field label="Quantity" type="number" min="1" value={detailForm.quantity} onChange={updateDetail('quantity')} required />

          <label className="block text-sm text-neutral-200">
            <span>Status (manual override)</span>
            <select
              className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
              value={detailForm.status}
              onChange={updateDetail('status')}
            >
              <option value="available">available</option>
              <option value="rented">rented</option>
              <option value="maintenance">maintenance</option>
              <option value="archived">archived</option>
            </select>
          </label>

          <label className="block text-sm text-neutral-200">
            <span>Condition</span>
            <select
              className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
              value={detailForm.condition}
              onChange={updateDetail('condition')}
            >
              <option value="excellent">excellent</option>
              <option value="good">good</option>
              <option value="fair">fair</option>
              <option value="needs_repair">needs_repair</option>
            </select>
          </label>

          <Field label="Tags (comma-separated)" value={detailForm.tags_text} onChange={updateDetail('tags_text')} />

          <label className="block text-sm text-neutral-200 md:col-span-3">
            <span>Description</span>
            <textarea
              className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
              rows={3}
              value={detailForm.description}
              onChange={updateDetail('description')}
            />
          </label>

          {detailStatus.error ? <p className="text-sm text-danger-500 md:col-span-3">{detailStatus.error}</p> : null}
          {detailStatus.message ? <p className="text-sm text-success-500 md:col-span-3">{detailStatus.message}</p> : null}

          <div className="md:col-span-3 flex gap-2">
            <button
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
              disabled={detailStatus.loading || !id}
              type="submit"
            >
              {detailStatus.loading ? 'Saving...' : 'Save equipment'}
            </button>
            <button
              className="rounded-md border border-neutral-750 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 disabled:opacity-50"
              disabled={!id}
              onClick={() => setConfirmArchive(true)}
              type="button"
            >
              Archive equipment
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Image Gallery</h2>

        <div className="mt-4 flex items-center gap-3">
          <label className="rounded border border-neutral-750 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700">
            <input
              accept="image/*"
              className="hidden"
              disabled={!id || imageStatus.loading}
              onChange={onUploadImage}
              type="file"
            />
            {imageStatus.loading ? 'Uploading...' : 'Upload image'}
          </label>
          {imageStatus.error ? <p className="text-sm text-danger-500">{imageStatus.error}</p> : null}
          {imageStatus.error && lastFailedImageFile ? (
            <button
              className="rounded border border-neutral-750 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-700"
              disabled={imageStatus.loading}
              onClick={() => uploadImageFile(lastFailedImageFile)}
              type="button"
            >
              Retry upload
            </button>
          ) : null}
        </div>

        <div className="mt-2 text-xs text-neutral-400">Drag and drop image cards to reorder display.</div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <article
              key={image.id}
              className={`rounded-md border bg-neutral-900 p-3 ${dragImageId === image.id ? 'border-brand-500' : 'border-neutral-750'}`}
              draggable
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => onDragStartImage(image.id)}
              onDrop={() => onDropImage(image.id)}
            >
              <img alt={`${detail?.name || 'Equipment'} image`} className="h-32 w-full rounded object-cover" src={image.storage_url} />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-400">{image.is_primary ? 'Primary image' : `Order ${image.display_order}`}</span>
                <div className="space-x-2">
                  {!image.is_primary ? (
                    <button
                      className="rounded border border-neutral-750 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
                      onClick={() => onSetPrimaryImage(image.id)}
                      type="button"
                    >
                      Set primary
                    </button>
                  ) : null}
                  <button
                    className="rounded border border-neutral-750 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
                    onClick={() => onDeleteImage(image.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          {images.length === 0 ? <p className="text-sm text-neutral-400">No images uploaded yet.</p> : null}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Maintenance Logs</h2>

        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={onSubmitMaintenance}>
          <Field label="Service date" type="date" value={maintenanceForm.service_date} onChange={updateMaintenance('service_date')} required />
          <label className="block text-sm text-neutral-200">
            <span>Service type</span>
            <select
              className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
              value={maintenanceForm.service_type}
              onChange={updateMaintenance('service_type')}
            >
              <option value="routine">routine</option>
              <option value="repair">repair</option>
              <option value="inspection">inspection</option>
              <option value="cleaning">cleaning</option>
            </select>
          </label>
          <Field label="Performed by" value={maintenanceForm.performed_by} onChange={updateMaintenance('performed_by')} />
          <Field label="Cost" type="number" min="0" step="0.01" value={maintenanceForm.cost} onChange={updateMaintenance('cost')} />
          <Field label="Next service due" type="date" value={maintenanceForm.next_service_due} onChange={updateMaintenance('next_service_due')} />
          <div />
          <label className="block text-sm text-neutral-200 md:col-span-3">
            <span>Notes</span>
            <textarea
              className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
              rows={3}
              value={maintenanceForm.notes}
              onChange={updateMaintenance('notes')}
            />
          </label>

          {maintenanceStatus.error ? <p className="text-sm text-danger-500 md:col-span-3">{maintenanceStatus.error}</p> : null}

          <div className="md:col-span-3 flex gap-2">
            <button
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
              disabled={maintenanceStatus.loading || !id}
              type="submit"
            >
              {maintenanceStatus.loading ? 'Saving...' : editingLogId ? 'Update log' : 'Add log'}
            </button>
            {editingLogId ? (
              <button
                className="rounded-md border border-neutral-750 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
                onClick={() => {
                  setEditingLogId('');
                  setMaintenanceForm(initialMaintenance);
                }}
                type="button"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-4 space-y-2">
          {maintenanceLogs.map((log) => (
            <article key={log.id} className="rounded-md border border-neutral-750 bg-neutral-900 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold capitalize">{log.service_type} on {log.service_date}</p>
                <div className="space-x-2">
                  <button
                    className="rounded border border-neutral-750 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
                    onClick={() => onEditLog(log)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded border border-neutral-750 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
                    onClick={() => onDeleteLog(log.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-neutral-400">By: {log.performed_by || 'N/A'}</p>
              {log.cost !== null && log.cost !== undefined ? (
                <p className="text-xs text-neutral-400">Cost: PHP {Number(log.cost).toLocaleString()}</p>
              ) : null}
              {log.next_service_due ? <p className="text-xs text-neutral-400">Next due: {log.next_service_due}</p> : null}
              {log.notes ? <p className="mt-2 text-sm text-neutral-300">{log.notes}</p> : null}
            </article>
          ))}
          {maintenanceLogs.length === 0 ? <p className="text-sm text-neutral-400">No maintenance logs yet.</p> : null}
        </div>
      </section>

      {confirmArchive ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-750 bg-neutral-900 p-4">
            <h3 className="text-lg font-semibold">Archive Equipment</h3>
            <p className="mt-2 text-sm text-neutral-300">
              This will soft-delete the equipment item and hide it from active lists. Existing history remains intact.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-md border border-neutral-750 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
                onClick={() => setConfirmArchive(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-danger-500 px-3 py-2 text-sm font-semibold text-white hover:brightness-95"
                onClick={onConfirmArchive}
                type="button"
              >
                Archive
              </button>
            </div>
          </div>
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
