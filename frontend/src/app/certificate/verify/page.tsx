'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CertificateVerifyPage() {
  const [id, setId] = useState('');
  const router = useRouter();
  return <><Navbar /><main className="min-h-screen bg-ink-50 px-4 pb-20 pt-32">
    <div className="mx-auto max-w-xl rounded-3xl border border-ink-100 bg-white p-8 shadow-card">
      <div className="text-center"><div className="text-sm font-bold uppercase tracking-widest text-primary-600">Research Ustad</div>
        <h1 className="mt-2 text-3xl font-bold text-ink-950">Certificate Verification</h1>
        <p className="mt-3 text-sm text-ink-500">Enter the Certificate ID to verify authenticity, or scan the QR code printed on the PDF certificate.</p></div>
      <form className="mt-8 space-y-4" onSubmit={event => { event.preventDefault(); if (id.trim()) router.push(`/certificate/verify/${encodeURIComponent(id.trim().toUpperCase())}`); }}>
        <label className="block text-sm font-semibold text-ink-700">Certificate ID
          <input className="input-field mt-2 w-full" required value={id} onChange={e => setId(e.target.value)} placeholder="RU-W01-26-XXXXXXXXXXXXXXXX" />
        </label>
        <button className="btn-primary w-full" type="submit">Verify Certificate</button>
      </form>
      <p className="mt-6 text-center text-xs text-ink-500">Only masked contact information is disclosed publicly.</p>
      <Link href="/" className="mt-4 block text-center text-sm text-primary-700 hover:underline">Back to Workshop</Link>
    </div>
  </main><Footer /></>;
}
