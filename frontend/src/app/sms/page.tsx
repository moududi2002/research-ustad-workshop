'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiRefreshCw, FiSend, FiUsers } from 'react-icons/fi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminGuard from '@/components/AdminGuard';
import adminApi from '@/lib/adminApi';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Participant = {
  id: string;
  fullName: string | null;
  whatsapp: string | null;
  universityName: string | null;
  registrationId: string | null;
  consent: boolean;
};

type SmsHistoryRecord = {
  id: string;
  phone: string;
  recipientName: string | null;
  message: string;
  status: 'queued' | 'failed';
  providerMessageId: string | null;
  error: string | null;
  smsCount: number;
  recipientMode: string;
  createdAt: string;
  deliveryStatus?: string | null;
  dlrCheckedAt?: string | null;
};

type SendResultItem = {
  phone: string;
  name?: string;
  status: 'queued' | 'failed';
  messageId?: string;
  smsCount?: number;
  error?: string;
};

type SendResult = {
  total: number;
  queued: number;
  failed: number;
  note: string;
  results: SendResultItem[];
};

type RecipientMode = 'all' | 'selected' | 'manual';

/* ------------------------------------------------------------------ */
/* Page wrapper                                                        */
/* ------------------------------------------------------------------ */

export default function SmsManagementPage() {
  return (
    <AdminGuard>
      <SmsManagementContent />
    </AdminGuard>
  );
}

/* ------------------------------------------------------------------ */
/* Main content                                                        */
/* ------------------------------------------------------------------ */

function SmsManagementContent() {
  /* ----------------------------- state ---------------------------- */
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<RecipientMode>('selected');
  const [search, setSearch] = useState('');
  const [manualNumbers, setManualNumbers] = useState('');
  const [message, setMessage] = useState(
    'Dear {{name}}, your Research Ustad workshop update: ',
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [history, setHistory] = useState<SmsHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* --------------------------- data loaders ----------------------- */
  const loadParticipants = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get('/admin/sms/participants');
      setParticipants(response.data);
    } catch {
      toast.error('Could not load participants.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await adminApi.get('/admin/sms/history');
      setHistory(response.data.records || []);
    } catch {
      toast.error('Could not load SMS history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadParticipants();
    void loadHistory();
  }, []);

  /* ---------------------------- derived --------------------------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return participants.filter(
      (p) =>
        !q ||
        p.fullName?.toLowerCase().includes(q) ||
        p.whatsapp?.toLowerCase().includes(q) ||
        p.universityName?.toLowerCase().includes(q) ||
        p.registrationId?.toLowerCase().includes(q),
    );
  }, [participants, search]);

  const eligibleCount = useMemo(
    () => participants.filter((p) => p.consent && p.whatsapp).length,
    [participants],
  );

  /* ---------------------------- helpers --------------------------- */
  const toggle = (id: string) =>
    setSelected((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );

  const selectVisibleEligible = () =>
    setSelected(
      filtered.filter((p) => p.consent && p.whatsapp).map((p) => p.id),
    );

  const clearSelection = () => setSelected([]);

  const previewMessage = useMemo(
    () =>
      message
        .replace(/\{\{\s*name\s*\}\}/gi, 'Participant Name')
        .replace(/\{\{\s*university\s*\}\}/gi, 'University Name')
        .replace(/\{\{\s*registrationId\s*\}\}/gi, 'RU-WS01-0001'),
    [message],
  );

  /* ----------------------------- send ----------------------------- */
  const send = async () => {
    if (!message.trim()) return toast.error('Write a message first.');
    if (mode === 'selected' && selected.length === 0)
      return toast.error('Select participants first.');
    if (mode === 'manual' && !manualNumbers.trim())
      return toast.error('Enter phone numbers first.');

    const recipientCount =
      mode === 'all'
        ? eligibleCount
        : mode === 'selected'
          ? selected.length
          : manualNumbers.split(/[\s,;]+/).filter(Boolean).length;

    if (
      !window.confirm(
        `Send this SMS to approximately ${recipientCount} recipient(s)?`,
      )
    )
      return;

    setSending(true);
    setResult(null);
    try {
      const response = await adminApi.post('/admin/sms/send', {
        mode,
        registrationIds: mode === 'selected' ? selected : undefined,
        phoneNumbers: mode === 'manual' ? [manualNumbers] : undefined,
        message: message.trim(),
      });
      setResult(response.data);
      await loadHistory();
      toast.success(
        `Accepted: ${response.data.queued}; failed: ${response.data.failed}`,
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'SMS sending failed.');
    } finally {
      setSending(false);
    }
  };

  /* ---------------------- per-record DLR check -------------------- */
  const checkDlr = async (record: SmsHistoryRecord) => {
    try {
      const response = await adminApi.get(`/admin/sms/${record.id}/dlr`);
      setHistory((previous) =>
        previous.map((item) =>
          item.id === record.id ? { ...item, ...response.data } : item,
        ),
      );
      toast.success(`Delivery status: ${response.data.deliveryStatus}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Could not retrieve delivery status.',
      );
    }
  };

  /* ----------------------------- render --------------------------- */
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink-50 pb-20 pt-28 sm:pt-32">
        <div className="container-custom">
          {/* Back link */}
          <Link
            href="/admin"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-primary-600"
          >
            <FiArrowLeft /> Back to Dashboard
          </Link>

          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="flex items-center gap-3 font-display text-3xl font-bold text-ink-950">
                <FiSend className="text-primary-600" /> SMS Management
              </h1>
              <p className="mt-2 text-sm text-ink-600">
                Send personalized SMS to registered workshop participants using
                ZendSMS.
              </p>
            </div>
            <button
              onClick={() => void loadParticipants()}
              disabled={loading}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <FiRefreshCw />{' '}
              {loading ? 'Loading…' : 'Refresh participants'}
            </button>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Registered participants"
              value={participants.length}
            />
            <StatCard
              label="Consent + phone available"
              value={eligibleCount}
            />
            <StatCard
              label="Selected"
              value={selected.length}
              valueClassName="text-primary-700"
            />
          </div>

          {/* Compose + recipients */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RecipientsSection
              mode={mode}
              setMode={setMode}
              search={search}
              setSearch={setSearch}
              filtered={filtered}
              selected={selected}
              toggle={toggle}
              selectVisibleEligible={selectVisibleEligible}
              clearSelection={clearSelection}
              manualNumbers={manualNumbers}
              setManualNumbers={setManualNumbers}
              eligibleCount={eligibleCount}
            />

            <ComposeSection
              message={message}
              setMessage={setMessage}
              previewMessage={previewMessage}
              sending={sending}
              loading={loading}
              onSend={send}
            />
          </div>

          {/* Send results */}
          {result && <SendResultSection result={result} />}

          {/* History */}
          <HistorySection
            history={history}
            historyLoading={historyLoading}
            onRefresh={loadHistory}
            onCheckDlr={checkDlr}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  valueClassName = 'text-ink-950',
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="text-sm text-ink-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}

/* --------------------------- Recipients --------------------------- */

function RecipientsSection({
  mode,
  setMode,
  search,
  setSearch,
  filtered,
  selected,
  toggle,
  selectVisibleEligible,
  clearSelection,
  manualNumbers,
  setManualNumbers,
  eligibleCount,
}: {
  mode: RecipientMode;
  setMode: (m: RecipientMode) => void;
  search: string;
  setSearch: (v: string) => void;
  filtered: Participant[];
  selected: string[];
  toggle: (id: string) => void;
  selectVisibleEligible: () => void;
  clearSelection: () => void;
  manualNumbers: string;
  setManualNumbers: (v: string) => void;
  eligibleCount: number;
}) {
  const modeOptions: Array<[RecipientMode, string]> = [
    ['all', 'All eligible'],
    ['selected', 'Selected people'],
    ['manual', 'Manual numbers'],
  ];

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-ink-950">
        1. Choose recipients
      </h2>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {modeOptions.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
              mode === value
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-ink-200 text-ink-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'selected' && (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, university, registration ID…"
            className="mb-3 w-full rounded-xl border border-ink-200 px-4 py-3 text-sm outline-none focus:border-primary-500"
          />
          <div className="mb-3 flex gap-2">
            <button
              onClick={selectVisibleEligible}
              className="text-sm font-semibold text-primary-700"
            >
              Select visible eligible
            </button>
            <button
              onClick={clearSelection}
              className="text-sm font-semibold text-ink-500"
            >
              Clear
            </button>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-ink-100 p-2">
            {filtered.map((p) => {
              const disabled = !p.consent || !p.whatsapp;
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-ink-50 ${
                    disabled ? 'opacity-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    disabled={disabled}
                    onChange={() => toggle(p.id)}
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink-900">
                      {p.fullName}
                    </span>
                    <span className="block text-sm text-ink-600">
                      {p.whatsapp || 'No phone'} · {p.universityName}
                    </span>
                    <span className="block text-xs text-ink-400">
                      {p.registrationId}
                      {!p.consent ? ' · consent not recorded' : ''}
                    </span>
                  </span>
                </label>
              );
            })}
            {!filtered.length && (
              <p className="p-4 text-sm text-ink-500">
                No participants found.
              </p>
            )}
          </div>
        </>
      )}

      {mode === 'all' && (
        <div className="rounded-xl bg-primary-50 p-4 text-sm text-primary-900">
          <FiUsers className="mr-2 inline" /> The backend will send to
          participants with a recorded consent flag and a valid Bangladesh
          mobile number ({eligibleCount} currently eligible).
        </div>
      )}

      {mode === 'manual' && (
        <textarea
          value={manualNumbers}
          onChange={(e) => setManualNumbers(e.target.value)}
          rows={8}
          placeholder={'017XXXXXXXX\n88018XXXXXXXX\n+88019XXXXXXXX'}
          className="w-full rounded-xl border border-ink-200 p-4 text-sm outline-none focus:border-primary-500"
        />
      )}
    </section>
  );
}

/* --------------------------- Compose ----------------------------- */

function ComposeSection({
  message,
  setMessage,
  previewMessage,
  sending,
  loading,
  onSend,
}: {
  message: string;
  setMessage: (v: string) => void;
  previewMessage: string;
  sending: boolean;
  loading: boolean;
  onSend: () => void;
}) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-ink-950">
        2. Compose message
      </h2>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={8}
        maxLength={2000}
        placeholder="Type your SMS…"
        className="w-full rounded-xl border border-ink-200 p-4 text-sm outline-none focus:border-primary-500"
      />

      <div className="mt-2 flex justify-between text-xs text-ink-500">
        <span>
          Personalization tokens: {'{{name}}'}, {'{{university}}'},{' '}
          {'{{registrationId}}'}
        </span>
        <span>{message.length}/2000</span>
      </div>

      <div className="mt-4 rounded-xl bg-ink-50 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">
          Preview
        </p>
        <p className="whitespace-pre-wrap break-words text-sm text-ink-800">
          {previewMessage}
        </p>
      </div>

      <button
        onClick={onSend}
        disabled={sending || loading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FiSend /> {sending ? 'Sending SMS…' : 'Review & Send SMS'}
      </button>

      <p className="mt-3 text-xs leading-5 text-ink-500">
        Please verify the recipient list and message before sending. Bangla
        text uses Unicode and may consume multiple SMS segments.
      </p>
    </section>
  );
}

/* --------------------------- Send result ------------------------- */

function SendResultSection({ result }: { result: SendResult }) {
  return (
    <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold text-ink-950">Send results</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-ink-50 p-4">
          <p className="text-sm text-ink-500">Processed</p>
          <p className="text-2xl font-bold">{result.total}</p>
        </div>
        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-sm text-green-700">Accepted / queued</p>
          <p className="text-2xl font-bold text-green-800">{result.queued}</p>
        </div>
        <div className="rounded-xl bg-red-50 p-4">
          <p className="text-sm text-red-700">Failed</p>
          <p className="text-2xl font-bold text-red-800">{result.failed}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-500">{result.note}</p>

      <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-ink-100">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-ink-50">
            <tr>
              <th className="p-3">Recipient</th>
              <th className="p-3">Status</th>
              <th className="p-3">Message ID / Error</th>
            </tr>
          </thead>
          <tbody>
            {result.results.map((r, i) => (
              <tr key={`${r.phone}-${i}`} className="border-t border-ink-100">
                <td className="p-3">
                  {r.name ? `${r.name} · ` : ''}
                  {r.phone}
                </td>
                <td className="p-3">
                  <span
                    className={
                      r.status === 'queued'
                        ? 'font-semibold text-green-700'
                        : 'font-semibold text-red-700'
                    }
                  >
                    {r.status}
                  </span>
                </td>
                <td className="break-all p-3 text-xs text-ink-600">
                  {r.messageId || r.error || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* --------------------------- History ----------------------------- */

function HistorySection({
  history,
  historyLoading,
  onRefresh,
  onCheckDlr,
}: {
  history: SmsHistoryRecord[];
  historyLoading: boolean;
  onRefresh: () => Promise<void> | void;
  onCheckDlr: (record: SmsHistoryRecord) => Promise<void> | void;
}) {
  const queued = history.filter((r) => r.status === 'queued').length;
  const failed = history.filter((r) => r.status === 'failed').length;

  return (
    <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-ink-950">
            SMS History &amp; Per-Number Report
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            প্রতিটি নম্বরের সংরক্ষিত ফলাফল, ব্যর্থতার কারণ ও সময়।
          </p>
        </div>

        <button
          onClick={() => void onRefresh()}
          disabled={historyLoading}
          className="btn-secondary inline-flex items-center justify-center gap-2"
        >
          <FiRefreshCw />
          {historyLoading ? 'Loading…' : 'Refresh report'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-ink-50 p-4">
          <p className="text-sm text-ink-500">Records loaded</p>
          <p className="text-2xl font-bold">{history.length}</p>
        </div>
        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-sm text-green-700">Accepted by provider</p>
          <p className="text-2xl font-bold text-green-800">{queued}</p>
        </div>
        <div className="rounded-xl bg-red-50 p-4">
          <p className="text-sm text-red-700">Failed</p>
          <p className="text-2xl font-bold text-red-800">{failed}</p>
        </div>
      </div>

      <div className="mt-4 max-h-[600px] overflow-auto rounded-xl border border-ink-100">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="sticky top-0 bg-ink-50">
            <tr>
              <th className="p-3">Date &amp; Time</th>
              <th className="p-3">Recipient</th>
              <th className="p-3">Status</th>
              <th className="p-3">Message ID</th>
              <th className="p-3">SMS Count</th>
              <th className="p-3">Failure Reason</th>
              <th className="p-3">Delivery Status</th>
              <th className="p-3">Check DLR</th>
            </tr>
          </thead>

          <tbody>
            {history.map((record) => (
              <HistoryRow
                key={record.id}
                record={record}
                onCheckDlr={onCheckDlr}
              />
            ))}

            {!historyLoading && history.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-6 text-center text-ink-500"
                >
                  No SMS records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-500">
        সর্বশেষ ৫০০টি রেকর্ড দেখানো হচ্ছে। Accepted মানে ZendSMS অনুরোধ গ্রহণ
        করেছে; এটি ফোনে SMS পৌঁছানোর নিশ্চয়তা নয়।
      </p>
    </section>
  );
}

function HistoryRow({
  record,
  onCheckDlr,
}: {
  record: SmsHistoryRecord;
  onCheckDlr: (record: SmsHistoryRecord) => Promise<void> | void;
}) {
  return (
    <tr className="border-t border-ink-100 align-top">
      <td className="whitespace-nowrap p-3 text-xs text-ink-600">
        {new Date(record.createdAt).toLocaleString()}
      </td>

      <td className="p-3">
        <p className="font-semibold text-ink-900">
          {record.recipientName || 'Manual recipient'}
        </p>
        <p className="text-xs text-ink-500">{record.phone}</p>
        <p className="mt-1 max-w-xs whitespace-pre-wrap break-words text-xs text-ink-500">
          {record.message}
        </p>
      </td>

      <td className="p-3">
        <span
          className={
            record.status === 'queued'
              ? 'font-semibold text-green-700'
              : 'font-semibold text-red-700'
          }
        >
          {record.status === 'queued' ? 'Accepted' : 'Failed'}
        </span>
      </td>

      <td className="break-all p-3 text-xs">
        {record.providerMessageId || '—'}
      </td>

      <td className="p-3">{record.smsCount}</td>

      <td className="max-w-xs break-words p-3 text-xs text-red-700">
        {record.error || '—'}
      </td>

      <td className="p-3">
        <span
          className={
            record.deliveryStatus === 'delivered'
              ? 'font-semibold text-green-700'
              : record.deliveryStatus === 'failed'
                ? 'font-semibold text-red-700'
                : 'font-medium text-amber-700'
          }
        >
          {record.deliveryStatus || 'Not checked'}
        </span>

        {record.dlrCheckedAt && (
          <p className="mt-1 text-xs text-ink-500">
            Checked: {new Date(record.dlrCheckedAt).toLocaleString()}
          </p>
        )}
      </td>

      <td className="p-3">
        <button
          disabled={!record.providerMessageId}
          onClick={() => void onCheckDlr(record)}
          className="btn-secondary whitespace-nowrap"
        >
          Check status
        </button>
      </td>
    </tr>
  );
}