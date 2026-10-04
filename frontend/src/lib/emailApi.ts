// path: frontend/src/lib/emailApi.ts

import adminApi from './adminApi';

export interface Participant {
  id: string;
  fullName: string;
  email: string;
  universityName: string;
  department?: string;
  academicStatus: string;
  researchLevel: string;
  higherStudyInterest: string;
}

export interface EmailFilters {
  search?: string;
  university?: string;
  department?: string;
  academicStatus?: string;
  researchLevel?: string;
  higherStudyInterest?: 'Yes' | 'No' | '';
  registrationSource?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FilterOptions {
  universities: string[];
  departments: string[];
  academicStatuses: string[];
  researchLevels: string[];
  registrationSources: string[];
}

export interface EmailGroup {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  createdAt: string;
}

export interface Campaign {
  id: string;
  subject: string;
  bodyHtml: string;
  cc: string[];
  bcc: string[];
  recipientEmails: string[];
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  failures: { email: string; reason: string }[];
  status: string;
  senderEmail: string;
  createdAt: string;
}

// --- Participants ---

export async function filterParticipants(
  filters: EmailFilters
): Promise<Participant[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
  });
  const res = await adminApi.get(`/admin/emails/participants?${params}`);
  return res.data;
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const res = await adminApi.get('/admin/emails/filter-options');
  return res.data;
}

// --- Preview ---

export async function previewEmail(payload: {
  recipientIds?: string[];
  subject?: string;
  bodyHtml?: string;
}) {
  const res = await adminApi.post('/admin/emails/preview', payload);
  return res.data;
}

// --- Send ---

export async function sendEmail(payload: {
  recipientIds: string[];
  subject: string;
  bodyHtml: string;
  cc?: string[];
  bcc?: string[];
}) {
  const res = await adminApi.post('/admin/emails/send', payload);
  return res.data as { campaignId: string; totalRecipients: number };
}

export async function getCampaignProgress(id: string) {
  const res = await adminApi.get(`/admin/emails/campaigns/${id}/progress`);
  return res.data as {
    id: string;
    status: string;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    failures: { email: string; reason: string }[];
  };
}

export async function getCampaignHistory(): Promise<Campaign[]> {
  const res = await adminApi.get('/admin/emails/campaigns');
  return res.data;
}

// --- Groups ---

export async function listGroups(): Promise<EmailGroup[]> {
  const res = await adminApi.get('/admin/emails/groups');
  return res.data;
}

export async function getGroup(id: string) {
  const res = await adminApi.get(`/admin/emails/groups/${id}`);
  return res.data;
}

export async function createGroup(payload: {
  name: string;
  description?: string;
  memberIds?: string[];
}) {
  const res = await adminApi.post('/admin/emails/groups', payload);
  return res.data;
}

export async function updateGroup(
  id: string,
  payload: { name?: string; description?: string }
) {
  const res = await adminApi.put(`/admin/emails/groups/${id}`, payload);
  return res.data;
}

export async function deleteGroup(id: string) {
  const res = await adminApi.delete(`/admin/emails/groups/${id}`);
  return res.data;
}

export async function addMembersToGroup(id: string, memberIds: string[]) {
  const res = await adminApi.post(`/admin/emails/groups/${id}/members`, {
    memberIds,
  });
  return res.data;
}

export async function removeMemberFromGroup(
  id: string,
  registrationId: string
) {
  const res = await adminApi.delete(
    `/admin/emails/groups/${id}/members/${registrationId}`
  );
  return res.data;
}