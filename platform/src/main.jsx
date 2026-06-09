import React from 'react';
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

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardHomePage from './pages/DashboardHomePage';
import EquipmentPage from './pages/EquipmentPage';
import EquipmentDetailPage from './pages/EquipmentDetailPage';
import BookingsPage from './pages/BookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import CalendarPage from './pages/CalendarPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TeamPage from './pages/TeamPage';
import BrandingPage from './pages/BrandingPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

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
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> }
    ]
  },
  {
    element: <ProtectedShell />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardHomePage /> },
          { path: '/dashboard/equipment', element: <EquipmentPage /> },
          { path: '/dashboard/equipment/:id', element: <EquipmentDetailPage /> },
          { path: '/dashboard/bookings', element: <BookingsPage /> },
          { path: '/dashboard/bookings/:id', element: <BookingDetailPage /> },
          { path: '/dashboard/calendar', element: <CalendarPage /> },
          { path: '/dashboard/customers', element: <CustomersPage /> },
          { path: '/dashboard/customers/:id', element: <CustomerDetailPage /> },
          { path: '/dashboard/analytics', element: <AnalyticsPage /> },
          { path: '/dashboard/settings/branding', element: <BrandingPage /> },
          { path: '/dashboard/settings/team', element: <TeamPage /> }
        ]
      },
      {
        element: <AdminProtectedShell />,
        children: [
          { path: '/admin', element: <AdminPage /> }
        ]
      }
    ]
  },
  { path: '*', element: <NotFoundPage /> }
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
