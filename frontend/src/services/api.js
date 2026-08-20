import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with interceptor
const apiClient = axios.create({
  baseURL: API_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  sendOtp: (data) => apiClient.post('/auth/otp/send', data), // { email, intent: 'login'|'register' }
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
};

// Watch API
export const watchAPI = {
  getAllWatches: () => apiClient.get('/watches'),
  getWatchById: (id) => apiClient.get(`/watches/${id}`),
  createWatch: (data) => apiClient.post('/watches', data),
  updateWatch: (id, data) => apiClient.put(`/watches/${id}`, data),
  deleteWatch: (id) => apiClient.delete(`/watches/${id}`),
};

// Order API
export const orderAPI = {
  createOrder: (data) => apiClient.post('/orders', data),
  getUserOrders: () => apiClient.get('/orders/user'),
  getOrderById: (id) => apiClient.get(`/orders/${id}`),
  cancelOrder: (id, data) => apiClient.post(`/orders/${id}/cancel`, data),
  markPaymentSuccess: (id, data) => apiClient.post(`/orders/${id}/payment-success`, data),
  sendReceipt: (id) => apiClient.post(`/orders/${id}/receipt/send`),
  downloadReceipt: (id) => apiClient.get(`/orders/${id}/receipt/download`, { responseType: 'blob' }),
  getReceiptHtml: (id) =>
    apiClient.get(`/orders/${id}/receipt/download`, {
      responseType: 'text',
      headers: { Accept: 'text/html' },
    }),
  getAllOrders: () => apiClient.get('/orders'),
  updateOrderStatus: (id, status) => apiClient.put(`/orders/${id}/status`, { status }),
};

// Newsletter API
export const newsletterAPI = {
  subscribe: (data) => apiClient.post('/newsletter/subscribe', data), // { email, source? }
};

export const contactAPI = {
  submit: (data) => apiClient.post('/contact', data),
};

export const chatAPI = {
  sendMessage: (messages) => apiClient.post('/chat', { messages }),
};

export default apiClient;
