'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import {
  FiArrowLeft, FiRefreshCw, FiSearch, FiUsers, FiCheckCircle,
  FiClock, FiCreditCard, FiMonitor, FiX, FiMail, FiPhone,
  FiDownload, FiFilter,
} from 'react-icons/fi';

import { io } from 'socket.io-client';

const PAGE_SIZE = 20;

type RegistrationStatus = 'draft' | 'initiating' | 'pending' | 'paid' | 'confirmed';
type DeviceInfo = {
  type: string;
  browser: string;
  os: string;
  network: string;
  userAgent: string;
};

type Participant = {
  id: string;
  registrationId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  academicStatus: string;
  universityName: string;
  department: string;
  researchLevel: string;
  higherStudyInterest: string;
  preferredCountry: string;
  registrationSource: string;
  status: RegistrationStatus;
  amount: number;
  originalAmount: number;
  couponCode: string | null;
  discountAmount: number;
  environment: string;
  invoiceNumber: string | null;
  transactionId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notifications: { email: string; sms: string };
  deviceInfo: DeviceInfo | null;
};

type Overview = {
  total: number;
  awaitingPayment: number;
  paid: number;
  confirmed: number;
  revenue: number;
};

type ApiResponse = {
  rows: Participant[];
  total: number;
  page: number;
  pageSize: number;
  overview: Overview;
};

const emptyOverview: Overview = {
  total: 0, awaitingPayment: 0, paid: 0, confirmed: 0, revenue: 0,
};

const statusColors: Record<RegistrationStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  initiating: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-orange-50 text-orange-700 border-orange-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka',
  }).format(date);
}

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString('en-BD')}`;
}

function StatusPill({ status }: { status: RegistrationStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusColors[status] || statusColors.draft}`}>
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function Metric({ label, value, caption, icon, tone }: {
  label: string; value: string; caption: string;
  icon: React.ReactNode; tone: 'indigo' | 'emerald' | 'amber' | 'sky';
}) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`rounded-xl p-2.5 ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{value}</div>
      <p className="mt-1 truncate text-xs text-slate-400">{caption}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0 border-b border-slate-100 py-3 last:border-0">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="break-words text-sm font-semibold text-slate-800">{value === null || value === undefined || value === '' ? '—' : value}</p>
    </div>
  );
}

function ParticipantDetails({ participant, onClose }: {
  participant: Participant; onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const p = participant;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="participant-dialog-title"
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 bg-gradient-to-r from-indigo-950 to-indigo-700 p-6 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Course 01 Participant</p>
            <h2 id="participant-dialog-title" className="mt-2 text-2xl font-extrabold">{p.fullName}</h2>
            <p className="mt-1 break-all text-sm text-indigo-100">{p.registrationId}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close details"
            className="rounded-xl bg-white/15 p-2.5 hover:bg-white/25"><FiX size={20} /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
            <StatusPill status={p.status} />
            <span className="text-lg font-extrabold text-indigo-900">{money(p.amount)}</span>
          </div>
          <div className="grid gap-x-7 sm:grid-cols-2">
            <Detail label="Email" value={p.email} />
            <Detail label="WhatsApp" value={p.whatsapp} />
            <Detail label="Academic status" value={p.academicStatus} />
            <Detail label="University" value={p.universityName} />
            <Detail label="Department" value={p.department} />
            <Detail label="Research knowledge" value={p.researchLevel} />
            <Detail label="Higher study interest" value={p.higherStudyInterest} />
            <Detail label="Preferred country" value={p.preferredCountry} />
            <Detail label="Registration source" value={p.registrationSource} />
            <Detail label="Registration created" value={formatDate(p.createdAt)} />
            <Detail label="Coupon code" value={p.couponCode} />
            <Detail label="Coupon discount" value={money(p.discountAmount)} />
            <Detail label="Invoice" value={p.invoiceNumber} />
            <Detail label="Transaction ID" value={p.transactionId} />
            <Detail label="Payment method" value={p.paymentMethod} />
            <Detail label="Payment environment" value={p.environment} />
            <Detail label="Paid at" value={formatDate(p.paidAt)} />
            <Detail label="Confirmed at" value={formatDate(p.confirmedAt)} />
            <Detail label="Email notification" value={p.notifications?.email} />
            <Detail label="SMS notification" value={p.notifications?.sms} />
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <div className="mb-3 flex items-center gap-2 font-extrabold text-indigo-950"><FiMonitor /> Device at registration</div>
            {p.deviceInfo ? (
              <div className="grid gap-x-6 sm:grid-cols-2">
                <Detail label="Device type" value={p.deviceInfo.type} />
                <Detail label="Operating system" value={p.deviceInfo.os} />
                <Detail label="Browser" value={p.deviceInfo.browser} />
                <Detail label="Masked network" value={p.deviceInfo.network} />
                <div className="sm:col-span-2"><Detail label="Browser user agent (reported)" value={p.deviceInfo.userAgent} /></div>
              </div>
            ) : <p className="text-sm text-slate-600">Device information was not captured for this earlier registration.</p>}
          </div>
        </div>
        <div className="shrink-0 border-t border-slate-100 bg-slate-50 p-4 text-right">
          <button type="button" onClick={onClose} className="rounded-xl bg-indigo-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-800">Close</button>
        </div>
      </section>
    </div>
  );
}

export default function CourseParticipantsPage() {
  return <AdminGuard><CourseParticipantsDashboard /></AdminGuard>;
}

function CourseParticipantsDashboard() {
  const [rows, setRows] = useState<Participant[]>([]);
  const [overview, setOverview] = useState<Overview>(emptyOverview);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Participant | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const generation = useRef(0);
  const loadingMoreLock = useRef(false);
  const scrollBox = useRef<HTMLDivElement>(null);

  const [liveConnected, setLiveConnected] = useState(false);

  const liveRefreshRef = useRef<() => Promise<void>>(
    async () => {},
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const requestPage = useCallback(async (n: number, signal?: AbortSignal): Promise<ApiResponse> => {
    const query = new URLSearchParams({
      page: String(n), limit: String(PAGE_SIZE), search: debouncedSearch, status,
    });
    const response = await fetch(`/api/course/admin/participants?${query}`, {
      cache: 'no-store', credentials: 'same-origin', signal,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Admin session expired. Please sign in again.');
      throw new Error(`Unable to load participants (HTTP ${response.status}).`);
    }
    return response.json();
  }, [debouncedSearch, status]);

  useEffect(() => {
    const ticket = ++generation.current;
    const controller = new AbortController();
    loadingMoreLock.current = false;
    setLoading(true);
    setLoadingMore(false);
    setRows([]);
    setPage(0);
    setError('');
    scrollBox.current?.scrollTo({ top: 0 });

    void requestPage(1, controller.signal).then((result) => {
      if (ticket !== generation.current) return;
      setRows(result.rows);
      setTotal(result.total);
      setOverview(result.overview);
      setPage(1);
    }).catch((err) => {
      if (ticket !== generation.current || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Unable to load participants');
    }).finally(() => {
      if (ticket === generation.current) setLoading(false);
    });

    return () => { ++generation.current; controller.abort(); };
  }, [requestPage, refreshKey]);

  const fetchNextPage = useCallback(async () => {
    if (loadingMoreLock.current || loading || rows.length >= total || page === 0) return;
    loadingMoreLock.current = true;
    setLoadingMore(true);
    const ticket = generation.current;
    try {
      const result = await requestPage(page + 1);
      if (ticket !== generation.current) return;
      setRows((current) => {
        const ids = new Set(current.map((row) => row.id));
        return [...current, ...result.rows.filter((row) => !ids.has(row.id))];
      });
      setPage(page + 1);
      setTotal(result.total);
    } catch (err) {
      if (ticket === generation.current) setError(err instanceof Error ? err.message : 'Unable to load more');
    } finally {
      if (ticket === generation.current) { loadingMoreLock.current = false; setLoadingMore(false); }
    }
  }, [loading, rows.length, total, page, requestPage]);


    const refreshLiveRecords = useCallback(async () => {
      if (page < 1) return;

      const ticket = generation.current;
      const loadedPages = page;

      try {
        // Refresh every currently loaded 20-row page.
        // This preserves the internal table's scroll position.
        const results = await Promise.all(
          Array.from(
            { length: loadedPages },
            (_, index) => requestPage(index + 1),
          ),
        );

        if (ticket !== generation.current) return;

        const unique = new Map<string, Participant>();

        for (const result of results) {
          for (const participant of result.rows) {
            unique.set(participant.id, participant);
          }
        }

        const updatedRows = Array.from(unique.values());

        setRows(updatedRows);

        if (results.length > 0) {
          setTotal(results[0].total);
          setOverview(results[0].overview);
        }

        // Keep an opened detail modal synchronized.
        setSelected((current) => {
          if (!current) return null;

          return (
            updatedRows.find((row) => row.id === current.id) ||
            null
          );
        });

        setError('');
      } catch (error) {
        if (ticket !== generation.current) return;

        setError(
          error instanceof Error
            ? error.message
            : 'Live refresh failed',
        );
      }
    }, [page, requestPage]);

    useEffect(() => {
      liveRefreshRef.current = refreshLiveRecords;
    }, [refreshLiveRecords]);


  useEffect(() => {
    let stopped = false;
    let running = false;
    let rerun = false;

    let refreshTimer: ReturnType<typeof setTimeout> | null =
      null;

    function scheduleRefresh() {
      if (stopped) return;

      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      refreshTimer = setTimeout(() => {
        void runRefresh();
      }, 300);
    }

    async function runRefresh() {
      if (stopped) return;

      if (running) {
        rerun = true;
        return;
      }

      running = true;

      try {
        await liveRefreshRef.current();
      } finally {
        running = false;

        if (!stopped && rerun) {
          rerun = false;
          scheduleRefresh();
        }
      }
    }

    const socket = io('/course-admin', {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
    });

    function onConnect() {
      if (stopped) return;

      setLiveConnected(true);
      scheduleRefresh();
    }

    function onDisconnect() {
      if (stopped) return;

      setLiveConnected(false);
    }

    function onConnectError(error: Error) {
      if (stopped) return;

      setLiveConnected(false);

      console.warn(
        '[Course Dashboard] WebSocket:',
        error.message,
      );
    }

    function onCourseChanged() {
      scheduleRefresh();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    socket.on('course:changed', onCourseChanged);

    socket.connect();

    // Reconcile occasionally in case an event was missed.
    const fallbackTimer = window.setInterval(() => {
      scheduleRefresh();
    }, 60000);

    return () => {
      stopped = true;

      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      window.clearInterval(fallbackTimer);

      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);

      socket.off('course:changed', onCourseChanged);

      socket.disconnect();
    };
  }, []);



  function onTableScroll(event: React.UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 220) void fetchNextPage();
  }

  function downloadLoadedCsv() {
    const headers = ['Registration ID', 'Full Name', 'Email', 'WhatsApp', 'University', 'Status', 'Course Fee', 'Coupon', 'Payment Method', 'Invoice', 'Transaction ID', 'Device Type', 'OS', 'Browser', 'Masked Network', 'Created At'];
    const csvCell = (value: unknown) => {
      let data = String(value ?? '');
      if (/^[\s]*[=+@\-\t\r]/.test(data)) data = `'${data}`;
      return `"${data.replace(/"/g, '""')}"`;
    };
    const content = [headers, ...rows.map((p) => [
      p.registrationId, p.fullName, p.email, p.whatsapp, p.universityName,
      p.status, p.amount, p.couponCode, p.paymentMethod, p.invoiceNumber,
      p.transactionId, p.deviceInfo?.type, p.deviceInfo?.os,
      p.deviceInfo?.browser, p.deviceInfo?.network, p.createdAt,
    ])].map((values) => values.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course-participants-loaded.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="flex h-[100dvh] min-h-[500px] flex-col overflow-hidden bg-slate-50 text-slate-900">
      <header className="shrink-0 bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-800 px-4 py-4 text-white sm:px-7">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-200"><FiUsers /> Research Ustad · Course 01</div>
            <h1 className="mt-1 truncate text-xl font-extrabold sm:text-2xl">Course Participant Management</h1>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-indigo-100 md:flex">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                liveConnected
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />

            {liveConnected
              ? 'Live updates connected'
              : 'Reconnecting · Auto sync'}
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold hover:bg-white/20"><FiArrowLeft /> <span className="hidden sm:inline">Admin</span></Link>
            <Link href="/admin/course-coupons" className="rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold hover:bg-white/20">Coupons</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col gap-3 px-3 py-3 sm:px-6 sm:py-5">
        <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-3">
          <Metric label="All Enrollments" value={overview.total.toLocaleString()} caption="Total course registrations" icon={<FiUsers />} tone="indigo" />
          <Metric label="Awaiting Payment" value={overview.awaitingPayment.toLocaleString()} caption="Pending / initiating" icon={<FiClock />} tone="amber" />
          <Metric label="Payments Verified" value={overview.paid.toLocaleString()} caption="Paid or confirmed" icon={<FiCreditCard />} tone="sky" />
          <Metric label="Confirmed" value={overview.confirmed.toLocaleString()} caption="Enrollment complete" icon={<FiCheckCircle />} tone="emerald" />
          <div className="col-span-2 lg:col-span-1"><Metric label="Course Revenue" value={money(overview.revenue)} caption="Verified course fees" icon={<FiCreditCard />} tone="emerald" /></div>
        </div>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">Participant Records</h2>
              <p className="text-xs text-slate-500">Showing {rows.length} of {total.toLocaleString()} matches · Scroll inside the table to load 20 more</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, ID..." maxLength={80}
                  className="w-40 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 sm:w-56" />
              </label>
              <label className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
                <FiFilter className="text-slate-400" />
                <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="bg-transparent font-bold outline-none">
                  <option value="all">All statuses</option><option value="draft">Draft</option><option value="initiating">Initiating</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="confirmed">Confirmed</option>
                </select>
              </label>
              <button type="button" onClick={() => setRefreshKey((n) => n + 1)} title="Refresh" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100"><FiRefreshCw /></button>
              <button type="button" onClick={downloadLoadedCsv} disabled={rows.length === 0} title="Export currently loaded rows (not all matches)" className="flex items-center gap-2 rounded-xl bg-indigo-700 px-3 py-2.5 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-50"><FiDownload /> Loaded CSV</button>
            </div>
          </div>

          {error && <div role="alert" className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</div>}

          <div ref={scrollBox} onScroll={onTableScroll} className="min-h-0 flex-1 overflow-auto overscroll-contain" tabIndex={0} aria-label="Scrollable course participants table">
            <table className="w-full min-w-[1420px] border-separate border-spacing-0 text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500 shadow-sm">
                <tr>
                  {['Registration ID', 'Participant', 'Contact', 'University / Academic', 'Payment', 'Coupon', 'Device', 'Registered', 'Details'].map((name) => (
                    <th key={name} scope="col" className="border-b border-slate-200 px-4 py-4">{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((p, index) => (
                  <tr key={p.id} className={`${index % 2 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-indigo-50/70`}>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-bold text-indigo-800">{p.registrationId}</td>
                    <td className="px-4 py-4"><p className="max-w-[175px] truncate font-bold text-slate-900" title={p.fullName}>{p.fullName}</p><span className="text-xs text-slate-400">{p.academicStatus || '—'}</span></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-2 text-xs"><FiMail className="shrink-0 text-indigo-400" /> <span title={p.email} className="max-w-[185px] truncate">{p.email}</span></div><div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><FiPhone className="shrink-0" /> {p.whatsapp}</div></td>
                    <td className="px-4 py-4"><p className="max-w-[160px] truncate text-xs font-semibold" title={p.universityName}>{p.universityName}</p><p className="mt-1 max-w-[160px] truncate text-xs text-slate-400">{p.researchLevel}</p></td>
                    <td className="whitespace-nowrap px-4 py-4"><StatusPill status={p.status} /><p className="mt-2 text-xs font-bold text-slate-700">{money(p.amount)} <span className="font-normal text-slate-400">{p.paymentMethod || ''}</span></p></td>
                    <td className="px-4 py-4"><span className="text-xs font-semibold text-slate-700">{p.couponCode || '—'}</span><p className="text-xs text-emerald-600">{p.discountAmount ? `−${money(p.discountAmount)}` : ''}</p></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><FiMonitor className="shrink-0 text-indigo-400" />{p.deviceInfo?.type || 'Not captured'}</div><p className="mt-1 max-w-[160px] truncate text-xs text-slate-400" title={p.deviceInfo?.browser}>{[p.deviceInfo?.browser, p.deviceInfo?.os].filter(Boolean).join(' · ') || 'Earlier registration'}</p></td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-4"><button type="button" onClick={() => setSelected(p)} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100">View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className="flex h-48 items-center justify-center gap-3 text-sm text-slate-500"><FiRefreshCw className="animate-spin text-indigo-600" /> Loading participants...</div>}
            {!loading && !error && rows.length === 0 && <div className="flex h-48 items-center justify-center text-sm text-slate-500">No participants found for this filter.</div>}
            {loadingMore && <div className="flex items-center justify-center gap-2 py-5 text-xs text-indigo-600"><FiRefreshCw className="animate-spin" /> Loading next 20...</div>}
            {!loading && rows.length > 0 && rows.length >= total && <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">All matching participants loaded</div>}
          </div>
          <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
            <span>Only administrators can view these records</span>
            <span className="font-semibold">{rows.length} / {total} loaded</span>
          </div>
        </section>
      </div>

      {selected && <ParticipantDetails participant={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
