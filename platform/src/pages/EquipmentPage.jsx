import { useEffect, useMemo, useState } from 'react';
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

const initialMaintenance = {
  service_date: '',
  service_type: 'routine',
  performed_by: '',
  notes: '',
  cost: '',
  next_service_due: ''
};

export default function EquipmentPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [maintenanceForm, setMaintenanceForm] = useState(initialMaintenance);
  const [maintenanceStatus, setMaintenanceStatus] = useState({ loading: false, error: '' });
  const [editingLogId, setEditingLogId] = useState('');

  const selectedEquipment = useMemo(
    () => items.find((item) => item.id === selectedEquipmentId) || null,
    [items, selectedEquipmentId]
  );

  const loadItems = async () => {
    try {
      const result = await api.equipment();
      const nextItems = result.data || [];
      setItems(nextItems);
      if (!selectedEquipmentId && nextItems[0]) {
        setSelectedEquipmentId(nextItems[0].id);
      } else if (selectedEquipmentId && !nextItems.some((entry) => entry.id === selectedEquipmentId)) {
        setSelectedEquipmentId(nextItems[0]?.id || '');
      }
    } catch (_error) {
      setItems([]);
      setSelectedEquipmentId('');
    }
  };

  const loadMaintenanceLogs = async (equipmentId) => {
    if (!equipmentId) {
      setMaintenanceLogs([]);
      return;
    }

    try {
      const result = await api.maintenanceLogs(equipmentId);
      setMaintenanceLogs(result.data || []);
    } catch (_error) {
      setMaintenanceLogs([]);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    loadMaintenanceLogs(selectedEquipmentId);
  }, [selectedEquipmentId]);

  const updateForm = (key) => (event) => {
    const value = ['daily_rate', 'deposit', 'quantity'].includes(key)
      ? Number(event.target.value)
      : event.target.value;

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateMaintenance = (key) => (event) => {
    setMaintenanceForm((prev) => ({ ...prev, [key]: event.target.value }));
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

  const onSubmitMaintenance = async (event) => {
    event.preventDefault();
    if (!selectedEquipmentId) return;

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
        await api.updateMaintenanceLog(selectedEquipmentId, editingLogId, payload);
      } else {
        await api.createMaintenanceLog(selectedEquipmentId, payload);
      }

      setMaintenanceForm(initialMaintenance);
      setEditingLogId('');
      await loadMaintenanceLogs(selectedEquipmentId);
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
    if (!selectedEquipmentId) return;

    try {
      await api.deleteMaintenanceLog(selectedEquipmentId, logId);
      if (editingLogId === logId) {
        setEditingLogId('');
        setMaintenanceForm(initialMaintenance);
      }
      await loadMaintenanceLogs(selectedEquipmentId);
    } catch (_error) {
      // Keep current state if delete fails.
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
              <tr
                key={item.id}
                className={`border-t border-neutral-750 ${selectedEquipmentId === item.id ? 'bg-neutral-800' : 'bg-neutral-900'}`}
              >
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3 text-neutral-300">{item.category}</td>
                <td className="px-4 py-3">PHP {Number(item.daily_rate).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs capitalize">{item.status}</span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    className="rounded border border-neutral-750 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
                    onClick={() => setSelectedEquipmentId(item.id)}
                    type="button"
                  >
                    Manage logs
                  </button>
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

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Maintenance Logs</h2>
        <p className="mt-1 text-sm text-neutral-400">
          {selectedEquipment ? `Managing: ${selectedEquipment.name}` : 'Select an equipment item to manage logs.'}
        </p>

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
              disabled={maintenanceStatus.loading || !selectedEquipmentId}
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
