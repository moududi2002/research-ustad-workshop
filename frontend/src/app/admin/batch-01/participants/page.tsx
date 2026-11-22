// frontend/src/app/admin/batch-01/participants/page.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';

type Participant = {
  _id: string;
  registrationId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  universityName: string;
  department?: string;
  academicStatus: string;
  researchLevel: string;
  higherStudyInterest: string;
  preferredCountry?: string;
  status: 'draft' | 'initiating' | 'pending' | 'paid' | 'confirmed';
  amount: number;
  originalAmount: number;
  pricingType: string;
  couponCode?: string;
  invoiceNumber?: string;
  transactionId?: string;
  paymentMethod?: string;
  paidAt?: string;
  confirmedAt?: string;
  notifications?: {
    email?: string;
    sms?: string;
  };
  enrollmentEmailStatus?: string;
  createdAt: string;
};

type Stats = {
  total: number;
  draft: number;
  pending: number;
  paid: number;
  confirmed: number;
  revenue: number;
};

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  initiating: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
};

export default function Batch01ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [participantResponse, statsResponse] = await Promise.all([
        adminApi.get('/course/batch-01/admin/participants', {
          params: {
            search: search.trim() || undefined,
            status,
            page,
            limit: 20,
          },
        }),
        adminApi.get('/course/batch-01/admin/participants/stats'),
      ]);

      setParticipants(participantResponse.data.data || []);
      setTotalPages(
        participantResponse.data.pagination?.totalPages || 1,
      );
      setStats(statsResponse.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'Unable to load Batch-01 participants.',
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadData]);

  const runAction = async (
    id: string,
    action: 'confirm' | 'payment-email' | 'enrollment-email',
  ) => {
    const messages: Record<string, string> = {
      confirm: 'Confirm this paid participant’s enrollment?',
      'payment-email': 'Resend payment confirmation email?',
      'enrollment-email': 'Resend enrollment confirmation email?',
    };

    if (!window.confirm(messages[action])) return;

    setActionId(id);
    setMessage('');
    setError('');

    try {
      let endpoint = '';

      if (action === 'confirm') {
        endpoint = `/course/batch-01/admin/participants/${id}/confirm`;
      } else if (action === 'payment-email') {
        endpoint = `/course/batch-01/admin/participants/${id}/resend-payment-email`;
      } else {
        endpoint = `/course/batch-01/admin/participants/${id}/resend-enrollment-email`;
      }

      const response = await adminApi.post(endpoint);

      setMessage(
        response.data?.message || 'Action completed successfully.',
      );

      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'The requested action could not be completed.',
      );
    } finally {
      setActionId('');
    }
  };

  const money = (value: number) =>
    `৳${Number(value || 0).toLocaleString('en-BD')}`;

  return (
    <main className="min-h-screen bg-[#F5F8FB] p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#C99589]">
              RESEARCH USTAD · ADMIN
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#333456]">
              Batch-01 Participants
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Research Foundation Course-2026
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href="/admin/batch-01"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#3A5A78]"
            >
              Course Settings
            </a>

            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-lg bg-[#3A5A78] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {[
              ['Total', stats.total],
              ['Draft', stats.draft],
              ['Pending', stats.pending],
              ['Paid', stats.paid],
              ['Confirmed', stats.confirmed],
              ['Revenue', money(stats.revenue)],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-2 text-xl font-bold text-[#333456]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone, registration ID, transaction..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#3A5A78]"
            />

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#3A5A78]"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="initiating">Initiating</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-[#F5F8FB] text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-3">Participant</th>
                  <th className="px-3 py-3">Registration ID</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-gray-500">
                      Loading participants...
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-gray-500">
                      No participants found.
                    </td>
                  </tr>
                ) : (
                  participants.map((participant) => (
                    <tr key={participant._id} className="align-top">
                      <td className="px-3 py-4">
                        <p className="font-semibold text-[#333456]">
                          {participant.fullName}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {participant.universityName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {participant.department}
                        </p>
                      </td>

                      <td className="px-3 py-4 font-mono text-xs">
                        {participant.registrationId}
                      </td>

                      <td className="px-3 py-4">
                        <p>{participant.email}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {participant.whatsapp}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <p className="font-semibold">
                          {money(participant.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {participant.pricingType}
                        </p>
                        {participant.couponCode && (
                          <p className="text-xs text-[#3A5A78]">
                            Coupon: {participant.couponCode}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusStyles[participant.status] ||
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {participant.status}
                        </span>

                        {participant.transactionId && (
                          <p className="mt-2 max-w-[150px] break-all text-xs text-gray-500">
                            TXN: {participant.transactionId}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-4 text-xs">
                        <p>
                          Payment: {participant.notifications?.email || 'pending'}
                        </p>
                        <p className="mt-1">
                          Enrollment: {participant.enrollmentEmailStatus || 'pending'}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex min-w-[180px] flex-col gap-2">
                          {participant.status === 'paid' && (
                            <button
                              onClick={() =>
                                runAction(participant._id, 'confirm')
                              }
                              disabled={actionId === participant._id}
                              className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Confirm Enrollment
                            </button>
                          )}

                          {['paid', 'confirmed'].includes(participant.status) && (
                            <button
                              onClick={() =>
                                runAction(participant._id, 'payment-email')
                              }
                              disabled={actionId === participant._id}
                              className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-[#3A5A78] disabled:opacity-50"
                            >
                              Resend Payment Email
                            </button>
                          )}

                          {participant.status === 'confirmed' && (
                            <button
                              onClick={() =>
                                runAction(participant._id, 'enrollment-email')
                              }
                              disabled={actionId === participant._id}
                              className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-[#3A5A78] disabled:opacity-50"
                            >
                              Resend Enrollment Email
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages || loading}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}