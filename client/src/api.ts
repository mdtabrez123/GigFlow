import axios from 'axios';
import type { PaginatedResponse, Lead } from './types';

// Simple mock interceptor for token (assumes token is stored in localStorage)
const apiClient = axios.create({
  baseURL: 'https://gigflow-syfe.onrender.com/api', // Live Render backend
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface GetLeadsParams {
  status?: string;
  source?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const fetchLeads = async (params: GetLeadsParams = {}) => {
  const { data } = await apiClient.get<PaginatedResponse<Lead>>('/leads', { params });
  return data;
};

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const apiLogin = async (credentials: any) => {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data;
};

export const apiRegister = async (payload: any) => {
  const { data } = await apiClient.post('/auth/register', payload);
  return data;
};

export const apiGetMe = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};

// ─── Lead CRUD API ────────────────────────────────────────────────────────────

export const getLead = async (id: string) => {
  const { data } = await apiClient.get(`/leads/${id}`);
  return data;
};

export const createLead = async (payload: Partial<Lead>) => {
  const { data } = await apiClient.post('/leads', payload);
  return data;
};

export const updateLead = async (id: string, payload: Partial<Lead>) => {
  const { data } = await apiClient.patch(`/leads/${id}`, payload);
  return data;
};

export const deleteLead = async (id: string) => {
  const { data } = await apiClient.delete(`/leads/${id}`);
  return data;
};
