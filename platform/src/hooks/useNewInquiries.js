import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const STORAGE_KEY = 'arkived_seen_inquiries';
const POLL_MS = 60_000;

const readSeen = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const writeSeen = (ids) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-500)));
  } catch {
    // Ignore storage failures — the signal is non-critical.
  }
};

/**
 * New-inquiry signal (Frontend Roadmap F8.2).
 *
 * A storefront inquiry lands as a `reserved` booking. We treat any `reserved`
 * booking the operator hasn't acknowledged yet as a "new request". Acknowledgement
 * is tracked client-side (localStorage) so the badge clears once the operator
 * opens the Bookings view. Polls lightly; degrades to manual refresh on error.
 */
export function useNewInquiries({ poll = true } = {}) {
  const [newInquiries, setNewInquiries] = useState([]);
  const seenRef = useRef(readSeen());

  const refresh = useCallback(async () => {
    try {
      const result = await api.bookings({ status: 'reserved', page: 1, limit: 50 });
      const reserved = result.data || [];
      const unseen = reserved.filter((booking) => !seenRef.current.has(booking.id));
      setNewInquiries(unseen);
    } catch {
      // Keep the last known value on transient failures.
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!poll) return undefined;
    const id = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [poll, refresh]);

  const acknowledge = useCallback((ids) => {
    const next = new Set(seenRef.current);
    const list = ids ?? newInquiries.map((booking) => booking.id);
    list.forEach((id) => next.add(id));
    seenRef.current = next;
    writeSeen(next);
    setNewInquiries((prev) => prev.filter((booking) => !next.has(booking.id)));
  }, [newInquiries]);

  return { newInquiries, count: newInquiries.length, refresh, acknowledge };
}
