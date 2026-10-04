// path: frontend/src/app/admin/emails/page.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminGuard from '@/components/AdminGuard';
import FilterPanel from '@/components/email/FilterPanel';
import ParticipantSelector from '@/components/email/ParticipantSelector';
import EmailComposer from '@/components/email/EmailComposer';
import GroupManager from '@/components/email/GroupManager';
import EmailHistory from '@/components/email/EmailHistory';
import SendProgress from '@/components/email/SendProgress';
import QuickActions from '@/components/email/QuickActions';
import {
  FiArrowLeft,
  FiUsers,
  FiLogOut,
  FiFolder,
  FiSend,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  filterParticipants,
  getFilterOptions,
  getCampaignProgress,
  type Participant,
  type FilterOptions,
  type EmailFilters,
} from '@/lib/emailApi';
import { adminLogout } from '@/lib/adminApi';



const emptyOptions: FilterOptions = {
  universities: [],
  departments: [],
  academicStatuses: [],
  researchLevels: [],
  registrationSources: [],
};

export default function EmailManagementPage() {
  return (
    <AdminGuard>
      <EmailManagementContent />
    </AdminGuard>
  );
}

function EmailManagementContent() {
  const router = useRouter();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<EmailFilters>({});
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<FilterOptions>(emptyOptions);
  const [loading, setLoading] = useState(false);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  // Load filter options once
  useEffect(() => {
    getFilterOptions().then(setOptions).catch(() => {});
  }, []);

  // Load participants when filters/search change (debounced)
  const loadParticipants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await filterParticipants({ ...filters, search });
      setParticipants(data);
    } catch {
      toast.error('Failed to load participants.');
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => {
    const t = setTimeout(loadParticipants, 300);
    return () => clearTimeout(t);
  }, [loadParticipants]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(participants.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const resetFilters = () => {
    setFilters({});
    setSearch('');
  };

  const handleApplyQuickFilter = (f: EmailFilters, label: string) => {
    setFilters(f);
    toast.success(`Applied: ${label}`);
  };

  const handleSendReminder = async () => {
    toast('Workshop Reminder feature will be enabled soon.');
  };

  const handleSendCertificate = async () => {
   toast('Certificate Notification feature will be enabled soon.');
  };

  const handleSent = async (campaignId: string, totalRecipients: number) => {
    setProgress({
      status: 'sending',
      totalRecipients,
      sentCount: 0,
      failedCount: 0,
      failures: [],
    });
    setProgressOpen(true);

    // Poll progress every 1.5s
    const interval = setInterval(async () => {
      try {
        const p = await getCampaignProgress(campaignId);
        setProgress(p);
        if (['sent', 'partial', 'failed'].includes(p.status)) {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      router.replace('/admin/login');
    } catch {
      toast.error('Logout failed.');
    }
  };

  const selectedArray = Array.from(selectedIds);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink-50 pb-20 pt-28 sm:pt-32">
        <div className="container-custom">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition-colors hover:text-primary-600"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <FiSend className="h-5 w-5 text-primary-600" />
                <h1 className="font-display text-2xl font-bold text-ink-950 sm:text-3xl">
                  Email Management
                </h1>
              </div>
              <p className="mt-1 text-sm text-ink-500">
                Send professional emails to participants — individually, by
                filter, or in custom groups.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm">
                <FiUsers className="h-4 w-4 text-primary-600" />
                <span className="font-semibold text-ink-900">
                  {participants.length}
                </span>
                <span className="text-ink-500">total</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm">
                <FiUsers className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-800">
                  {selectedIds.size}
                </span>
                <span className="text-green-700">selected</span>
              </div>
              <button
                onClick={() => setGroupModalOpen(true)}
                className="btn-secondary !py-2.5 !text-sm"
              >
                <FiFolder className="h-4 w-4" />
                Groups
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

          {/* Quick actions */}
          <QuickActions
            onApplyFilter={handleApplyQuickFilter}
            onSendReminder={handleSendReminder}
            onSendCertificate={handleSendCertificate}
          />

          {/* Layout */}
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Left: Selection */}
            <div className="space-y-6 lg:col-span-7">
              <FilterPanel
                filters={filters}
                options={options}
                onChange={setFilters}
                onReset={resetFilters}
              />
              <ParticipantSelector
                participants={participants}
                selectedIds={selectedIds}
                onToggle={toggleSelection}
                onToggleAll={toggleAll}
                search={search}
                onSearchChange={setSearch}
                onSaveAsGroup={() => setGroupModalOpen(true)}
              />
            </div>

            {/* Right: Composer */}
            <div className="space-y-6 lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <EmailComposer
                  selectedIds={selectedArray}
                  onSent={handleSent}
                  onClear={() => setSelectedIds(new Set())}
                />
              </div>
            </div>
          </div>

          {/* History */}
          <div className="mt-8">
            <EmailHistory />
          </div>
        </div>
      </main>
      <Footer />

      <GroupManager
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onUseGroup={(ids) => {
          setSelectedIds(new Set(ids));
        }}
        pendingSelection={selectedArray}
      />

      <SendProgress
        open={progressOpen}
        progress={progress}
        onClose={() => {
          setProgressOpen(false);
          setProgress(null);
        }}
      />
    </>
  );
}