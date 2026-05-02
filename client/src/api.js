const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  login: (username, password) => request('POST', '/login', { username, password }),
  logout: () => request('POST', '/logout'),
  getUsers: (page, limit, search) => request('GET', `/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  exportUsers: () => request('GET', '/users/export'),
  createUser: (data) => request('POST', '/users', data),
  updateUser: (id, data) => request('PUT', `/users/${id}`, data),
  deleteUser: (id) => request('DELETE', `/users/${id}`),
  getTransactions: (user_uuid, limit = 100) => request('GET', `/transactions?user_uuid=${encodeURIComponent(user_uuid)}&limit=${limit}`),
  createTransaction: (data) => request('POST', '/transactions', data),
  getMatchHistory: (user_uuid, limit = 50) => request('GET', `/match-history?user_uuid=${encodeURIComponent(user_uuid)}&limit=${limit}`),
  createMatchHistory: (data) => request('POST', '/match-history', data)
};
