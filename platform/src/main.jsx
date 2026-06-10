import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  Outlet,
  RouterProvider
} from 'react-router-dom';

import './index.css';
import MarketingLayout from './layouts/MarketingLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PlatformOwnerRoute from './components/PlatformOwnerRoute';
import AppErrorBoundary from './components/AppErrorBoundary';
import { ToastProvider } from './components/ui';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardHomePage = lazy(() => import('./pages/DashboardHomePage'));
const EquipmentPage = lazy(() => import('./pages/EquipmentPage'));
const EquipmentDetailPage = lazy(() => import('./pages/EquipmentDetailPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const BrandingPage = lazy(() => import('./pages/BrandingPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const routeElement = (Component) => (
  <Suspense fallback={<div className="p-6 text-sm text-neutral-300">Loading page...</div>}>
    <Component />
  </Suspense>
);

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
    children: [
      { path: '/', element: routeElement(HomePage) },
      { path: '/login', element: routeElement(LoginPage) },
      { path: '/signup', element: routeElement(SignupPage) }
    ]
  },
  {
    element: <ProtectedShell />,
    children: [
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
  { path: '*', element: routeElement(NotFoundPage) }
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
