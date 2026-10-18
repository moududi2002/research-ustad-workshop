import axios from 'axios';
import adminApi from './adminApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Attendee {
  registrationId: string;
  fullName: string;
  email: string;
  department: string;
  universityName: string;
}
export interface AttendeeResponse {
  attendees: Attendee[];
  mongoAttended: number;
  matched: number;
  missingRegistrationIds: string[];
}
export interface CertificateRecord {
  id: string;
  certificateId: string;
  registrationId: string | null;
  source: 'registered' | 'custom';
  fullName: string;
  email: string;
  universityName: string | null;
  department: string | null;
  workshopName: string;
  workshopDate: string;
  emailStatus: 'queued' | 'sending' | 'sent' | 'failed';
  certificateStatus: 'issued' | 'revoked';
  emailError: string | null;
  createdAt: string;
}
export interface IssueResult {
  requested: number;
  eligible: number;
  created: number;
  alreadyIssued: number;
  notAttendedIds: string[];
  missingRegistrationIds: string[];
}
export interface VerificationResult {
  verified: boolean;
  status: 'issued' | 'revoked';
  certificateId: string;
  participantName: string;
  workshopName: string;
  workshopDate: string;
  maskedEmail: string;
  maskedPhone: string;
  issuedAt: string;
}

export const getAttendees = async () =>
  (await adminApi.get<AttendeeResponse>('/admin/certificates/attendees')).data;
export const getCertificateRecords = async () =>
  (await adminApi.get<CertificateRecord[]>('/admin/certificates/records')).data;
export const issueSelected = async (registrationIds: string[]) =>
  (await adminApi.post<IssueResult>('/admin/certificates/issue', { registrationIds })).data;
export const issueAll = async () =>
  (await adminApi.post<IssueResult>('/admin/certificates/issue-all')).data;
export const issueCustom = async (data: {
  fullName: string; email: string; whatsapp?: string; universityName?: string; department?: string;
}) => (await adminApi.post('/admin/certificates/issue-custom', data)).data;
export const retryCertificate = async (id: string) =>
  (await adminApi.post(`/admin/certificates/retry/${id}`)).data;
export const revokeCertificate = async (id: string) =>
  (await adminApi.patch(`/admin/certificates/revoke/${id}`)).data;
export async function openCertificatePdf(id: string, filename?: string) {
  const res = await adminApi.get(`/admin/certificates/pdf/${id}`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'certificate.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export const getVerification = async (id: string) =>
  (await axios.get<VerificationResult>(`${API_URL}/api/certificates/verify/${encodeURIComponent(id)}`)).data;
