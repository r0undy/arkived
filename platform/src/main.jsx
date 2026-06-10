import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useRouteError
} from 'react-router-dom';

import './index.css';
import MarketingLayout from './layouts/MarketingLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PlatformOwnerRoute from './components/PlatformOwnerRoute';
import AppErrorBoundary from './components/AppErrorBoundary';
import { ToastProvider } from './components/ui';
import Wordmark from './components/Wordmark';

/**
 * Wrap a dynamic import so a failed chunk load — which happens when a new
 * deploy replaces hashed filenames while a stale index.html is still in the
 * browser/CDN cache — recovers by reloading the page once to fetch the fresh
 * asset manifest. A short time window guards against reload loops when a chunk
 * is genuinely unavailable.
 */
const CHUNK_RELOAD_KEY = 'arkived:last-chunk-reload';

const isChunkLoadError = (error) =>
  error instanceof Error &&
  /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(error.message);

const lazyWithReload = (factory) =>
  lazy(() =>
    factory().catch((error) => {
      if (isChunkLoadError(error)) {
        const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
        if (Date.now() - last > 10_000) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
          window.location.reload();
          // Never resolve so nothing renders before the reload takes over.
          return new Promise(() => {});
        }
      }
      throw error;
    })
  );

const HomePage = lazyWithReload(() => import('./pages/HomePage'));
const PartnersPage = lazyWithReload(() => import('./pages/PartnersPage'));
const LoginPage = lazyWithReload(() => import('./pages/LoginPage'));
const SignupPage = lazyWithReload(() => import('./pages/SignupPage'));
const WelcomePage = lazyWithReload(() => import('./pages/WelcomePage'));
const DashboardHomePage = lazyWithReload(() => import('./pages/DashboardHomePage'));
const EquipmentPage = lazyWithReload(() => import('./pages/EquipmentPage'));
const EquipmentDetailPage = lazyWithReload(() => import('./pages/EquipmentDetailPage'));
const BookingsPage = lazyWithReload(() => import('./pages/BookingsPage'));
const BookingDetailPage = lazyWithReload(() => import('./pages/BookingDetailPage'));
const CalendarPage = lazyWithReload(() => import('./pages/CalendarPage'));
const CustomersPage = lazyWithReload(() => import('./pages/CustomersPage'));
const CustomerDetailPage = lazyWithReload(() => import('./pages/CustomerDetailPage'));
const AnalyticsPage = lazyWithReload(() => import('./pages/AnalyticsPage'));
const TeamPage = lazyWithReload(() => import('./pages/TeamPage'));
const BrandingPage = lazyWithReload(() => import('./pages/BrandingPage'));
const AdminPage = lazyWithReload(() => import('./pages/AdminPage'));
const NotFoundPage = lazyWithReload(() => import('./pages/NotFoundPage'));

const routeElement = (Component) => (
  <Suspense fallback={<RouteLoading />}>
    <Component />
  </Suspense>
);

function RouteLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Wordmark className="motion-safe:animate-pulse" markClassName="h-8 w-8" />
    </div>
  );
}

function RouteError() {
  const error = useRouteError();
  const looksLikeStaleChunk = isChunkLoadError(error);

  return (
    <div className="mx-auto mt-16 max-w-lg rounded-lg border border-danger-500/40 bg-danger-500/10 p-6 text-center">
      <h1 className="text-xl font-semibold text-danger-300">
        {looksLikeStaleChunk ? 'A new version is available' : 'Something went wrong'}
      </h1>
      <p className="mt-2 text-sm text-neutral-200">
        {looksLikeStaleChunk
          ? 'This page was updated since you last loaded the app. Reload to get the latest version.'
          : 'We hit an unexpected error loading this page. Reloading usually fixes it.'}
      </p>
      <button
        className="mt-4 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        onClick={() => window.location.reload()}
        type="button"
      >
        Reload
      </button>
    </div>
  );
}

const ProtectedShell = () => (
  <ProtectedRoute>
    <Outlet />
  </ProtectedRoute>
);

const AdminProtectedShell = () => (
  <PlatformOwnerRoute>
    <AdminLayout />
  </PlatformOwnerRoute>
);

const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: routeElement(HomePage) },
      { path: '/partners', element: routeElement(PartnersPage) },
      { path: '/login', element: routeElement(LoginPage) },
      { path: '/signup', element: routeElement(SignupPage) }
    ]
  },
  {
    element: <ProtectedShell />,
    errorElement: <RouteError />,
    children: [
      { path: '/welcome', element: routeElement(WelcomePage) },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: routeElement(DashboardHomePage) },
          { path: '/dashboard/equipment', element: routeElement(EquipmentPage) },
          { path: '/dashboard/equipment/:id', element: routeElement(EquipmentDetailPage) },
          { path: '/dashboard/bookings', element: routeElement(BookingsPage) },
          { path: '/dashboard/bookings/:id', element: routeElement(BookingDetailPage) },
          { path: '/dashboard/calendar', element: routeElement(CalendarPage) },
          { path: '/dashboard/customers', element: routeElement(CustomersPage) },
          { path: '/dashboard/customers/:id', element: routeElement(CustomerDetailPage) },
          { path: '/dashboard/analytics', element: routeElement(AnalyticsPage) },
          { path: '/dashboard/settings/branding', element: routeElement(BrandingPage) },
          { path: '/dashboard/settings/team', element: routeElement(TeamPage) }
        ]
      },
      {
        element: <AdminProtectedShell />,
        children: [
          { path: '/admin', element: routeElement(AdminPage) }
        ]
      }
    ]
  },
  { path: '*', element: routeElement(NotFoundPage), errorElement: <RouteError /> }
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);

// Fade out the instant boot loader once the app has mounted and painted.
function dismissAppLoader() {
  const loader = document.getElementById('app-loader');
  if (!loader) return;
  loader.classList.add('is-hidden');
  loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  // Fallback removal in case the transitionend event never fires.
  setTimeout(() => loader.remove(), 800);
}

requestAnimationFrame(() => requestAnimationFrame(dismissAppLoader));
