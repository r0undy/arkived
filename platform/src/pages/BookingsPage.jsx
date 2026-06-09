import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const NEXT_STATUS = {
  reserved: 'payment',
  payment: 'dispatched',
  dispatched: 'returned',
  returned: 'inspected',
  inspected: 'closed'
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);

  const loadBookings = async () => {
    try {
      const result = await api.bookings();
      setBookings(result.data || []);
    } catch (_error) {
      setBookings([]);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const moveForward = async (booking) => {
    const next = NEXT_STATUS[booking.status];
    if (!next) return;

    try {
      await api.updateBookingStatus(booking.id, next);
      await loadBookings();
    } catch (_error) {
      // No-op: keep current state if request fails.
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
      <p className="mt-2 text-sm text-neutral-400">Track reservation-to-return pipeline.</p>
      <div className="mt-6 grid gap-3">
        {bookings.map((booking) => (
          <article key={booking.id} className="rounded-lg border border-neutral-750 bg-neutral-800 p-4">
            <p className="text-sm text-neutral-400">Booking ID</p>
            <p className="font-mono text-sm">{booking.id}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <span className="rounded-md bg-neutral-900 px-2 py-1 capitalize">{booking.status}</span>
              <span>{booking.start_date} to {booking.end_date}</span>
              <span>PHP {Number(booking.total_amount).toLocaleString()}</span>
            </div>
            {NEXT_STATUS[booking.status] ? (
              <button
                className="mt-3 rounded-md bg-brand-500 px-3 py-2 text-xs font-semibold hover:bg-brand-600"
                onClick={() => moveForward(booking)}
                type="button"
              >
                Move to {NEXT_STATUS[booking.status]}
              </button>
            ) : null}
          </article>
        ))}
        {bookings.length === 0 ? <p className="text-sm text-neutral-400">No bookings yet.</p> : null}
      </div>
    </div>
  );
}
