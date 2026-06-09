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
  equipment: () => request('/api/v1/equipment'),
  bookings: () => request('/api/v1/bookings'),
  overview: () => request('/api/v1/analytics/overview')
};
