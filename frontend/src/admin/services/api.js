import axios from 'axios';

// Prefer relative `/api` so CRA's `proxy` can forward requests to the backend in dev,
// avoiding CORS issues. Override with `REACT_APP_API_URL` if needed.
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('admin');
      window.location.href = '/admin';
    }
    return Promise.reject(error);
  }
);

// Admin API
export const adminAPI = {
  login: (data) => apiClient.post('/admin/login', data),
  getProfile: () => apiClient.get('/admin/profile'),
  getAllUsers: () => apiClient.get('/admin/users'),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
  getAnalytics: () => apiClient.get('/admin/analytics'),
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data) => apiClient.put('/admin/settings', data),
};

// Watch API
export const watchAPI = {
  getAllWatches: () => apiClient.get('/watches'),
  createWatch: (data) => apiClient.post('/watches', data),
  updateWatch: (id, data) => apiClient.put(`/watches/${id}`, data),
  deleteWatch: (id) => apiClient.delete(`/watches/${id}`),
};

// Order API
export const orderAPI = {
  getAllOrders: () => apiClient.get('/orders'),
  updateOrderStatus: (id, status) => apiClient.put(`/orders/${id}/status`, { status }),
};

// User API
export const userAPI = {
  getAllUsers: () => apiClient.get('/auth/users'),
  getUserById: (id) => apiClient.get(`/auth/users/${id}`),
  updateUser: (id, data) => apiClient.put(`/auth/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/auth/users/${id}`),
};

