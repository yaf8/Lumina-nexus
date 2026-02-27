const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const token = this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
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
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  // Events
  getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/events?${queryString}`);
  }

  getEvent(slug) {
    return this.request(`/events/${slug}`);
  }

  createEvent(eventData) {
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
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  registerForEvent(id) {
    return this.request(`/events/${id}/register`, {
      method: 'POST',
    });
  }

  unregisterFromEvent(id) {
    return this.request(`/events/${id}/register`, {
      method: 'DELETE',
    });
  }

  toggleFavorite(id) {
    return this.request(`/events/${id}/favorite`, {
      method: 'POST',
    });
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
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/users?${queryString}`);
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
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/events?${queryString}`);
  }

  approveEvent(id) {
    return this.request(`/admin/events/${id}/approve`, {
      method: 'PUT',
    });
  }

  rejectEvent(id, reason) {
    return this.request(`/admin/events/${id}/reject`, {
      method: 'PUT',
      body: { reason },
    });
  }

  // Reviewer
  getReviewQueue(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reviewer/queue?${queryString}`);
  }

  reviewApproveEvent(id) {
    return this.request(`/reviewer/events/${id}/approve`, {
      method: 'PUT',
    });
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

    const url = `${this.baseURL}/upload/image`;
    const token = this.getToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  }
}

export const api = new ApiClient();
export default api;
