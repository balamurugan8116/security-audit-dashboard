import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL, timeout: 60000 });

export async function fetchLogs(params) {
  const { data } = await api.get('/logs', { params });
  return data; // { data, pagination }
}

export async function fetchLogById(id) {
  const { data } = await api.get(`/logs/${id}`);
  return data;
}

export async function fetchStats() {
  const { data } = await api.get('/logs/stats');
  return data;
}

export async function fetchMeta() {
  const { data } = await api.get('/logs/meta');
  return data;
}

export async function bulkUploadLogs(logs, onProgress) {
  const { data } = await api.post(
    '/logs/bulk-upload',
    { logs },
    {
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    }
  );
  return data;
}
