import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    // 1. Create an axios instance
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 2. Add a request interceptor to attach the token automatically
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async request(endpoint, options = {}) {
    try {
      // Axios uses 'data' instead of 'body'
      const response = await this.client({
        url: endpoint,
        method: options.method || 'GET',
        data: options.body, // Mapping your existing 'body' to axios 'data'
        params: options.params, // For query strings
        ...options,
      });

      return response.data;
    } catch (error) {
      // Axios stores server error messages in error.response.data
      const message = error.response?.data?.message || error.message || 'Request failed';
      console.error('API Error:', message);
      throw new Error(message);
    }
  }

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  googleLogin(credential) {
    return this.request('/auth/google', {
      method: 'POST',
      body: { credential },
    });
  }

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  getMe() {
    return this.request('/auth/me');
  }

  // Events
  getEvents(params = {}) {
    // Axios handles query params automatically if passed in the 'params' property
    return this.request('/events/featured', { params });
  }

  getEvent(slug) {
    return this.request(`/events/${slug}`);
  }

  createEvent(eventData) {
    console.log('Creating event with data:', eventData);
    return this.request('/events', {
      method: 'POST',
      body: eventData,
    });
  }

  updateEvent(id, eventData) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: eventData,
    });
  }

  deleteEvent(id) {
    return this.request(`/events/${id}`, { method: 'DELETE' });
  }

  registerForEvent(id) {
    return this.request(`/events/${id}/register`, { method: 'POST' });
  }

  unregisterFromEvent(id) {
    return this.request(`/events/${id}/register`, { method: 'DELETE' });
  }

  toggleFavorite(id) {
    return this.request(`/events/${id}/favorite`, { method: 'POST' });
  }

  // Categories
  getCategories() {
    return this.request('/categories');
  }

  // User
  getProfile() {
    return this.request('/users/profile');
  }

  updateProfile(updates) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: updates,
    });
  }

  getFavorites() {
    return this.request('/users/favorites');
  }

  // Admin
  getDashboardStats() {
    return this.request('/admin/dashboard');
  }

  getUsers(params = {}) {
    return this.request('/admin/users', { params });
  }

  updateUserRole(id, role) {
    return this.request(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: { role },
    });
  }

  suspendUser(id, suspend, reason) {
    return this.request(`/admin/users/${id}/suspend`, {
      method: 'PUT',
      body: { suspend, reason },
    });
  }

  getAdminEvents(params = {}) {
    return this.request('/admin/events', { params });
  }

  approveEvent(id) {
    return this.request(`/admin/events/${id}/approve`, { method: 'PUT' });
  }

  rejectEvent(id, reason) {
    return this.request(`/admin/events/${id}/reject`, {
      method: 'PUT',
      body: { reason },
    });
  }

  // Reviewer
  getReviewQueue(params = {}) {
    return this.request('/reviewer/queue', { params });
  }

  reviewApproveEvent(id) {
    return this.request(`/reviewer/events/${id}/approve`, { method: 'PUT' });
  }

  reviewRejectEvent(id, reason) {
    return this.request(`/reviewer/events/${id}/reject`, {
      method: 'PUT',
      body: { reason },
    });
  }

  // Upload
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Axios automatically sets the correct Multipart/Form-Data headers
      const response = await this.client.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed';
      throw new Error(message);
    }
  }
}

export const api = new ApiClient();
export default api;