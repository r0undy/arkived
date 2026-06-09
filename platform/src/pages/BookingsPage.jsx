import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.bookings().then((result) => setBookings(result.data || [])).catch(() => setBookings([]));
  }, []);

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
          </article>
        ))}
        {bookings.length === 0 ? <p className="text-sm text-neutral-400">No bookings yet.</p> : null}
      </div>
    </div>
  );
}
