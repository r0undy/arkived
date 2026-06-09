import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function EquipmentPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.equipment().then((result) => setItems(result.data || [])).catch(() => setItems([]));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Equipment</h1>
      <p className="mt-2 text-sm text-neutral-400">Catalog of rentable assets for your tenant.</p>
      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-750">
        <table className="w-full text-left text-sm tabular-nums">
          <thead className="bg-neutral-800 text-neutral-200">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Rate/Day</th>
              <th className="px-4 py-3">Status</th>
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
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-neutral-400" colSpan="4">
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
