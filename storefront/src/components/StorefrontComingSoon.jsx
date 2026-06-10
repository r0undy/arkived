import { Clock } from 'lucide-react';

/**
 * Shown when a tenant exists but hasn't finished onboarding, so its public
 * storefront is not published yet. Keeps branding minimal and reveals no
 * catalog or contact data.
 */
export default function StorefrontComingSoon({ tenant }) {
  const name = tenant?.name || 'This shop';

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center text-slate-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <Clock className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">{name} is coming soon</h1>
      <p className="mt-3 max-w-md text-sm text-slate-500">
        This storefront is still being set up and isn&apos;t open for bookings yet. Please check back shortly.
      </p>
    </div>
  );
}
