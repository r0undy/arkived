import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import BookingTrackingToast from './BookingTrackingToast';

const BookingTrackerContext = createContext({ showTracker: () => {} });

/**
 * Provides a single, app-level booking-tracking toast that lives above the
 * router's page content. Because it is rendered as a sibling of <Routes>, the
 * toast (and its countdown) persists as the visitor navigates between storefront
 * pages — it only disappears when dismissed or when its progress bar completes.
 */
export function BookingTrackerProvider({ children }) {
  const [tracker, setTracker] = useState(null);

  const showTracker = useCallback(({ reference, email }) => {
    if (!reference) return;
    setTracker({ reference, email, key: Date.now() });
  }, []);

  const value = useMemo(() => ({ showTracker }), [showTracker]);

  return (
    <BookingTrackerContext.Provider value={value}>
      {children}
      {tracker ? (
        <BookingTrackingToast
          key={tracker.key}
          reference={tracker.reference}
          email={tracker.email}
          onClose={() => setTracker(null)}
        />
      ) : null}
    </BookingTrackerContext.Provider>
  );
}

export function useBookingTracker() {
  return useContext(BookingTrackerContext);
}
