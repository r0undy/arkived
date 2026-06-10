const resolveApiUrl = () => {
  const configured = String(import.meta.env.VITE_API_URL || '').trim();
  if (configured) return configured.replace(/\/+$/, '');
  return import.meta.env.DEV
    ? 'http://localhost:4000'
    : 'https://arkived-api-a0dzeqhvhghhhsay.southeastasia-01.azurewebsites.net';
};

const API_URL = resolveApiUrl();

const request = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const token = localStorage.getItem('arkived_token') || '';
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'Request failed');
    error.status = response.status;
    error.code = payload?.error?.code || 'REQUEST_FAILED';
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const api = {
  request,
  verifyTurnstile: (token) => request('/api/v1/auth/turnstile/verify', { method: 'POST', body: { token } }),
  registerTenant: (body) => request('/api/v1/auth/register', { method: 'POST', body }),
  me: () => request('/api/v1/auth/me'),
  tenant: () => request('/api/v1/tenant'),
  publicPartners: () => request('/api/v1/tenant/public/partners'),

  equipment: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : '';
    return request(`/api/v1/equipment${suffix}`);
  },
  equipmentById: (id) => request(`/api/v1/equipment/${id}`),
  createEquipment: (body) => request('/api/v1/equipment', { method: 'POST', body }),
  updateEquipment: (id, body) => request(`/api/v1/equipment/${id}`, { method: 'PATCH', body }),
  archiveEquipment: (id) => request(`/api/v1/equipment/${id}`, { method: 'DELETE' }),
  uploadEquipmentImage: (equipmentId, body) => request(`/api/v1/equipment/${equipmentId}/images`, { method: 'POST', body }),
  deleteEquipmentImage: (equipmentId, imageId) => request(`/api/v1/equipment/${equipmentId}/images/${imageId}`, { method: 'DELETE' }),
  setPrimaryEquipmentImage: (equipmentId, imageId) =>
    request(`/api/v1/equipment/${equipmentId}/images/${imageId}/primary`, { method: 'PATCH' }),
  reorderEquipmentImages: (equipmentId, imageIds) =>
    request(`/api/v1/equipment/${equipmentId}/images/reorder`, {
      method: 'PATCH',
      body: { image_ids: imageIds }
    }),

  maintenanceLogs: (equipmentId) => request(`/api/v1/equipment/${equipmentId}/maintenance`),
  createMaintenanceLog: (equipmentId, body) => request(`/api/v1/equipment/${equipmentId}/maintenance`, { method: 'POST', body }),
  updateMaintenanceLog: (equipmentId, logId, body) =>
    request(`/api/v1/equipment/${equipmentId}/maintenance/${logId}`, { method: 'PATCH', body }),
  deleteMaintenanceLog: (equipmentId, logId) =>
    request(`/api/v1/equipment/${equipmentId}/maintenance/${logId}`, { method: 'DELETE' }),

  customers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : '';
    return request(`/api/v1/customers${suffix}`);
  },
  createCustomer: (body) => request('/api/v1/customers', { method: 'POST', body }),
  customerBookings: (id) => request(`/api/v1/customers/${id}/bookings`),

  bookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : '';
    return request(`/api/v1/bookings${suffix}`);
  },
  bookingsCalendar: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : '';
    return request(`/api/v1/bookings/calendar${suffix}`);
  },
  bookingById: (id) => request(`/api/v1/bookings/${id}`),
  createBooking: (body) => request('/api/v1/bookings', { method: 'POST', body }),
  updateBooking: (id, body) => request(`/api/v1/bookings/${id}`, { method: 'PATCH', body }),
  updateBookingStatus: (id, status) =>
    request(`/api/v1/bookings/${id}/status`, {
      method: 'PATCH',
      body: { status }
    }),
  equipmentAvailability: (id, params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/v1/equipment/${id}/availability?${query}`);
  },

  overview: () => request('/api/v1/analytics/overview'),
  analyticsRevenue: () => request('/api/v1/analytics/revenue'),
  analyticsRevenueByCategory: () => request('/api/v1/analytics/revenue-by-category'),
  analyticsTopEquipment: () => request('/api/v1/analytics/top-equipment'),
  analyticsUtilization: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : '';
    return request(`/api/v1/analytics/utilization${suffix}`);
  },
  analyticsBookingVolume: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : '';
    return request(`/api/v1/analytics/booking-volume${suffix}`);
  },

  staff: () => request('/api/v1/staff'),
  inviteStaff: (body) => request('/api/v1/staff/invite', { method: 'POST', body }),
  updateStaffRole: (id, role) => request(`/api/v1/staff/${id}/role`, { method: 'PATCH', body: { role } }),
  removeStaff: (id) => request(`/api/v1/staff/${id}`, { method: 'DELETE' }),

  adminOverview: () => request('/api/v1/admin/overview'),
  adminTenants: () => request('/api/v1/admin/tenants'),

  updateBranding: (body) => request('/api/v1/tenant', { method: 'PATCH', body })
};