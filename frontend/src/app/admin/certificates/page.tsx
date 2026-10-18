'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminGuard from '@/components/AdminGuard';
import {
  getAttendees, getCertificateRecords, issueSelected, issueAll, issueCustom,
  retryCertificate, revokeCertificate, openCertificatePdf,
  type Attendee, type CertificateRecord, type AttendeeResponse,
} from '@/lib/certificateApi';

function CertificateDashboard() {
  const [attendance, setAttendance] = useState<AttendeeResponse | null>(null);
  const [records, setRecords] = useState<CertificateRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState({ fullName: '', email: '', whatsapp: '', universityName: '', department: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, r] = await Promise.all([getAttendees(), getCertificateRecords()]);
      setAttendance(a); setRecords(r);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not load certificate dashboard. Check MongoDB/MySQL connection.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const attendees = attendance?.attendees ?? [];
  const filtered = useMemo(() => attendees.filter(p =>
    [p.registrationId, p.fullName, p.email, p.department, p.universityName]
      .some(s => (s || '').toLowerCase().includes(search.toLowerCase().trim())),
  ), [attendees, search]);
  const visibleAllSelected = filtered.length > 0 && filtered.every(p => selected.has(p.registrationId));

  const toggle = (id: string) => {
    setSelected(old => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleVisible = () => {
    setSelected(old => {
      const next = new Set(old);
      if (visibleAllSelected) filtered.forEach(p => next.delete(p.registrationId));
      else filtered.forEach(p => next.add(p.registrationId));
      return next;
    });
  };
  const perform = async (action: () => Promise<any>, label: string) => {
    setBusy(true);
    try {
      const data = await action();
      toast.success(label + (typeof data?.created === 'number' ? `: ${data.created} new, ${data.alreadyIssued} already issued` : ''));
      setSelected(new Set());
      await load();
      return true;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Action failed');
      return false;
    } finally { setBusy(false); }
  };

  return <>
    <Navbar />
    <main className="min-h-screen bg-ink-50 px-4 pb-20 pt-28">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <Link href="/admin" className="text-sm text-primary-700 hover:underline">← Back to Admin Dashboard</Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="font-display text-3xl font-bold">Certificate Management</h1>
              <p className="mt-1 text-sm text-ink-600">MongoDB attendance → MySQL registrations → PDF certificate → email</p></div>
            <button className="btn-secondary" onClick={load} disabled={busy || loading}>Refresh data</button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Attended in MongoDB" value={attendance?.mongoAttended ?? '—'} />
          <Metric label="Matched in MySQL" value={attendance?.matched ?? '—'} />
          <Metric label="Selected" value={selected.size} />
        </div>

        {Boolean(attendance?.missingRegistrationIds.length) &&
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {attendance!.missingRegistrationIds.length} attended MongoDB IDs are not present in MySQL registrations; no certificate will be issued to those IDs.
            <details className="mt-2"><summary className="cursor-pointer">Show missing IDs</summary><p className="mt-2 break-all">{attendance!.missingRegistrationIds.join(', ')}</p></details>
          </div>}

        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Verified Workshop Attendees</h2>
            <input aria-label="Search attendees" className="input-field max-w-xs" placeholder="Search attendee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="my-4 flex flex-wrap gap-3">
            <button disabled={busy || selected.size === 0} className="btn-primary disabled:opacity-50" onClick={() => {
              if (!window.confirm(`Issue certificates to ${selected.size} selected attendees?`)) return;
              const ids = [...selected];
              // The backend validates up to 500 IDs per request.
              void perform(async () => {
                let created = 0; let alreadyIssued = 0;
                for (let i = 0; i < ids.length; i += 500) {
                  const result = await issueSelected(ids.slice(i, i + 500));
                  created += result.created; alreadyIssued += result.alreadyIssued;
                }
                return { created, alreadyIssued };
              }, 'Certificates queued');
            }}>Issue Selected ({selected.size})</button>
            <button disabled={busy || attendees.length === 0} className="btn-secondary disabled:opacity-50" onClick={() => {
              if (window.confirm(`Issue certificates for ALL ${attendees.length} matched workshop attendees?`))
                void perform(issueAll, 'All attendee certificates queued');
            }}>Issue All Attendees</button>
            <Link href="/certificate/verify" target="_blank" className="btn-secondary">Public Verification ↗</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600"><tr>
                <th className="p-3"><input type="checkbox" aria-label="Select all visible" checked={visibleAllSelected} onChange={toggleVisible} /></th>
                <th className="p-3">Registration ID</th><th className="p-3">Name</th><th className="p-3">Email</th>
                <th className="p-3">Department</th><th className="p-3">Institute / University</th>
              </tr></thead>
              <tbody>{filtered.map((p: Attendee) => <tr key={p.registrationId} className="border-t border-ink-100">
                <td className="p-3"><input type="checkbox" aria-label={`Select ${p.registrationId}`} checked={selected.has(p.registrationId)} onChange={() => toggle(p.registrationId)} /></td>
                <td className="p-3 font-mono">{p.registrationId}</td><td className="p-3">{p.fullName}</td>
                <td className="p-3">{p.email}</td><td className="p-3">{p.department || '—'}</td><td className="p-3">{p.universityName || '—'}</td>
              </tr>)}</tbody>
            </table>
            {!loading && filtered.length === 0 && <p className="p-5 text-center text-sm text-ink-500">No matching attendees</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold">Custom Certificate (Manual Recipient)</h2>
          <p className="mb-4 text-sm text-ink-500">Use for an approved recipient without a matching registration. Admin must verify eligibility manually.</p>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={e => {
            e.preventDefault();
            if (!window.confirm(`Issue a custom certificate for ${custom.fullName} (${custom.email})?`)) return;
            void perform(() => issueCustom(custom), 'Custom certificate queued').then(success => {
              if (success) setCustom({ fullName: '', email: '', whatsapp: '', universityName: '', department: '' });
            });
          }}>
            <Field label="Full Name *" required value={custom.fullName} onChange={v => setCustom({ ...custom, fullName: v })} />
            <Field label="Email *" required type="email" value={custom.email} onChange={v => setCustom({ ...custom, email: v })} />
            <Field label="Institute / University" value={custom.universityName} onChange={v => setCustom({ ...custom, universityName: v })} />
            <Field label="Department" value={custom.department} onChange={v => setCustom({ ...custom, department: v })} />
            <Field label="Phone / WhatsApp" value={custom.whatsapp} onChange={v => setCustom({ ...custom, whatsapp: v })} />
            <div className="flex items-end"><button disabled={busy} type="submit" className="btn-primary w-full disabled:opacity-50">Issue Custom PDF + Email</button></div>
          </form>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-xl font-bold">Certificate Issuance & Email History</h2>
          <p className="mb-3 text-xs text-ink-500">Queued certificates are processed automatically. Use Refresh to see updated email results.</p>
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
            <thead className="bg-ink-50"><tr><th className="p-3">Certificate ID</th><th className="p-3">Recipient</th>
              <th className="p-3">Email</th><th className="p-3">Delivery</th><th className="p-3">Certificate</th><th className="p-3">Actions</th></tr></thead>
            <tbody>{records.map(r => <tr key={r.id} className="border-t border-ink-100">
              <td className="p-3 font-mono text-xs">{r.certificateId}</td><td className="p-3">{r.fullName}</td><td className="p-3">{r.email}</td>
              <td className="p-3"><span className="font-semibold">{r.emailStatus}</span>{r.emailError && <div className="mt-1 max-w-[200px] truncate text-xs text-red-600" title={r.emailError}>{r.emailError}</div>}</td>
              <td className="p-3">{r.certificateStatus}</td>
              <td className="p-3"><div className="flex flex-wrap gap-2">
                <button className="text-primary-700 underline disabled:opacity-50" disabled={busy} onClick={() => void openCertificatePdf(r.id, `${r.certificateId}.pdf`).catch(() => toast.error('PDF unavailable'))}>PDF</button>
                <Link className="text-primary-700 underline" target="_blank" href={`/certificate/verify/${r.certificateId}`}>Verify</Link>
                {r.emailStatus === 'failed' && r.certificateStatus === 'issued' && <button disabled={busy} className="text-amber-700 underline" onClick={() => void perform(() => retryCertificate(r.id), 'Retry queued')}>Retry</button>}
                {r.certificateStatus === 'issued' && <button disabled={busy} className="text-red-700 underline" onClick={() => {
                  if (window.confirm(`Revoke certificate ${r.certificateId}?`)) void perform(() => revokeCertificate(r.id), 'Revoked');
                }}>Revoke</button>}
              </div></td>
            </tr>)}</tbody>
          </table></div>
        </section>
      </div>
    </main><Footer />
  </>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"><div className="text-sm text-ink-500">{label}</div><div className="mt-2 text-3xl font-bold text-ink-900">{value}</div></div>;
}
function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block text-sm font-medium text-ink-700">{label}
    <input className="input-field mt-1 w-full" type={type} required={required} value={value} onChange={e => onChange(e.target.value)} />
  </label>;
}

export default function CertificatesPage() {
  return <AdminGuard><CertificateDashboard /></AdminGuard>;
}
