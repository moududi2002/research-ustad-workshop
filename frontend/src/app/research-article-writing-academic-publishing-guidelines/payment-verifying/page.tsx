// frontend/src/app/research-article-writing-academic-publishing-guidelines/payment-verifying/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlineClock,
} from 'react-icons/hi2';

const SLUG =
  '/research-article-writing-academic-publishing-guidelines';

const VERIFY_DURATION = 10_000;

type PaymentStatus = {
  status?: 'draft' | 'initiating' | 'pending' | 'paid' | 'confirmed';
};

export default function PaymentVerifyingPage() {
  const router = useRouter();

  const [secondsLeft, setSecondsLeft] = useState(10);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let finished = false;
    let requestInProgress = false;

    const controller = new AbortController();
    const deadline = Date.now() + VERIFY_DURATION;

    function finish(destination: string) {
      if (cancelled || finished) return;

      finished = true;
      setChecking(false);
      router.replace(destination);
    }

    async function verifyPayment() {
      if (
        cancelled ||
        finished ||
        requestInProgress ||
        Date.now() >= deadline
      ) {
        return;
      }

      requestInProgress = true;

      try {
        const response = await fetch('/api/course/verify', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
          signal: controller.signal,
        });

        const data: PaymentStatus =
          await response.json().catch(() => ({}));

        if (cancelled || finished) return;

        if (
          response.ok &&
          (data.status === 'paid' ||
            data.status === 'confirmed')
        ) {
          finish(`${SLUG}/confirmation`);
          return;
        }

        // Session missing: checkout provides secure recovery.
        if (response.status === 401) {
          finish(`${SLUG}/checkout`);
          return;
        }

        // Other responses remain unverified.
        // Never convert a gateway error into paid status.
      } catch (error) {
        if (!cancelled && !controller.signal.aborted) {
          console.warn(
            '[Course Payment] Verification retry:',
            error instanceof Error
              ? error.message
              : 'Network error',
          );
        }
      } finally {
        requestInProgress = false;
      }
    }

    // Check immediately, then retry while the spinner is shown.
    void verifyPayment();

    const pollTimer = window.setInterval(() => {
      void verifyPayment();
    }, 3000);

    const countdownTimer = window.setInterval(() => {
      if (cancelled || finished) return;

      const remaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000),
      );

      setSecondsLeft(remaining);
    }, 250);

    // Maximum 10 seconds on the waiting screen.
    const finishTimer = window.setTimeout(() => {
      if (!finished) {
        finish(`${SLUG}/checkout`);
      }
    }, VERIFY_DURATION);

    return () => {
      cancelled = true;
      controller.abort();

      window.clearInterval(pollTimer);
      window.clearInterval(countdownTimer);
      window.clearTimeout(finishTimer);
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-white p-8 text-center shadow-2xl sm:p-12">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <HiOutlineShieldCheck className="h-9 w-9" />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
          Research Ustad · Secure Payment
        </p>

        <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Verifying Your Payment
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-slate-600">
          We are securely checking your payment with PayStation.
          Please do not close this page or make another payment.
        </p>

        <div className="relative mx-auto mt-10 flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[9px] border-indigo-100" />

          <div className="absolute inset-0 animate-spin rounded-full border-[9px] border-transparent border-t-indigo-600 border-r-indigo-400" />

          <div className="flex flex-col items-center">
            <span className="text-4xl font-extrabold tabular-nums text-indigo-950">
              {secondsLeft}
            </span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Seconds
            </span>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-700">
          <HiOutlineCreditCard className="h-5 w-5" />

          {checking
            ? 'Checking Transaction Status...'
            : 'Redirecting...'}
        </div>

        <div className="mt-7 rounded-xl border border-amber-100 bg-amber-50 p-4 text-left">
          <div className="flex items-start gap-3">
            <HiOutlineClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <p className="text-xs leading-6 text-amber-900">
              If your payment is verified, you will be redirected
              to the Confirmation Page automatically. Otherwise,
              you will return to Payment Pending, where verification
              can continue safely.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {[0, 1, 2].map((item) => (
            <span
              key={item}
              className="h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-500"
              style={{
                animationDelay: `${item * 180}ms`,
              }}
            />
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Powered by Research Ustad · PayStation Integration
        </p>
      </div>
    </main>
  );
}