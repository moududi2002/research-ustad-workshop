'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getVerification, type VerificationResult } from '@/lib/certificateApi';

export default function CertificateVerificationResult({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const [data, setData] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    getVerification(id).then(result => { if (active) setData(result); }).catch((err: any) => {
      if (active) setError(err?.response?.status === 404 ? 'Certificate not found. Check the ID and try again.' : 'Verification unavailable. Try again later.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return <><Navbar /><main className="min-h-screen bg-ink-50 px-4 pb-20 pt-32">
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
      <header className="border-b border-ink-100 px-8 py-7 text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-primary-600">Research Ustad</div>
        <h1 className="mt-2 text-2xl font-bold">Certificate Verification</h1>
      </header>
      <div className="p-8">
        {loading ? <p className="text-center text-ink-500">Checking certificate...</p> :
         error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-medium text-red-700">{error}</div> :
         data ? <>
          <div className={`mb-7 rounded-2xl p-5 text-center ${data.verified ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="text-2xl font-bold">{data.verified ? '✓ Certificate Verified' : '✕ Certificate Revoked'}</div>
            <p className="mt-2 text-sm">{data.verified ? 'This certificate was issued by Research Ustad.' : 'This certificate is no longer valid.'}</p>
          </div>
          <dl className="divide-y divide-ink-100">
            <Detail label="Certificate ID" value={data.certificateId} />
            <Detail label="Participant Name" value={data.participantName} />
            <Detail label="Workshop Name" value={data.workshopName} />
            <Detail label="Workshop Date" value={new Date(`${data.workshopDate}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })} />
            <Detail label="Email" value={data.maskedEmail} />
            <Detail label="Phone" value={data.maskedPhone} />
            <Detail label="Status" value={data.status.toUpperCase()} />
          </dl>
         </> : null}
        <div className="mt-8 text-center"><Link href="/certificate/verify" className="btn-secondary">Verify Another Certificate</Link></div>
      </div>
    </div>
  </main><Footer /></>;
}
function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-2 py-4 sm:grid-cols-5"><dt className="text-sm font-medium text-ink-500 sm:col-span-2">{label}</dt><dd className="break-words text-sm font-semibold text-ink-900 sm:col-span-3">{value}</dd></div>;
}
