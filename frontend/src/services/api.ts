import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('homeserve_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('homeserve_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefreshToken } = res.data;
          localStorage.setItem('homeserve_access_token', access_token);
          localStorage.setItem('homeserve_refresh_token', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('homeserve_access_token');
          localStorage.removeItem('homeserve_refresh_token');
          localStorage.removeItem('homeserve_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper API groups
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  registerCustomer: (data: any) => api.post('/auth/register', data),
  registerProvider: (data: any) => api.post('/auth/register-provider', data),
  getMe: () => api.get('/auth/me'),
  logout: (refreshToken: string) => api.post('/auth/logout', { refresh_token: refreshToken }),
};

export const catalogApi = {
  getCategories: () => api.get('/categories'),
  getCategoryBySlug: (slug: string) => api.get(`/categories/${slug}`),
  getServices: (params?: any) => api.get('/services', { params }),
  getServiceDetails: (id: number) => api.get(`/services/${id}`),
};

export const customerApi = {
  getAddresses: () => api.get('/customers/addresses'),
  createAddress: (data: any) => api.post('/customers/addresses', data),
  deleteAddress: (id: number) => api.delete(`/customers/addresses/${id}`),
  getBookings: (params?: any) => api.get('/customers/bookings', { params }),
  toggleFavorite: (providerId: number) => api.post(`/customers/favorites/${providerId}`),
};

export const providerApi = {
  getDashboard: () => api.get('/providers/me/dashboard'),
  getServices: () => api.get('/providers/me/services'),
  upsertService: (data: any) => api.post('/providers/me/services', data),
  deleteService: (id: number) => api.delete(`/providers/me/services/${id}`),
  getWorkingHours: () => api.get('/providers/me/working-hours'),
  setWorkingHours: (data: any) => api.put('/providers/me/working-hours', data),
  getTechnicians: () => api.get('/providers/me/technicians'),
  createTechnician: (data: any) => api.post('/providers/me/technicians', data),
  submitKyc: (data: any) => api.post('/providers/me/kyc', data),
};

export const bookingApi = {
  checkAvailability: (data: any) => api.post('/bookings/check-availability', data),
  createBooking: (data: any) => api.post('/bookings', data),
  getBookingDetails: (id: number) => api.get(`/bookings/${id}`),
  providerAction: (id: number, data: any) => api.put(`/bookings/${id}/provider-action`, data),
  assignTechnician: (id: number, data: any) => api.post(`/bookings/${id}/assign-technician`, data),
  cancelBooking: (id: number, data: any) => api.put(`/bookings/${id}/cancel`, data),
};

export const techApi = {
  getAssignedJobs: () => api.get('/technicians/me/jobs'),
  acknowledgeJob: (id: number) => api.put(`/technicians/me/jobs/${id}/acknowledge`),
  markArrival: (id: number) => api.put(`/technicians/me/jobs/${id}/arrive`),
  startJob: (id: number) => api.put(`/technicians/me/jobs/${id}/start`),
  completeJob: (id: number, data: any) => api.put(`/technicians/me/jobs/${id}/complete`, data),
};

export const paymentApi = {
  createOrder: (bookingId: number) => api.post('/payments/create-order', { booking_id: bookingId }),
  verifyPayment: (data: any) => api.post('/payments/verify', data),
  getInvoice: (bookingId: number) => api.get(`/invoices/booking/${bookingId}`),
};

export const adminApi = {
  getAnalytics: () => api.get('/analytics/admin'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUserStatus: (id: number, status: string) => api.put(`/admin/users/${id}/status`, { status }),
  getPendingProviders: () => api.get('/admin/providers/pending'),
  verifyProvider: (id: number, data: any) => api.put(`/admin/providers/${id}/verify`, data),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data: any) => api.post('/admin/coupons', data),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  getComplaints: () => api.get('/complaints'),
  resolveComplaint: (id: number, data: any) => api.put(`/complaints/${id}/resolve`, data),
};

