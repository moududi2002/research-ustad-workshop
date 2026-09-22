// path: frontend/src/lib/adminApi.ts

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Axios instance for admin requests.
 * `withCredentials: true` is REQUIRED so the browser sends
 * the HttpOnly JWT cookie on every request.
 */
const adminApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Redirect to login if 401 Unauthorized comes back
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/admin/login')
    ) {
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export interface AdminInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; admin: AdminInfo }> {
  const response = await adminApi.post('/admin/login', { email, password });
  return response.data;
}

export async function adminLogout(): Promise<void> {
  await adminApi.post('/admin/logout');
}

export async function getCurrentAdmin(): Promise<{ admin: AdminInfo }> {
  const response = await adminApi.get('/admin/me');
  return response.data;
}

export async function getAdminStats() {
  const response = await adminApi.get('/admin/stats');
  return response.data;
}

export async function exportRegistrations(
  format: 'csv' | 'excel'
): Promise<Blob> {
  const response = await adminApi.get(`/admin/export?format=${format}`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function sendBulkEmail(subject: string, htmlBody: string) {
  const response = await adminApi.post('/admin/send-bulk-email', {
    subject,
    htmlBody,
  });
  return response.data;
}

export async function sendWorkshopReminder() {
  const response = await adminApi.post('/admin/send-reminder');
  return response.data;
}

export async function sendCertificateNotification() {
  const response = await adminApi.post('/admin/send-certificate-notification');
  return response.data;
}

export default adminApi;