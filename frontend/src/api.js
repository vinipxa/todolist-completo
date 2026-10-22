const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3333';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erro ao comunicar com o servidor.');
  return data;
}

export const api = {
  list: ({ search = '', status = 'all' } = {}) =>
    request(`/api/tasks?search=${encodeURIComponent(search)}&status=${status}`),
  create: (body) => request('/api/tasks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
};
