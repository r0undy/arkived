import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider
} from 'react-router-dom';

import './index.css';
import MarketingLayout from './layouts/MarketingLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardHomePage from './pages/DashboardHomePage';
import EquipmentPage from './pages/EquipmentPage';
import BookingsPage from './pages/BookingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TeamPage from './pages/TeamPage';
import NotFoundPage from './pages/NotFoundPage';

const ProtectedShell = () => (
  <ProtectedRoute>
    <Outlet />
  </ProtectedRoute>
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
          { path: '/dashboard/bookings', element: <BookingsPage /> },
          { path: '/dashboard/analytics', element: <AnalyticsPage /> },
          { path: '/dashboard/settings/team', element: <TeamPage /> },
          { path: '/admin', element: <Navigate to="/dashboard" replace /> }
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
