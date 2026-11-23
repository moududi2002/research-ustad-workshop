// frontend/src/app/research-foundation-course-2026/confirmation/page.tsx

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import PayFooter from '@/components/PayFooter';

const BASE = '/research-foundation-course-2026';

type NotificationStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'failed';

type Registration = {
  registrationId: string;
  courseId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  status: 'draft' | 'initiating' | 'pending' | 'paid' | 'confirmed';
  amount: number;
  originalAmount: number;
  pricingType: string;
  transactionId?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  confirmedAt?: string | null;
  notifications?: {
    email: NotificationStatus;
    sms: NotificationStatus;
  };
  whatsappGroupUrl?: string | null;
};

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message;

    throw new Error(message || 'Request failed');
  }

  return data;
}

function money(amount: number) {
  return `৳${Number(amount || 0).toLocaleString('en-BD')}`;
}

function StatusBadge({
  status,
}: {
  status?: NotificationStatus;
}) {
  const styles: Record<string, string> = {
    sent: 'bg-green-100 text-green-800',
    sending: 'bg-amber-100 text-amber-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-slate-100 text-slate-700',
  };

  const value = status || 'pending';

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        styles[value] || styles.pending
      }`}
    >
      {value.toUpperCase()}
    </span>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <strong className="break-all text-sm text-slate-800 sm:text-right">
        {value || 'Not available'}
      </strong>
    </div>
  );
}

export default function Batch01ConfirmationPage() {
  const router = useRouter();

  const [registration, setRegistration] =
    useState<Registration | null>(null);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadStatus = useCallback(async () => {
    const response = await fetch('/api/batch-01/status', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });

    const data = await readResponse(response);

    setRegistration(data);

    return data as Registration;
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch('/api/batch-01/status', {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        const data = await readResponse(response);

        if (!active) return;

        setRegistration(data);

        if (
          data.status !== 'paid' &&
          data.status !== 'confirmed'
        ) {
          router.replace(`${BASE}/checkout`);
        }
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Registration session not found',
          );

          router.replace(`${BASE}/register`);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  async function confirmRegistration() {
    if (!acceptedTerms) {
      toast.error(
        'Please accept the Terms and Conditions before confirming.',
      );
      return;
    }

    if (registration?.status !== 'paid') {
      toast.error('Verified payment is required.');
      return;
    }

    setWorking(true);

    try {
      const response = await fetch('/api/batch-01/confirm', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          termsAccepted: true,
        }),
      });

      const result = await readResponse(response);

      setRegistration(result);

      if (result.status === 'confirmed') {
        toast.success('Registration confirmed successfully!');
      }

      // Refresh notification statuses after dispatch.
      await loadStatus();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to confirm registration',
      );
    } finally {
      setWorking(false);
    }
  }

  async function downloadReceipt() {
    setDownloading(true);

    try {
      const response = await fetch('/api/batch-01/receipt', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || 'Unable to download payment receipt',
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download =
        `Research-Ustad-Receipt-${registration?.registrationId || 'Batch-01'}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);

      toast.success('Payment receipt downloaded');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Receipt download failed',
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F8FB]">
        <p className="font-semibold text-[#3A5A78]">
          Loading your enrollment...
        </p>
      </main>
    );
  }

  if (!registration) return null;

  const confirmed = registration.status === 'confirmed';
  const paid = registration.status === 'paid';

  return (
    <main className="min-h-screen bg-[#F5F8FB] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-custom flex h-20 items-center justify-between">
          <Link href="/" className="font-bold text-[#333456]">
            Research Ustad
          </Link>

          <span className="text-sm font-semibold text-[#3A5A78]">
            Enrollment · Batch-01
          </span>
        </div>
      </header>

      <div className="container-custom py-12">
        <div className="mx-auto max-w-3xl">
          <div
            className={`rounded-3xl p-8 text-center text-white shadow-lg ${
              confirmed
                ? 'bg-gradient-to-r from-emerald-700 to-green-600'
                : 'bg-gradient-to-r from-[#3A5A78] to-[#333456]'
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl">
              {confirmed ? '✓' : '৳'}
            </div>

            <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">
              {confirmed
                ? 'Enrollment Confirmed!'
                : paid
                  ? 'Payment Successful'
                  : 'Enrollment Status'}
            </h1>

            <p className="mt-3 text-sm leading-7 text-white/90">
              {confirmed
                ? 'Your payment has been verified and your registration is officially confirmed.'
                : 'Your payment has been verified. Complete the confirmation step below to finalize your enrollment.'}
            </p>
          </div>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#3A5A78]">
              Research Foundation Course-2026
            </p>

            <h2 className="mt-2 text-xl font-extrabold">
              Batch-01
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Five Weekly Live Zoom Sessions
            </p>

            <div className="mt-6">
              <DetailRow
                label="Participant Name"
                value={registration.fullName}
              />

              <DetailRow
                label="Email Address"
                value={registration.email}
              />

              <DetailRow
                label={
                  confirmed
                    ? 'Registration ID'
                    : 'Temporary Reference ID'
                }
                value={registration.registrationId}
              />

              <DetailRow
                label="Transaction ID"
                value={registration.transactionId}
              />

              <DetailRow
                label="Payment Method"
                value={registration.paymentMethod}
              />

              <DetailRow
                label="Amount Paid"
                value={money(registration.amount)}
              />

              <DetailRow
                label="Payment Date"
                value={
                  registration.paidAt
                    ? new Date(registration.paidAt).toLocaleString(
                        'en-GB',
                        { timeZone: 'Asia/Dhaka' },
                      )
                    : null
                }
              />
            </div>
          </section>

          {paid && !confirmed && (
            <section className="mt-6 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#333456]">
                Final Enrollment Confirmation
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Your payment has been verified successfully.
                Please review the declaration below and confirm
                your registration. Your official registration ID
                will be generated after confirmation.
              </p>

              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-[#F5F8FB] p-4">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) =>
                    setAcceptedTerms(event.target.checked)
                  }
                  className="mt-1 h-5 w-5 accent-[#3A5A78]"
                />

                <span className="text-sm leading-7 text-slate-700">
                  I confirm that the registration details are
                  correct and I accept the Research Ustad course
                  Terms and Conditions.
                </span>
              </label>

              <button
                type="button"
                onClick={() => void confirmRegistration()}
                disabled={working || !acceptedTerms}
                className="mt-6 w-full rounded-xl bg-emerald-700 px-6 py-4 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working
                  ? 'Confirming Enrollment...'
                  : 'Confirm My Registration'}
              </button>
            </section>
          )}

          {confirmed && (
            <>
              {registration.whatsappGroupUrl ? (
                <section className="mt-6 rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-100 p-7 text-center">
                  <h2 className="text-xl font-extrabold text-emerald-950">
                    Join Your Official Course WhatsApp Group
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-emerald-800">
                    Stay connected with course announcements,
                    class updates and the learning community.
                  </p>

                  <a
                    href={registration.whatsappGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex rounded-xl bg-emerald-700 px-7 py-4 font-bold text-white hover:bg-emerald-800"
                  >
                    Join WhatsApp Group →
                  </a>
                </section>
              ) : (
                <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-900">
                  The official Course WhatsApp Group link will
                  be shared by Research Ustad. Please check your
                  registered email for future updates.
                </section>
              )}

              <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                <h2 className="text-xl font-bold text-emerald-950">
                  Enrollment Confirmed
                </h2>

                <p className="mt-3 text-sm leading-7 text-emerald-900">
                  Your BDT {registration.amount.toLocaleString('en-BD')}
                  {' '}course payment was verified and your registration
                  has been completed. Keep your official registration
                  ID for future reference.
                </p>
              </section>

              <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">
                  Notification Status
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="font-bold">Email Notification</p>
                    <p className="mt-3">
                      <StatusBadge
                        status={registration.notifications?.email}
                      />
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="font-bold">SMS Notification</p>
                    <p className="mt-3">
                      <StatusBadge
                        status={registration.notifications?.sms}
                      />
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-6 text-slate-500">
                  If a notification is delayed or fails, the
                  Research Ustad team can resend it. SMS status
                  indicates provider acceptance, not handset delivery.
                </p>

                <button
                  type="button"
                  onClick={() => void downloadReceipt()}
                  disabled={downloading}
                  className="mt-6 w-full rounded-xl border-2 border-[#3A5A78] bg-white px-6 py-4 font-bold text-[#3A5A78] hover:bg-[#F5F8FB] disabled:opacity-50"
                >
                  {downloading
                    ? 'Preparing PDF...'
                    : 'Download Payment Receipt (PDF)'}
                </button>
              </section>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                  href={BASE}
                  className="rounded-xl bg-[#3A5A78] px-6 py-4 text-center font-bold text-white hover:opacity-90"
                >
                  Back to Home
                </Link>

                <a
                  href="https://researchustad.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border-2 border-[#3A5A78] bg-white px-6 py-4 text-center font-bold text-[#3A5A78]"
                >
                  Visit Research Ustad
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
      <PayFooter />
    </main>
  );
}