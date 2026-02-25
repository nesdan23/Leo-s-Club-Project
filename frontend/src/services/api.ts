import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<import('@/types').AuthResponse>('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string }) =>
    api.post<import('@/types').AuthResponse>('/auth/register', data),
};

// Events
export const eventsApi = {
  list: () => api.get<import('@/types').Event[]>('/events'),
  getById: (id: string) => api.get<import('@/types').Event>(`/events/${id}`),
  create: (data: {
    title: string;
    description: string;
    date: string;
    location: string;
    status?: string;
    attendees?: string[];
  }) => api.post<import('@/types').Event>('/events', data),
  getVolunteers: (eventId: string) =>
    api.get<import('@/types').EventVolunteersResponse>(`/events/${eventId}/volunteers`),
  importVolunteers: (eventId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<import('@/types').VolunteerImportResponse>(
      `/events/${eventId}/volunteers/import`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};

// Tasks
export const tasksApi = {
  list: () => api.get<import('@/types').Task[]>('/tasks'),
  create: (data: {
    name: string;
    description: string;
    event: string;
    assignee?: string | null;
    status?: string;
    completionPercentage?: number;
    dueDate: string;
    domain: string;
  }) => api.post<import('@/types').Task>('/tasks', data),
  update: (id: string, data: Partial<Pick<import('@/types').Task, 'status' | 'completionPercentage' | 'assignee' | 'dueDate' | 'domain'>>) =>
    api.patch<import('@/types').Task>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Admin
export const adminApi = {
  getDashboard: () =>
    api.get<{ events: import('@/types').AdminDashboardEvent[] }>('/admin/dashboard'),
  getUsers: () =>
    api.get<{ _id: string; name: string; email: string; role: string }[]>('/admin/users'),
};
