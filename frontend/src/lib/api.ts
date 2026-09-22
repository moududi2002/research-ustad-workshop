//frontend/src/lib/api.ts
import axios from 'axios';
import type { RegistrationFormData, RegistrationResponse, AdminStats } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

export async function submitRegistration(
  data: RegistrationFormData
): Promise<RegistrationResponse> {
  const response = await api.post<RegistrationResponse>('/registrations', data);
  return response.data;
}

export async function getRegistration(id: string): Promise<RegistrationResponse> {
  const response = await api.get<RegistrationResponse>(`/registrations/${id}`);
  return response.data;
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await api.get<AdminStats>('/admin/stats');
  return response.data;
}

export async function exportRegistrations(format: 'csv' | 'excel'): Promise<Blob> {
  const response = await api.get(`/admin/export?format=${format}`, {
    responseType: 'blob',
  });
  return response.data;
}

export default api;