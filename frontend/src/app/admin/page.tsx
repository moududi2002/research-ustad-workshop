// path: frontend/src/app/admin/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminGuard from '@/components/AdminGuard';
import {
  FiUsers,
  FiUserPlus,
  FiDownload,
  FiSearch,
  FiFilter,
  FiMail,
  FiSend,
  FiLogOut,
} from 'react-icons/fi';
import { HiOutlineChartBar } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import {
  getAdminStats,
  getRegistrations,
  exportRegistrations,
  adminLogout,
  sendWorkshopReminder,
  sendCertificateNotification,
} from '@/lib/adminApi';

interface Stats {
  totalRegistrations: number;
  todayRegistrations: number;
  universityStats: { university: string; count: number }[];
  researchLevelStats: { level: string; count: number }[];
  higherStudyStats: { interest: string; count: number };
}

const emptyStats: Stats = {
  totalRegistrations: 0,
  todayRegistrations: 0,
  universityStats: [],
  researchLevelStats: [],
  higherStudyStats: { interest: 'Yes', count: 0 },
};

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
  Promise.all([getAdminStats(), getRegistrations()])
    .then(([statsData, registrationsData]) => {
      setStats(statsData);
      setParticipants(registrationsData);
    })
    .catch((err) => {
      toast.error('Failed to load dashboard data.');
      console.error(err);
    })
    .finally(() => setLoading(false));
}, []);

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const blob = await exportRegistrations(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed.');
    }
  };

  const handleReminder = async () => {
    try {
      const res = await sendWorkshopReminder();
      toast.success(`Reminder sent to ${res.sent} participants.`);
    } catch {
      toast.error('Failed to send reminder.');
    }
  };

  const handleCertificateNotify = async () => {
    try {
      const res = await sendCertificateNotification();
      toast.success(`Certificate notification sent to ${res.sent}.`);
    } catch {
      toast.error('Failed to send certificate notification.');
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      toast.success('Logged out.');
      router.replace('/admin/login');
    } catch {
      toast.error('Logout failed.');
    }
  };

  const filteredParticipants = participants.filter(
  (p: any) =>
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.universityName?.toLowerCase().includes(search.toLowerCase()) ||
    p.registrationId?.toLowerCase().includes(search.toLowerCase())
);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink-50 pb-20 pt-28 sm:pt-32">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-950 sm:text-3xl">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                Manage workshop registrations and communications.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExport('csv')}
                className="btn-secondary !py-2.5 !text-sm"
              >
                <FiDownload className="h-4 w-4" />
                CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="btn-secondary !py-2.5 !text-sm"
              >
                <FiDownload className="h-4 w-4" />
                Excel
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary !py-2.5 !text-sm !border-red-200 !text-red-600 hover:!bg-red-50"
              >
                <FiLogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={<FiUsers className="h-5 w-5" />}
                  label="Total Registrations"
                  value={stats.totalRegistrations.toString()}
                  color="primary"
                />
                <StatCard
                  icon={<FiUserPlus className="h-5 w-5" />}
                  label="Today's Registrations"
                  value={stats.todayRegistrations.toString()}
                  color="green"
                />
                <StatCard
                  icon={<HiOutlineChartBar className="h-5 w-5" />}
                  label="Interested in Higher Study"
                  value={stats.higherStudyStats.count.toString()}
                  color="accent"
                />
                <StatCard
                  icon={<FiMail className="h-5 w-5" />}
                  label="Emails Collected"
                  value={stats.totalRegistrations.toString()}
                  color="indigo"
                />
              </div>

              {/* Charts */}
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
                  <h2 className="font-display text-lg font-bold text-ink-950">
                    University-wise Statistics
                  </h2>
                  <div className="mt-5 space-y-4">
                    {stats.universityStats.map((item) => {
                      const max = Math.max(
                        ...stats.universityStats.map((s) => s.count),
                        1
                      );
                      const width = (item.count / max) * 100;
                      return (
                        <div key={item.university}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="font-medium text-ink-700">
                              {item.university}
                            </span>
                            <span className="font-semibold text-ink-900">
                              {item.count}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                            <div
                              className="h-full rounded-full bg-primary-600 transition-all"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
                  <h2 className="font-display text-lg font-bold text-ink-950">
                    Research Level Distribution
                  </h2>
                  <div className="mt-5 space-y-4">
                    {stats.researchLevelStats.map((item) => {
                      const max = Math.max(
                        ...stats.researchLevelStats.map((s) => s.count),
                        1
                      );
                      const width = (item.count / max) * 100;
                      return (
                        <div key={item.level}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="font-medium text-ink-700">
                              {item.level}
                            </span>
                            <span className="font-semibold text-ink-900">
                              {item.count}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                            <div
                              className="h-full rounded-full bg-accent-500 transition-all"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Participant Management */}
              <div className="mt-8 rounded-2xl border border-ink-100 bg-white shadow-soft">
                <div className="flex flex-col justify-between gap-4 border-b border-ink-100 p-6 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-display text-lg font-bold text-ink-950">
                      Participant Management
                    </h2>
                    <p className="mt-0.5 text-sm text-ink-500">
                      Search, filter, and manage all registrations.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        type="text"
                        placeholder="Search participants..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field !py-2.5 !pl-9 !text-sm"
                      />
                    </div>
                    <button className="btn-secondary !py-2.5 !text-sm">
                      <FiFilter className="h-4 w-4" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ink-100 bg-ink-50/60">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                          Registration ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                          University
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                          Higher Study
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {filteredParticipants.map((p: any) => (
                        <tr
                          key={p.id}
                          className="transition-colors hover:bg-primary-50/40"
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-ink-600">
                            {p.registrationId || p.id}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-ink-900">
                            {p.name || p.fullName}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-600">
                            {p.email}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-600">
                            {p.university || p.universityName}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                              {p.level || p.researchLevel}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                (p.higherStudy || p.higherStudyInterest) === 'Yes'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-ink-100 text-ink-600'
                              }`}
                            >
                              {p.higherStudy || p.higherStudyInterest}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredParticipants.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-ink-500">
                      No participants found. Data will appear here once
                      registrations start.
                    </p>
                  </div>
                )}
              </div>

              {/* Communication */}
              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <CommCard
                  title="Bulk Email"
                  description="Send an email to all registered participants."
                  buttonLabel="Compose Email"
                  icon={<FiMail className="h-5 w-5" />}
                  onClick={() => toast('Bulk email composer coming soon.')}
                />
                <CommCard
                  title="Workshop Reminder"
                  description="Send a reminder before the workshop date."
                  buttonLabel="Send Reminder"
                  icon={<FiSend className="h-5 w-5" />}
                  onClick={handleReminder}
                />
                <CommCard
                  title="Certificate Notification"
                  description="Notify participants when certificates are ready."
                  buttonLabel="Notify Participants"
                  icon={<FiMail className="h-5 w-5" />}
                  onClick={handleCertificateNotify}
                />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'primary' | 'green' | 'accent' | 'indigo';
}) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    accent: 'bg-accent-50 text-accent-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft transition-shadow hover:shadow-card">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}
      >
        {icon}
      </div>
      <p className="mt-4 text-sm font-medium text-ink-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-ink-950">{value}</p>
    </div>
  );
}

function CommCard({
  title,
  description,
  buttonLabel,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-base font-bold text-ink-950">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
        {description}
      </p>
      <button
        onClick={onClick}
        className="btn-secondary mt-4 w-full !py-2.5 !text-sm"
      >
        {buttonLabel}
      </button>
    </div>
  );
}