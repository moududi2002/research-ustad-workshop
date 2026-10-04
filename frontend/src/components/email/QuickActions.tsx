// path: frontend/src/components/email/QuickActions.tsx

'use client';

import {
  FiUsers,
  FiGlobe,
  FiBookOpen,
  FiTrendingUp,
  FiSend,
  FiAward,
} from 'react-icons/fi';
import type { EmailFilters } from '@/lib/emailApi';

interface Props {
  onApplyFilter: (filters: EmailFilters, label: string) => void;
  onSendReminder: () => void;
  onSendCertificate: () => void;
}

export default function QuickActions({
  onApplyFilter,
  onSendReminder,
  onSendCertificate,
}: Props) {
  const actions = [
    {
      label: 'All Participants',
      icon: <FiUsers className="h-4 w-4" />,
      onClick: () => onApplyFilter({}, 'All Participants'),
    },
    {
      label: 'Higher Study Interested',
      icon: <FiGlobe className="h-4 w-4" />,
      onClick: () =>
        onApplyFilter({ higherStudyInterest: 'Yes' }, 'Higher Study Interested'),
    },
    {
      label: 'By University',
      icon: <FiBookOpen className="h-4 w-4" />,
      onClick: () => {
        const u = window.prompt('Enter university name:');
        if (u) onApplyFilter({ university: u }, `University: ${u}`);
      },
    },
    {
      label: 'By Department',
      icon: <FiBookOpen className="h-4 w-4" />,
      onClick: () => {
        const d = window.prompt('Enter department name:');
        if (d) onApplyFilter({ department: d }, `Department: ${d}`);
      },
    },
    {
      label: 'By Research Level',
      icon: <FiTrendingUp className="h-4 w-4" />,
      onClick: () => {
        const l = window.prompt(
          'Enter research level (Complete Beginner / Beginner / Developing / Intermediate / Experienced):'
        );
        if (l) onApplyFilter({ researchLevel: l }, `Level: ${l}`);
      },
    },
  ];

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <h3 className="font-display text-sm font-bold text-ink-950">
        Quick Actions
      </h3>
      <p className="mt-1 text-xs text-ink-500">
        Instantly load a filtered audience.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2 border-t border-ink-100 pt-4 sm:grid-cols-2">
        <button
          onClick={onSendReminder}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-50 px-4 py-2.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100"
        >
          <FiSend className="h-3.5 w-3.5" />
          Send Workshop Reminder
        </button>
        <button
          onClick={onSendCertificate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-50 px-4 py-2.5 text-xs font-semibold text-accent-700 transition-colors hover:bg-accent-100"
        >
          <FiAward className="h-3.5 w-3.5" />
          Send Certificate Notification
        </button>
      </div>
    </div>
  );
}