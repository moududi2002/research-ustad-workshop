// frontend/src/app/research-article-writing-academic-publishing-guidelines/checkout/page.tsx

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import PayFooter from '@/components/PayFooter';

import { IoCopySharp } from "react-icons/io5";


import { usePathname, useRouter } from 'next/navigation';

import GatewayChargesModal from '@/components/GatewayChargesModal';

import {
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineArrowPath,
  HiOutlineEnvelope,
  HiOutlineChatBubbleLeftRight,
  HiOutlineIdentification,
} from 'react-icons/hi2';

const SLUG =
  '/research-article-writing-academic-publishing-guidelines';

type Status =
  | 'draft'
  | 'initiating'
  | 'pending'
  | 'paid'
  | 'confirmed';

interface Registration {
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
  status: Status;
  amount: number;
  originalAmount: number;
  invoiceNumber: string | null;
  paymentUrl: string | null;
  transactionId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  whatsappGroupUrl: string | null;
  notifications: {
    email: string;
    sms: string;
  };
  baseAmount: number;
  couponCode: string | null;
  discountAmount: number;

}

async function courseApi(
  action: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>,
) {
  const response = await fetch(`/api/course/${action}`, {
    method,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(method === 'POST'
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(result.message)
      ? result.message.join(', ')
      : result.message;

    throw new Error(
      message || 'Unable to process your request',
    );
  }

  return result as Registration;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="break-all text-sm font-semibold text-slate-800 sm:text-right">
        {value || '—'}
      </span>
    </div>
  );
}

function CopyableDetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  async function copyValue() {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied successfully');
    } catch {
      toast.error('Unable to copy. Please copy manually.');
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-emerald-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <span className="text-sm text-emerald-800">
        {label}
      </span>

      <div className="flex items-center gap-3 sm:justify-end">
        <span className="break-all font-mono text-sm font-bold text-emerald-950">
          {value || '—'}
        </span>

        {value && (
          <button
            type="button"
            onClick={() => void copyValue()}
            title={`Copy ${label}`}
            aria-label={`Copy ${label}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-100"
          >
            <IoCopySharp className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function EnrollmentSteps({ status }: { status: Status }) {
  const step =
    status === 'confirmed'
      ? 3
      : status === 'paid'
      ? 2
      : status === 'pending' || status === 'initiating'
      ? 1
      : 0;

  const labels = ['Details', 'Payment', 'Confirmation'];

  return (
    <div className="grid grid-cols-3 gap-2">
      {labels.map((label, index) => (
        <div key={label} className="text-center">
          <div
            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
              index <= step
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {index + 1}
          </div>

          <p className="mt-2 text-xs font-semibold text-slate-600">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function CourseCheckoutPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [registration, setRegistration] =
    useState<Registration | null>(null);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // Pre-payment policy acceptance
const [acceptedPrePaymentTerms, setAcceptedPrePaymentTerms] =
  useState(false);

const [acceptedRefundPolicy, setAcceptedRefundPolicy] =
  useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [couponWorking, setCouponWorking] = useState(false);

  const refresh = useCallback(async (showToast = false) => {
    try {
      const result = await courseApi('status');
      setRegistration(result);
      setError('');

      if (showToast) {
        toast.success('Payment status updated');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load registration',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams(window.location.search);
    const returnedFromPayment =
      params.get('payment_return') === '1';

    if (!returnedFromPayment) {
      void refresh();

      return () => {
        cancelled = true;
      };
    }

    async function verifyAfterReturn() {
      try {
        const result = await courseApi(
          'verify',
          'POST',
          {},
        );

        if (!cancelled) {
          setRegistration(result);
          setError('');
        }
      } catch (error) {
        console.error('[Course Payment] Return verification failed', error);

        if (!cancelled) {
          toast.error(
            'Payment verification is delayed. Please do not pay again.',
          );

          await refresh();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void verifyAfterReturn();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    if (!registration) return;

    const paid =
      registration.status === 'paid' ||
      registration.status === 'confirmed';

    if (paid && pathname === `${SLUG}/checkout`) {
      router.replace(`${SLUG}/confirmation`);
    }

    if (!paid && pathname === `${SLUG}/confirmation`) {
      router.replace(`${SLUG}/checkout`);
    }
  }, [registration, pathname, router]);

  useEffect(() => {
    if (
      registration?.status !== 'pending' &&
      registration?.status !== 'initiating'
    ) {
      return;
    }

    const timer = setInterval(() => {
      void refresh();
    }, 10000);

    return () => clearInterval(timer);
  }, [registration?.status, refresh]);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();

    if (!code) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponWorking(true);

    try {
      const updated = await courseApi(
        'coupon-apply',
        'POST',
        { code },
      );

      setRegistration(updated);
      setCouponInput('');

      toast.success(
        `Coupon applied! Payable amount: BDT ${updated.amount}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to apply coupon',
      );
    } finally {
      setCouponWorking(false);
    }
  }

  async function removeCoupon() {
    setCouponWorking(true);

    try {
      const updated = await courseApi(
        'coupon-remove',
        'POST',
        {},
      );

      setRegistration(updated);
      setCouponInput('');

      toast.success('Coupon removed');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to remove coupon',
      );
    } finally {
      setCouponWorking(false);
    }
  }


  async function proceedToPayment() {
    const needsAcceptance = registration?.status === 'draft';

    if (
      needsAcceptance &&
      (!acceptedPrePaymentTerms || !acceptedRefundPolicy)
    ) {
      toast.error(
        'Please accept both policies before proceeding to payment.',
      );
      return;
    }

    setWorking(true);

    try {
      const data = await courseApi(
        'initiate',
        'POST',
        needsAcceptance
          ? {
              termsAccepted: true,
              refundPolicyAccepted: true,
            }
          : {},
      );

      if (!data.paymentUrl) {
        throw new Error('Payment link unavailable');
      }

      const paymentUrl = new URL(data.paymentUrl);

      if (paymentUrl.protocol !== 'https:') {
        throw new Error('Invalid payment URL');
      }

      window.location.assign(data.paymentUrl);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Unable to initiate payment',
      );

      setWorking(false);
      void refresh();
    }
  }


  async function confirmRegistration() {
    if (!acceptedTerms || registration?.status !== 'paid') {
      return;
    }

    setWorking(true);

    try {
      const result = await courseApi(
        'confirm',
        'POST',
        { termsAccepted: true },
      );

      setRegistration(result);

      if (result.status === 'confirmed') {
        toast.success('Registration confirmed successfully!');
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Unable to confirm registration',
      );
    } finally {
      setWorking(false);
    }
  }

  
  async function checkPaymentNow() {
    setWorking(true);

    try {
      const result = await courseApi(
        'verify',
        'POST',
        {},
      );

      setRegistration(result);

      if (
        result.status === 'paid' ||
        result.status === 'confirmed'
      ) {
        toast.success('Payment verified successfully!');
        router.replace(`${SLUG}/confirmation`);
      } else {
        toast(
          'Payment has not been verified yet. Please do not pay again.',
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Payment verification failed',
      );
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <HiOutlineArrowPath className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const status = registration?.status;

  const isPaid = status === 'paid';
  const confirmed = status === 'confirmed';
  const pending =
    status === 'pending' || status === 'initiating';

  return (
    <main className="min-h-screen bg-[#f5f7fc] pb-20 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-custom flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                <Image
                  src="/images/RU_logo.png"
                  alt="logo"
                  width={100}
                  height={100}
                  />
              </div>

              <span className="font-display text-lg font-bold">
                Research Ustad
              </span>
          </Link>

          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Secure Enrollment
          </span>
        </div>
      </header>

      <div className="container-custom pt-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <EnrollmentSteps status={status || 'draft'} />
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700"
            >

                {error.toLowerCase().includes('session') && (
                <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-4">
                    <p className="font-semibold text-slate-900">
                    Already registered?
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your registration information is safe.
                    Verify your registered email to restore
                    your secure session and continue from
                    your previous payment status.
                    </p>

                    <Link
                    href={`${SLUG}/register`}
                    className="mt-4 inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                    Restore Registration Session
                    </Link>
                </div>
                )}
            </div>
          )}

          {registration && (
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
              {/* Status banner */}
              <div
                className={`px-6 py-10 text-center sm:px-10 ${
                  confirmed
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                    : isPaid
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600'
                    : pending
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-indigo-700 to-indigo-900'
                } text-white`}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                  {confirmed || isPaid ? (
                    <HiOutlineCheckCircle className="h-9 w-9" />
                  ) : pending ? (
                    <HiOutlineClock className="h-9 w-9" />
                  ) : (
                    <HiOutlineIdentification className="h-9 w-9" />
                  )}
                </div>

                <h1 className="mt-5 font-display text-2xl font-extrabold sm:text-3xl">
                  {confirmed
                    ? 'Registration Confirmed!'
                    : isPaid
                    ? 'Payment Successful'
                    : pending
                    ? 'Payment Pending'
                    : 'Registration Preview'}
                </h1>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/90">
                  {confirmed
                    ? 'Your enrollment is confirmed. Welcome to the Research Ustad Guidelines.'
                    : isPaid
                    ? 'Your payment has been independently verified. Accept the terms below to finalize enrollment.'
                    : pending
                    ? 'We are waiting for payment completion or gateway verification. Please do not make a duplicate payment.'
                    : 'Your information has been saved. Review the details below before proceeding to payment.'}
                </p>
              </div>

              <div className="space-y-8 p-6 sm:p-10">
                {/* Course title */}
                <section>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Course 01
                  </p>

                  <h2 className="mt-2 text-xl font-bold leading-8">
                    Research Article Writing & Academic Publishing Guidelines
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    24 Classes · 8 Modules · Live & Practical Learning
                  </p>
                </section>

                {/* Registration preview */}
                {status === 'draft' && pathname === `${SLUG}/checkout` && (
                  <section  className="rounded-2xl border border-slate-100 bg-slate-50 p-5 sm:p-7">
                  <h3 className="mb-4 font-bold">
                    Registration Information
                  </h3>

                  <DetailRow
                    label="Registration ID"
                    value={registration.registrationId}
                  />

                  <DetailRow
                    label="Full Name"
                    value={registration.fullName}
                  />

                  <DetailRow
                    label="Email"
                    value={registration.email}
                  />

                  <DetailRow
                    label="WhatsApp"
                    value={registration.whatsapp}
                  />

                  <DetailRow
                    label="Academic Status"
                    value={registration.academicStatus}
                  />

                  <DetailRow
                    label="University"
                    value={registration.universityName}
                  />

                  <DetailRow
                    label="Department"
                    value={registration.department}
                  />

                  <DetailRow
                    label="Research Knowledge"
                    value={registration.researchLevel}
                  />

                  <DetailRow
                    label="Higher Study Interest"
                    value={registration.higherStudyInterest}
                  />

                  {registration.higherStudyInterest === 'Yes' && (
                    <DetailRow
                      label="Preferred Country"
                      value={registration.preferredCountry}
                    />
                  )}

                  <DetailRow
                    label="Registration Source"
                    value={registration.registrationSource}
                  />
                  </section>
                )}

              {/* Pricing */}
              {status !== 'paid' && status !== 'confirmed' && (
                <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
                  <p className="text-sm font-bold text-indigo-900">
                    Enrollment Fee
                  </p>

                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <span className="text-xl text-slate-400 line-through">
                      ৳5,000
                    </span>

                    <span className="text-4xl font-extrabold text-indigo-950">
                       ৳{registration.amount.toLocaleString('en-BD')}
                    </span>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      40% OFF
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-6 text-indigo-700">
                     Regular course fee: BDT 3,000.
                    {registration.couponCode
                      ? ` Coupon ${registration.couponCode} applied. Your discounted course fee is BDT ${registration.amount}.`
                      : ''}

                    {' '}Applicable PayStation gateway charges may be
                    added at checkout and will be shown before payment.

                    {status === 'draft' && <GatewayChargesModal />}
                  </p>


                {/* Course coupon */}
                {registration.status === 'draft' && (
                  <div className="mt-6 border-t border-indigo-200 pt-6">
                    <label
                      htmlFor="courseCoupon"
                      className="mb-2 block text-sm font-bold text-indigo-950"
                    >
                      Have a Coupon Code?
                    </label>

                    {registration.couponCode ? (
                      <div className="rounded-xl border border-emerald-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-emerald-700">
                              Coupon Applied: {registration.couponCode}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              You saved ৳
                              {registration.discountAmount.toLocaleString('en-BD')}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => void removeCoupon()}
                            disabled={couponWorking}
                            className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {couponWorking ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          id="courseCoupon"
                          type="text"
                          maxLength={32}
                          value={couponInput}
                          onChange={(event) =>
                            setCouponInput(event.target.value.toUpperCase())
                          }
                          placeholder="Enter coupon code"
                          className="min-w-0 flex-1 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-medium uppercase text-indigo-950 outline-none focus:border-indigo-500"
                        />

                        <button
                          type="button"
                          disabled={couponWorking || !couponInput.trim()}
                          onClick={() => void applyCoupon()}
                          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {couponWorking ? 'Applying...' : 'Apply Coupon'}
                        </button>
                      </div>
                    )}

                    <div className="mt-5 space-y-2 rounded-xl bg-white p-4 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Regular Course Fee</span>
                        <span>৳3,000</span>
                      </div>

                      {registration.couponCode && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Coupon Discount</span>
                          <span>
                            −৳{registration.discountAmount.toLocaleString('en-BD')}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between border-t pt-3 font-extrabold text-indigo-950">
                        <span>Payable Amount</span>
                        <span>
                          ৳{registration.amount.toLocaleString('en-BD')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                </section>
              )}

                {/* Before payment */}
                {status === 'draft' && (
                  <section>

                    {/* Mandatory Pre-Payment Policy Acceptance */}
                    <div className="mb-6 space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 sm:p-6">

                      <div>
                        <h3 className="text-base font-bold text-indigo-950">
                          Review & Accept Our Policies
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Before proceeding to payment, please review and accept
                          the following policies of Research Ustad.
                        </p>
                      </div>

                      {/* Terms & Conditions */}
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300">

                        <input
                          type="checkbox"
                          checked={acceptedPrePaymentTerms}
                          onChange={(event) =>
                            setAcceptedPrePaymentTerms(event.target.checked)
                          }
                          className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-indigo-600"
                        />

                        <span className="text-sm leading-7 text-slate-700">
                          I have read, understood and agree to the{" "}

                          <a
                            href="https://researchustad.org/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="font-bold text-indigo-700 underline underline-offset-4 hover:text-indigo-900"
                          >
                            Terms & Conditions
                          </a>

                          {" "}of Research Ustad.

                          <span className="ml-1 font-semibold text-red-600">
                            *
                          </span>
                        </span>
                      </label>

                      {/* Return & Refund Policy */}
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300">

                        <input
                          type="checkbox"
                          checked={acceptedRefundPolicy}
                          onChange={(event) =>
                            setAcceptedRefundPolicy(event.target.checked)
                          }
                          className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-indigo-600"
                        />

                        <span className="text-sm leading-7 text-slate-700">
                          I have read, understood and agree to the{" "}

                          <a
                            href="https://researchustad.org/return-and-refund-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="font-bold text-indigo-700 underline underline-offset-4 hover:text-indigo-900"
                          >
                            Return & Refund Policy
                          </a>

                          {" "}, including the applicable deductions for classes
                          already attended and non-refundable payment transaction charges.

                          <span className="ml-1 font-semibold text-red-600">
                            *
                          </span>
                        </span>
                      </label>

                      <p className="text-xs leading-6 text-slate-500">
                        Both acknowledgements are required before you can proceed
                        to the secure payment gateway.
                      </p>
                    </div>

                    <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      <HiOutlineExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      Your registration is not confirmed yet.
                      Complete payment to continue.
                    </div>

                      <button
                        type="button"
                        onClick={proceedToPayment}
                        disabled={
                          working ||
                          !acceptedPrePaymentTerms ||
                          !acceptedRefundPolicy
                        }
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-5 py-3 text-lg font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                      >
                        <HiOutlineCreditCard className="h-6 w-6" />

                        {working
                          ? 'Preparing Secure Checkout...'
                          : `Proceed to Payment — ৳${registration.amount.toLocaleString('en-BD')}`}

                        <HiOutlineArrowRight className="h-5 w-5" />
                      </button>

                      <p className="mt-3 text-center text-xs text-slate-500">
                        You will be redirected to PayStation's secure payment page
                        after accepting both policies.
                      </p>

                  </section>
                )}

                {/* Payment pending */}
                {pending && (
                  <section className="space-y-4">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                      <h3 className="font-bold text-amber-900">
                        Awaiting Payment Verification
                      </h3>

                      <p className="mt-2 text-sm leading-7 text-amber-800">
                        Payment is not verified yet. This page
                        automatically checks the gateway while the
                        transaction is pending.
                      </p>

                      <DetailRow
                        label="Invoice Number"
                        value={registration.invoiceNumber}
                      />
                    </div>

                    {registration.paymentUrl && (
                      <button
                        onClick={proceedToPayment}
                        disabled={working}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        <HiOutlineCreditCard className="h-5 w-5" />
                        Continue Existing Payment
                      </button>
                    )}

                    <button
                      onClick={() => void checkPaymentNow()}
                      disabled={working}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <HiOutlineArrowPath className="h-5 w-5" />
                      Check Payment Status
                    </button>
                  </section>
                )}

                {/* Payment verified but not confirmed */}
                {isPaid && (
                  <section className="space-y-6">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                      <div className="flex items-center gap-3">
                        <HiOutlineCheckCircle className="h-7 w-7 text-emerald-600" />

                        <h3 className="text-lg font-bold text-emerald-900">
                          Payment Verified
                        </h3>
                      </div>

                      <div className="mt-5">
                        <DetailRow
                          label="Amount Paid"
                          value={`BDT ${registration.amount.toLocaleString('en-BD')}`}
                        />
                        <DetailRow
                          label="Transaction ID"
                          value={registration.transactionId}
                        />
                        <DetailRow
                          label="Payment Method"
                          value={registration.paymentMethod}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-bold">
                        Terms & Conditions
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Please read the enrollment conditions
                        before confirming your registration.
                      </p>

                      <div className="mt-5 max-h-72 space-y-4 overflow-y-auto rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                        <p>
                          <strong>1. Course Participation:</strong>{' '}
                          The training is conducted online through
                          live sessions and guided practical work.
                          Participants are responsible for their
                          own internet connectivity.
                        </p>

                        <p>
                          <strong>2. Academic Integrity:</strong>{' '}
                          Participants must follow responsible
                          research practices and avoid plagiarism,
                          fabrication and other misconduct.
                        </p>

                        <p>
                          <strong>3. Course Materials:</strong>{' '}
                          Course resources are provided for
                          authorized learning purposes and must
                          not be redistributed without permission.
                        </p>

                        <p>
                          <strong>4. Publication Outcomes:</strong>{' '}
                          Training provides knowledge and guidance
                          but does not guarantee acceptance or
                          publication in any journal or conference.
                        </p>

                        <p>
                          <strong>5. Communication:</strong>{' '}
                          Important course updates may be
                          communicated through registered email,
                          SMS and the official course group.
                        </p>

                        <p>
                          <strong>6. Schedule and Policies:</strong>{' '}
                          Final class schedules and applicable
                          rescheduling or refund policies must
                          follow the official written information
                          published by Research Ustad.
                        </p>
                      </div>

                      <label className="mt-6 flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) =>
                            setAcceptedTerms(e.target.checked)
                          }
                          className="mt-1 h-5 w-5 shrink-0 accent-indigo-600"
                        />

                        <span className="text-sm font-medium leading-7 text-slate-700">
                          I have read and accept the Terms and
                          Conditions of Research Ustad Course 01.
                        </span>
                      </label>

                      <button
                        onClick={confirmRegistration}
                        disabled={!acceptedTerms || working}
                        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-600 px-5 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <HiOutlineShieldCheck className="h-6 w-6" />
                        {working
                          ? 'Confirming Enrollment...'
                          : 'Confirm My Registration'}
                      </button>
                    </div>
                  </section>
                )}

                {/* Confirmed registration */}
                {confirmed && (
                  <section className="space-y-6">

                    {registration.whatsappGroupUrl ? (
                      <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-100 p-7 text-center">
                        <HiOutlineChatBubbleLeftRight className="mx-auto h-11 w-11 text-emerald-600" />

                        <h3 className="mt-4 text-xl font-extrabold text-emerald-950">
                          Join Your Official Course WhatsApp Group
                        </h3>

                        <p className="mt-3 text-sm leading-7 text-emerald-800">
                          Stay connected with course announcements,
                          class updates and the learning community.
                        </p>

                        <a
                          href={registration.whatsappGroupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-6 inline-flex items-center gap-3 rounded-xl bg-emerald-600 px-7 py-4 font-bold text-white transition hover:bg-emerald-700"
                        >
                          Join WhatsApp Group
                          <HiOutlineArrowRight className="h-5 w-5" />
                        </a>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-indigo-50 p-5 text-sm text-indigo-900">
                        The official Course WhatsApp Group link
                        will be shared by Research Ustad.
                      </div>
                    )}
                    
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
                      <div className="flex items-center gap-3">
                        <HiOutlineCheckCircle className="h-8 w-8 text-emerald-600" />
                        <h3 className="text-xl font-bold">
                          Enrollment Confirmed
                        </h3>
                      </div>

                      <p className="mt-3 text-sm leading-7">
                        Your BDT {registration.amount.toLocaleString('en-BD')}
                        {' '}course payment was verified and your registration
                        has been completed. Keep your registration ID
                        for reference.
                      </p>

                     <div className="mt-5">
                        <CopyableDetailRow
                          label="Registration ID"
                          value={registration.registrationId}
                        />

                        <CopyableDetailRow
                          label="Payment Transaction ID"
                          value={registration.transactionId}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <HiOutlineEnvelope className="h-6 w-6 text-indigo-600" />

                        <p className="mt-3 font-bold">
                          Email Notification
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          Status: {registration.notifications.email}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <HiOutlineChatBubbleLeftRight className="h-6 w-6 text-indigo-600" />

                        <p className="mt-3 font-bold">
                          SMS Notification
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          Status: {registration.notifications.sms}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Confirmation Actions */}
                <div className="grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
                  <Link
                    href={SLUG}
                    className="flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-4 text-center font-bold text-white transition hover:bg-indigo-700"
                  >
                    Back to Home
                  </Link>

                  <a
                    href="https://researchustad.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-xl border-2 border-indigo-200 bg-white px-6 py-4 text-center font-bold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    Visit Research Ustad
                  </a>
                </div>

                <div className="border-t border-slate-100 pt-6 text-center">
                  <Link
                    href={SLUG}
                    className="text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    View Full Course Curriculum
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <PayFooter />
    </main>
  );
}