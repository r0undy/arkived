const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
    throw new Error(payload?.error?.message || 'Request failed');
  }

  return payload;
};

export const api = {
  registerTenant: (body) => request('/api/v1/auth/register', { method: 'POST', body }),
  me: () => request('/api/v1/auth/me'),
  tenant: () => request('/api/v1/tenant'),

  equipment: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : '';
    return request(`/api/v1/equipment${suffix}`);
  },
  createEquipment: (body) => request('/api/v1/equipment', { method: 'POST', body }),
  updateEquipment: (id, body) => request(`/api/v1/equipment/${id}`, { method: 'PATCH', body }),
  archiveEquipment: (id) => request(`/api/v1/equipment/${id}`, { method: 'DELETE' }),
  maintenanceLogs: (equipmentId) => request(`/api/v1/equipment/${equipmentId}/maintenance`),
  createMaintenanceLog: (equipmentId, body) => request(`/api/v1/equipment/${equipmentId}/maintenance`, { method: 'POST', body }),
  updateMaintenanceLog: (equipmentId, logId, body) =>
    request(`/api/v1/equipment/${equipmentId}/maintenance/${logId}`, { method: 'PATCH', body }),
  deleteMaintenanceLog: (equipmentId, logId) =>
    request(`/api/v1/equipment/${equipmentId}/maintenance/${logId}`, { method: 'DELETE' }),

  bookings: () => request('/api/v1/bookings'),
  updateBookingStatus: (id, status) =>
    request(`/api/v1/bookings/${id}/status`, {
      method: 'PATCH',
      body: { status }
    }),

  overview: () => request('/api/v1/analytics/overview'),

  staff: () => request('/api/v1/staff'),
  inviteStaff: (body) => request('/api/v1/staff/invite', { method: 'POST', body }),
  updateStaffRole: (id, role) => request(`/api/v1/staff/${id}/role`, { method: 'PATCH', body: { role } }),
  removeStaff: (id) => request(`/api/v1/staff/${id}`, { method: 'DELETE' }),

  updateBranding: (body) => request('/api/v1/tenant', { method: 'PATCH', body })
};
