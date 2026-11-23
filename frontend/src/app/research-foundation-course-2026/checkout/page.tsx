// frontend/src/app/research-foundation-course-2026/checkout/page.tsx

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import PayFooter from '@/components/PayFooter';

const BASE = '/research-foundation-course-2026';

type Registration = {
  registrationId: string;
  courseId: string;
  status: 'draft' | 'initiating' | 'pending' | 'paid' | 'confirmed';
  amount: number;
  originalAmount: number;
  pricingType: string;
  couponCode?: string | null;
  discountAmount?: number;
  invoiceNumber?: string | null;
  paymentUrl?: string | null;
  transactionId?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
};

function money(amount: number) {
  return `৳${Number(amount || 0).toLocaleString('en-BD')}`;
}

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

export default function Batch01CheckoutPage() {
  const router = useRouter();

  const [registration, setRegistration] =
    useState<Registration | null>(null);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedRefund, setAcceptedRefund] = useState(false);

  const loadStatus = useCallback(async () => {
    const response = await fetch('/api/course/batch-01/status', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await readResponse(response);
    setRegistration(data);

    return data as Registration;
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch('/api/course/batch-01/status', {
          cache: 'no-store',
          credentials: 'same-origin',
        });

        const data = await readResponse(response);

        if (active) {
          setRegistration(data);

          // Paid users must continue to the confirmation step.
          if (
            data.status === 'paid' ||
            data.status === 'confirmed'
          ) {
            router.replace(`${BASE}/confirmation`);
          }
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

  async function applyCoupon() {
    if (!couponCode.trim()) {
      toast.error('Enter a coupon code');
      return;
    }

    setWorking(true);

    try {
      const response = await fetch('/api/course/batch-01/coupon-apply', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
        }),
      });

      const result = await readResponse(response);

      await loadStatus();

      setCouponCode(result.couponCode || couponCode.toUpperCase());
      toast.success('Coupon applied successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Coupon could not be applied',
      );
    } finally {
      setWorking(false);
    }
  }

  async function removeCoupon() {
    setWorking(true);

    try {
      const response = await fetch('/api/course/batch-01/coupon-remove', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      await readResponse(response);

      setCouponCode('');
      await loadStatus();

      toast.success('Coupon removed');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to remove coupon',
      );
    } finally {
      setWorking(false);
    }
  }

  async function startPayment() {
    if (!acceptedTerms || !acceptedRefund) {
      toast.error('Accept both policies before proceeding');
      return;
    }

    setWorking(true);

    try {
      const response = await fetch('/api/course/batch-01/initiate', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termsAccepted: true,
          refundPolicyAccepted: true,
        }),
      });

      const result = await readResponse(response);

      if (
        typeof result.paymentUrl !== 'string' ||
        !result.paymentUrl.startsWith('https://')
      ) {
        throw new Error('Invalid payment checkout URL');
      }

      // Redirect only to the HTTPS checkout URL returned by the backend.
      window.location.assign(result.paymentUrl);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to initiate payment',
      );

      setWorking(false);
    }
  }

  async function continueExistingPayment() {
    if (!registration?.paymentUrl) {
      await checkPayment();
      return;
    }

    window.location.assign(registration.paymentUrl);
  }

  async function checkPayment() {
    setWorking(true);

    try {
      const response = await fetch('/api/course/batch-01/verify', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await readResponse(response);

      await loadStatus();

      if (result.status === 'paid' || result.status === 'confirmed') {
        router.replace(`${BASE}/payment-verifying`);
      } else {
        toast('Payment is not verified yet. Please check again.');
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to verify payment',
      );
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F8FB]">
        <p className="font-semibold text-[#3A5A78]">
          Loading your registration...
        </p>
      </main>
    );
  }

  if (!registration) return null;

  const isPaid =
    registration.status === 'paid' ||
    registration.status === 'confirmed';

  const isPending =
    registration.status === 'pending' ||
    registration.status === 'initiating';

  return (
    <main className="min-h-screen bg-[#F5F8FB] text-slate-900">
      <header className="border-b bg-white">
        <div className="container-custom flex h-20 items-center justify-between">
          <Link href="/" className="font-bold">
            Research Ustad
          </Link>

          <span className="text-sm font-semibold text-[#3A5A78]">
            Secure Checkout · Batch-01
          </span>
        </div>
      </header>

      <div className="container-custom py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#3A5A78]">
            Registration · Step 2 of 2
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">
            Review & Payment
          </h1>

          <p className="mt-3 leading-7 text-slate-600">
            Review your registration and complete the payment
            through PayStation.
          </p>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#3A5A78]">
                  Selected Course
                </p>

                <h2 className="mt-3 text-xl font-extrabold">
                  Research Foundation Course-2026
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Batch-01 · Five Weekly Live Sessions
                </p>
              </div>

              <span className="rounded-full bg-[#F5F8FB] px-4 py-2 text-xs font-bold text-[#3A5A78]">
                {registration.status.toUpperCase()}
              </span>
            </div>

            <div className="mt-7 border-t border-slate-100 pt-6">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">
                  Temporary Reference ID
                </span>
                <strong className="text-right">
                  {registration.registrationId}
                </strong>
              </div>

              <div className="mt-4 flex justify-between gap-4 text-sm">
                <span className="text-slate-500">
                  Pricing Type
                </span>
                <strong>
                  {registration.pricingType === 'early_bird'
                    ? 'Early Bird'
                    : 'Regular'}
                </strong>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl bg-[#F5F8FB] p-5">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-600">
                    Course Fee
                  </span>
                  <strong>{money(registration.originalAmount)}</strong>
                </div>

                np{registration.pricingType === 'early_bird' &&
                registration.originalAmount -
                  registration.amount -
                  (registration.discountAmount || 0) >
                  0 ? (
                  <div className="flex justify-between gap-4 text-sm text-emerald-700">
                    <span>Early Bird Discount</span>
                    <strong>
                      -
                      {money(
                        registration.originalAmount -
                          registration.amount -
                          (registration.discountAmount || 0),
                      )}
                    </strong>
                  </div>
                ) : null}

                {registration.discountAmount ? (
                  <div className="flex justify-between gap-4 text-sm text-emerald-700">
                    <span>
                      Coupon Discount
                      {registration.couponCode
                        ? ` (${registration.couponCode})`
                        : ''}
                    </span>
                    <strong>
                      -{money(registration.discountAmount)}
                    </strong>
                  </div>
                ) : null}

                <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
                  <span className="font-bold">Payable Amount</span>
                  <strong className="text-2xl text-[#3A5A78]">
                    {money(registration.amount)}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          {registration.status === 'draft' && (
            <>
              <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-bold">
                  Have a Coupon Code?
                </h2>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={working || !!registration.couponCode}
                    placeholder="Enter coupon code"
                    maxLength={32}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-[#3A5A78]"
                  />

                  {registration.couponCode ? (
                    <button
                      type="button"
                      disabled={working}
                      onClick={() => void removeCoupon()}
                      className="rounded-xl border border-red-200 px-6 py-3 font-bold text-red-600 disabled:opacity-50"
                    >
                      Remove Coupon
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={working}
                      onClick={() => void applyCoupon()}
                      className="rounded-xl bg-[#3A5A78] px-6 py-3 font-bold text-white disabled:opacity-50"
                    >
                      Apply Coupon
                    </button>
                  )}
                </div>
              </section>

              <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold">
                  Terms & Conditions
                </h2>

                <div className="mt-5 max-h-64 space-y-4 overflow-y-auto rounded-xl bg-[#F5F8FB] p-5 text-sm leading-7 text-slate-700">
                  <p>
                    <strong>1. Course Participation:</strong>{' '}
                    The course will be conducted through five weekly
                    live online sessions. Participants are responsible
                    for their own internet connection and participation.
                  </p>

                  <p>
                    <strong>2. Academic Integrity:</strong>{' '}
                    Participants must maintain academic integrity and
                    avoid plagiarism, fabrication, falsification,
                    and other forms of academic misconduct.
                  </p>

                  <p>
                    <strong>3. Course Materials:</strong>{' '}
                    Learning materials are provided for personal
                    educational use. Redistribution without permission
                    is not allowed.
                  </p>

                  <p>
                    <strong>4. Certificate:</strong>{' '}
                    Certificates are subject to the course participation
                    and assessment requirements set by Research Ustad.
                  </p>

                  <p>
                    <strong>5. Awards:</strong>{' '}
                    The Outstanding Research Learner Award is subject
                    to the course assessment criteria. Participation
                    does not guarantee an award.
                  </p>

                  <p>
                    <strong>6. Communication:</strong>{' '}
                    Official course updates may be shared through
                    registered email, WhatsApp, or other official
                    Research Ustad communication channels.
                  </p>

                  <p>
                    <strong>7. Publication:</strong>{' '}
                    The course provides educational guidance and does
                    not guarantee journal or conference acceptance.
                  </p>
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 accent-[#3A5A78]"
                  />
                  <span className="text-sm leading-7 text-slate-700">
                    I have read and accept the Terms & Conditions.
                  </span>
                </label>

                <h3 className="mt-8 text-lg font-bold">
                  Refund Policy
                </h3>

                <div className="mt-4 rounded-xl bg-[#F5F8FB] p-5 text-sm leading-7 text-slate-700">
                  Refund requests, where applicable, will be handled
                  according to the official Research Ustad refund
                  policy published for this course. Any applicable
                  deductions, payment gateway charges, or course
                  participation-related deductions will follow that
                  published policy. Please review the official policy
                  before making payment
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedRefund}
                    onChange={(e) => setAcceptedRefund(e.target.checked)}
                    className="mt-1 h-5 w-5 accent-[#3A5A78]"
                  />
                  <span className="text-sm leading-7 text-slate-700">
                    I have read and accept the Refund Policy.
                  </span>
                </label>

                <button
                  type="button"
                  disabled={
                    working ||
                    !acceptedTerms ||
                    !acceptedRefund
                  }
                  onClick={() => void startPayment()}
                  className="mt-8 w-full rounded-xl bg-[#3A5A78] px-6 py-4 text-lg font-bold text-white transition hover:bg-[#2d465e] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {working
                    ? 'Preparing Secure Checkout...'
                    : `Proceed to PayStation — ${money(registration.amount)}`}
                </button>

                <p className="mt-4 text-center text-xs leading-6 text-slate-500">
                  Your payment will be processed securely by PayStation.
                  Enrollment is not confirmed until payment is verified.
                </p>
              </section>
            </>
          )}

          {isPending && (
            <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-amber-950">
                Payment Pending
              </h2>

              <p className="mt-3 text-sm leading-7 text-amber-900">
                Your payment session has already been created.
                Continue to the existing payment page or check
                the transaction status. Do not create another payment.
              </p>

              {registration.invoiceNumber && (
                <p className="mt-4 break-all text-sm font-semibold text-amber-950">
                  Invoice: {registration.invoiceNumber}
                </p>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {registration.paymentUrl && (
                  <button
                    type="button"
                    onClick={() => void continueExistingPayment()}
                    className="rounded-xl bg-[#3A5A78] px-5 py-4 font-bold text-white"
                  >
                    Continue Existing Payment
                  </button>
                )}

                <button
                  type="button"
                  disabled={working}
                  onClick={() => void checkPayment()}
                  className="rounded-xl border border-amber-300 bg-white px-5 py-4 font-bold text-amber-950 disabled:opacity-50"
                >
                  {working ? 'Checking...' : 'Check Payment Status'}
                </button>
              </div>
            </section>
          )}

          {isPaid && (
            <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-emerald-950">
                Payment Verified
              </h2>

              <p className="mt-3 text-sm leading-7 text-emerald-900">
                Your payment has been verified by PayStation.
                Please keep your registration ID for future reference.
              </p>

              <div className="mt-5 space-y-3 text-sm text-emerald-950">
                <p>
                  Registration ID: <strong>{registration.registrationId}</strong>
                </p>
                <p>
                  Amount Paid: <strong>{money(registration.amount)}</strong>
                </p>
                <p>
                  Transaction ID: <strong>{registration.transactionId || 'Not available'}</strong>
                </p>
                <p>
                  Payment Method: <strong>{registration.paymentMethod || 'Not available'}</strong>
                </p>
              </div>

              <p className="mt-5 text-xs leading-6 text-emerald-800">
                Payment verification is complete. Final enrollment
                confirmation and course access information will be
                communicated by Research Ustad.
              </p>
            </section>
          )}

          <div className="mt-8 text-center">
            <Link
              href={BASE}
              className="text-sm font-semibold text-[#3A5A78] hover:underline"
            >
              Back to Course Details
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <PayFooter />
    </main>
  );
}