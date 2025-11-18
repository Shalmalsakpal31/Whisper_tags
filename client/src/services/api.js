import axios from 'axios';

// API base URL:
// - Locally: defaults to '/api' (proxy to your Node backend on http://localhost:5000)
// - On Vercel (or any hosted frontend): set REACT_APP_API_BASE_URL to your backend URL, e.g.
//   https://your-backend-host.com/api
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL && process.env.REACT_APP_API_BASE_URL.trim() !== ''
    ? process.env.REACT_APP_API_BASE_URL
    : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Only redirect to /admin for admin endpoints
      if (url.startsWith('/admin')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  }
);

// Admin API calls
export const adminAPI = {
  login: (password) => api.post('/admin/login', { password }),
  uploadAudio: (formData) => api.post('/admin/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getClips: () => api.get('/admin/clips'),
  deleteClip: (id) => api.delete(`/admin/clips/${id}`),
  getShareLink: (id) => api.get(`/admin/clips/${id}/share`),
  generatePassword: (type) => api.post('/admin/generate-password', { type }),
};

// Audio API calls
export const audioAPI = {
  getClipInfo: (id) => api.get(`/audio/${id}`),
  verifyPassword: (id, password) => api.post(`/audio/verify/${id}`, { password }),
  // streamAudio returns an absolute path so <audio> can fetch directly from same-origin
  streamAudio: (id, token) => `${API_BASE_URL}/audio/stream/${id}/${token}`,
};

export default api;
