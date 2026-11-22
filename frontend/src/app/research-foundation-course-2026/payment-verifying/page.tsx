// frontend/src/app/research-foundation-course-2026/payment-verifying/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE = '/research-foundation-course-2026';

export default function Batch01PaymentVerifyingPage() {
  const router = useRouter();

  const [message, setMessage] = useState(
    'Connecting to the payment verification service...',
  );

  useEffect(() => {
    let cancelled = false;
    let requestInProgress = false;
    let attempts = 0;

    const maxAttempts = 10;

    async function verify() {
      if (cancelled || requestInProgress) return;

      requestInProgress = true;
      attempts += 1;

      try {
        const response = await fetch('/api/batch-01/verify', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const data = await response.json().catch(() => ({}));

        if (cancelled) return;

        if (
          response.ok &&
          (data.status === 'paid' || data.status === 'confirmed')
        ) {
          setMessage('Payment successfully verified.');

          router.replace(`${BASE}/checkout`);
          return;
        }

        if (response.status === 401) {
          setMessage('Your registration session could not be found.');
          router.replace(`${BASE}/register`);
          return;
        }

        setMessage(
          'Your payment has not been verified yet. Checking again...',
        );

        if (attempts >= maxAttempts) {
          router.replace(`${BASE}/checkout`);
        }
      } catch {
        if (!cancelled) {
          setMessage(
            'Unable to reach the verification service. Please try again.',
          );

          if (attempts >= maxAttempts) {
            router.replace(`${BASE}/checkout`);
          }
        }
      } finally {
        requestInProgress = false;
      }
    }

    void verify();

    const interval = window.setInterval(() => {
      if (!cancelled && attempts < maxAttempts) {
        void verify();
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#263D55] via-[#333456] to-slate-950 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-white p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F8FB]">
          <svg
            className="h-9 w-9 animate-spin text-[#3A5A78]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.2"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#3A5A78]">
          Research Ustad · Batch-01
        </p>

        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Verifying Your Payment
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          {message}
        </p>

        <div className="mt-8 rounded-xl bg-[#F5F8FB] p-5 text-left text-xs leading-6 text-slate-600">
          Please do not close this page or initiate another payment.
          We are checking your transaction directly with PayStation.
        </div>

        <button
          type="button"
          onClick={() => router.replace(`${BASE}/checkout`)}
          className="mt-7 text-sm font-semibold text-[#3A5A78] hover:underline"
        >
          Return to Checkout
        </button>
      </div>
    </main>
  );
}