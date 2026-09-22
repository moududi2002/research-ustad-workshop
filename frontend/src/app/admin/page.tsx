//frontend/src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  FiUsers,
  FiUserPlus,
  FiDownload,
  FiSearch,
  FiFilter,
  FiMail,
  FiSend,
} from 'react-icons/fi';
import { HiOutlineChartBar } from 'react-icons/hi2';
import toast from 'react-hot-toast';

interface Stats {
  totalRegistrations: number;
  todayRegistrations: number;
  universityStats: { university: string; count: number }[];
  researchLevelStats: { level: string; count: number }[];
  higherStudyStats: { interest: string; count: number };
}

const mockStats: Stats = {
  totalRegistrations: 248,
  todayRegistrations: 17,
  universityStats: [
    { university: 'University of Dhaka', count: 62 },
    { university: 'BUET', count: 41 },
    { university: 'RUET', count: 28 },
    { university: 'Jahangirnagar University', count: 24 },
    { university: 'Others', count: 93 },
  ],
  researchLevelStats: [
    { level: 'Complete Beginner', count: 74 },
    { level: 'Beginner', count: 86 },
    { level: 'Developing', count: 52 },
    { level: 'Intermediate', count: 28 },
    { level: 'Experienced', count: 8 },
  ],
  higherStudyStats: { interest: 'Yes', count: 201 },
};

const mockParticipants = [
  {
    id: 'RU-2026-0001',
    name: 'Ayesha Rahman',
    email: 'ayesha@example.com',
    university: 'University of Dhaka',
    level: 'Beginner',
    higherStudy: 'Yes',
    date: '2026-09-01',
  },
  {
    id: 'RU-2026-0002',
    name: 'Tanvir Ahmed',
    email: 'tanvir@example.com',
    university: 'BUET',
    level: 'Developing',
    higherStudy: 'Yes',
    date: '2026-09-01',
  },
  {
    id: 'RU-2026-0003',
    name: 'Nusrat Jahan',
    email: 'nusrat@example.com',
    university: 'RUET',
    level: 'Complete Beginner',
    higherStudy: 'No',
    date: '2026-09-02',
  },
];

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>(mockStats);
  const [search, setSearch] = useState('');
  const [participants] = useState(mockParticipants);

  useEffect(() => {
    // In production, fetch from /api/admin/stats
    // getAdminStats().then(setStats).catch(console.error);
  }, []);

  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.university.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = (format: 'csv' | 'excel') => {
    toast.success(`Exporting registrations as ${format.toUpperCase()}...`);
    // In production: exportRegistrations(format)
  };

  const handleBulkEmail = () => {
    toast.success('Bulk email composer opened.');
  };

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
            <div className="flex gap-3">
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
                onClick={handleBulkEmail}
                className="btn-primary !py-2.5 !text-sm"
              >
                <FiSend className="h-4 w-4" />
                Bulk Email
              </button>
            </div>
          </div>

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
            {/* University-wise */}
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
              <h2 className="font-display text-lg font-bold text-ink-950">
                University-wise Statistics
              </h2>
              <div className="mt-5 space-y-4">
                {stats.universityStats.map((item) => {
                  const max = Math.max(
                    ...stats.universityStats.map((s) => s.count)
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

            {/* Research Level */}
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
              <h2 className="font-display text-lg font-bold text-ink-950">
                Research Level Distribution
              </h2>
              <div className="mt-5 space-y-4">
                {stats.researchLevelStats.map((item) => {
                  const max = Math.max(
                    ...stats.researchLevelStats.map((s) => s.count)
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
                  {filteredParticipants.map((p) => (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-primary-50/40"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-ink-600">
                        {p.id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-ink-900">
                        {p.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-600">
                        {p.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-600">
                        {p.university}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                          {p.level}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            p.higherStudy === 'Yes'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-ink-100 text-ink-600'
                          }`}
                        >
                          {p.higherStudy}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredParticipants.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-ink-500">No participants found.</p>
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
            />
            <CommCard
              title="Workshop Reminder"
              description="Send a reminder before the workshop date."
              buttonLabel="Send Reminder"
              icon={<FiSend className="h-5 w-5" />}
            />
            <CommCard
              title="Certificate Notification"
              description="Notify participants when certificates are ready."
              buttonLabel="Notify Participants"
              icon={<FiMail className="h-5 w-5" />}
            />
          </div>
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
}: {
  title: string;
  description: string;
  buttonLabel: string;
  icon: React.ReactNode;
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
      <button className="btn-secondary mt-4 w-full !py-2.5 !text-sm">
        {buttonLabel}
      </button>
    </div>
  );
}