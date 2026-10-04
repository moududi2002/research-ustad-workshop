// path: frontend/src/components/email/EmailHistory.tsx

'use client';

import { useEffect, useState } from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiXCircle } from 'react-icons/fi';
import { getCampaignHistory, type Campaign } from '@/lib/emailApi';

export default function EmailHistory() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaignHistory()
      .then(setCampaigns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; icon: JSX.Element }> = {
      sent: {
        cls: 'bg-green-50 text-green-700',
        icon: <FiCheckCircle className="h-3 w-3" />,
      },
      partial: {
        cls: 'bg-amber-50 text-amber-700',
        icon: <FiAlertCircle className="h-3 w-3" />,
      },
      failed: {
        cls: 'bg-red-50 text-red-700',
        icon: <FiXCircle className="h-3 w-3" />,
      },
      sending: {
        cls: 'bg-primary-50 text-primary-700',
        icon: <FiClock className="h-3 w-3" />,
      },
      pending: {
        cls: 'bg-ink-100 text-ink-700',
        icon: <FiClock className="h-3 w-3" />,
      },
    };
    const cfg = map[status] || map.pending;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}
      >
        {cfg.icon}
        {status}
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-ink-100 bg-white shadow-soft">
      <div className="border-b border-ink-100 p-5">
        <div className="flex items-center gap-2">
          <FiClock className="h-4 w-4 text-primary-600" />
          <h3 className="font-display text-sm font-bold text-ink-950">
            Email History
          </h3>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Recent email campaigns.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Recipients
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Sent
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Failed
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && campaigns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-500">
                  No campaigns yet.
                </td>
              </tr>
            )}
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-ink-50">
                <td className="px-4 py-3 text-sm font-semibold text-ink-900">
                  {c.subject}
                </td>
                <td className="px-4 py-3 text-sm text-ink-600">
                  {c.totalRecipients}
                </td>
                <td className="px-4 py-3 text-sm text-green-700">
                  {c.sentCount}
                </td>
                <td className="px-4 py-3 text-sm text-red-600">
                  {c.failedCount}
                </td>
                <td className="px-4 py-3 text-sm text-ink-600">
                  {new Date(c.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">{statusBadge(c.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}