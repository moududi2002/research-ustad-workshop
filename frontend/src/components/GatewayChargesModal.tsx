
'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineCreditCard,
  HiOutlineInformationCircle,
  HiOutlineShieldCheck,
  HiOutlineXMark,
} from 'react-icons/hi2';

const mfsCharges = [
  ['Arafah Islamic Wallet Education', '1.83%'],
  ['bKash Education', '2.03%'],
  ['Bkash Tokenized Education', '2.03%'],
  ['CellFin Education', '1.83%'],
  ['City Touch Education', '1.83%'],
  ['GPay Education', '1.83%'],
  ['ibanking Education', '1.83%'],
  ['MCash Education', '1.84%'],
  ['Nagad Education', '1.83%'],
  ['Ok Wallet Education', '1.83%'],
  ['Pathaopay Education', '1.82%'],
  ['Pmoney Education', '1.82%'],
  ['PrimeNet Education', '1.82%'],
  ['Pubali PI Education', '1.82%'],
  ['Rocket Education', '1.83%'],
  ['ST Pay Education', '1.83%'],
  ['Tap Education', '1.83%'],
  ['TrustNet Education', '1.83%'],
  ['UCB One Education', '1.82%'],
  ['Upay Education', '1.83%'],
] as const;

const cardCharges = [
  ['AMEX CARD', '3.25%'],
  ['MASTERCARD', '2.28%'],
  ['VISA CARD', '2.28%'],
] as const;

function ChargeTable({
  items,
  type,
}: {
  items: readonly (readonly [string, string])[];
  type: 'mfs' | 'card';
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead
          className={
            type === 'mfs'
              ? 'bg-indigo-50 text-indigo-950'
              : 'bg-emerald-50 text-emerald-950'
          }
        >
          <tr>
            <th className="w-12 px-3 py-4 font-bold sm:px-4">
              SL
            </th>
            <th className="px-3 py-4 font-bold sm:px-4">
              Payment Method
            </th>
            <th className="px-3 py-4 text-right font-bold sm:px-4">
              Approx. Charge
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {items.map(([name, charge], index) => (
            <tr
              key={name}
              className={
                index % 2 === 0
                  ? 'bg-white'
                  : 'bg-slate-50/80'
              }
            >
              <td className="px-3 py-3 text-slate-400 sm:px-4">
                {index + 1}
              </td>

              <td className="px-3 py-3 font-medium text-slate-700 sm:px-4">
                {name}
              </td>

              <td className="px-3 py-3 text-right sm:px-4">
                <span
                  className={
                    type === 'mfs'
                      ? 'inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700'
                      : 'inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700'
                  }
                >
                  {charge}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GatewayChargesModal() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const buttons = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );

      if (!buttons?.length) return;

      const first = buttons[0];
      const last = buttons[buttons.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-1 inline-flex items-center gap-1 font-bold text-indigo-700 underline decoration-indigo-300 underline-offset-4 transition hover:text-indigo-950"
      >
        <HiOutlineInformationCircle className="h-4 w-4" />
        Show Charges
      </button>

      {open && typeof document !== 'undefined' &&
        createPortal(
          <div
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setOpen(false);
              }
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="gateway-charges-title"
              className="flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
              style={{ maxHeight: '90dvh' }}
            >
              <div className="shrink-0 bg-gradient-to-r from-indigo-950 via-indigo-800 to-violet-700 px-5 py-6 text-white sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white/15 p-3">
                      <HiOutlineCreditCard className="h-7 w-7" />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">
                        Research Ustad
                      </p>

                      <h2
                        id="gateway-charges-title"
                        className="mt-2 text-xl font-extrabold sm:text-2xl"
                      >
                        Payment Gateway Charges
                      </h2>

                      <p className="mt-2 text-xs leading-6 text-indigo-100 sm:text-sm">
                        Approximate charges when paid by the customer
                      </p>
                    </div>
                  </div>

                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close charges popup"
                    className="shrink-0 rounded-xl bg-white/15 p-2.5 text-white transition hover:bg-white/25"
                  >
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-6 sm:px-8">
                <section>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-indigo-950">
                        Bank / MFS Charges
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Mobile financial services and banking wallets
                      </p>
                    </div>

                    <span className="rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700">
                      20 Methods
                    </span>
                  </div>

                  <ChargeTable items={mfsCharges} type="mfs" />
                </section>

                <section>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-emerald-900">
                        Card Charges
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        International and local card payments
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      3 Methods
                    </span>
                  </div>

                  <ChargeTable items={cardCharges} type="card" />
                </section>

                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <HiOutlineInformationCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <p className="text-xs leading-6 text-amber-900">
                    These are approximate customer-borne gateway
                    charges. Final charges may vary due to
                    rounding, payment provider rules or merchant
                    configuration. The final payable amount will
                    be displayed by PayStation before payment.
                  </p>
                </div>
              </div>

              <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <HiOutlineShieldCheck className="h-5 w-5 text-emerald-600" />
                    Secure checkout via PayStation
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-indigo-700 px-7 py-3 text-sm font-bold text-white transition hover:bg-indigo-800"
                  >
                    Got It
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
