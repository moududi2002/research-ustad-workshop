// frontend/src/app/admin/course-coupons/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminGuard from '@/components/AdminGuard';

type CouponType = 'final_price' | 'percentage' | 'fixed';

interface Coupon {
  _id: string;
  code: string;
  type: CouponType;
  value: number;
  finalPrice: number;
  active: boolean;
  allowedEmail: string | null;
  expiresAt: string | null;
}

export default function CourseCouponsPage() {
  return (
    <AdminGuard>
      <CouponManager />
    </AdminGuard>
  );
}

function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('final_price');
  const [value, setValue] = useState('5');
  const [allowedEmail, setAllowedEmail] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  async function loadCoupons() {
    try {
      const response = await fetch('/api/course/admin/coupons', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Unable to load coupons');
      }

      const data: Coupon[] = await response.json();
      setCoupons(data);
    } catch {
      toast.error('Could not load course coupons');
    }
  }

  useEffect(() => {
    void loadCoupons();
  }, []);

  async function createCoupon(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/course/admin/coupons', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: Number(value),
          allowedEmail: allowedEmail.trim().toLowerCase(),
          ...(expiryDate
            ? {
                expiresAt:
                  `${expiryDate}T23:59:59+06:00`,
              }
            : {}),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || 'Unable to create coupon',
        );
      }

      toast.success('Coupon created successfully');

      setCode('');
      setAllowedEmail('');
      setExpiryDate('');

      await loadCoupons();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Coupon creation failed',
      );
    } finally {
      setLoading(false);
    }
  }

  async function deactivateCoupon(couponCode: string) {
    if (!window.confirm(`Deactivate coupon ${couponCode}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/course/admin/coupons/${encodeURIComponent(couponCode)}`,
        {
          method: 'PATCH',
          credentials: 'same-origin',
        },
      );

      if (!response.ok) {
        throw new Error('Unable to deactivate coupon');
      }

      toast.success('Coupon deactivated');
      await loadCoupons();
    } catch {
      toast.error('Unable to deactivate coupon');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Research Ustad · Course 01
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              Course Coupon Manager
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage private special offers and custom discounts.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-100"
          >
            Back to Admin
          </Link>
        </div>

        <form
          onSubmit={createCoupon}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-6 text-xl font-bold">
            Create New Coupon
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-semibold">
                Coupon Code
              </span>

              <input
                required
                minLength={4}
                maxLength={32}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.toUpperCase())
                }
                placeholder="SPECIAL5"
                className="w-full rounded-xl border px-4 py-3 uppercase outline-none focus:border-indigo-500"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold">
                Discount Type
              </span>

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as CouponType)
                }
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-indigo-500"
              >
                <option value="final_price">
                  Special Final Price (BDT)
                </option>

                <option value="percentage">
                  Percentage Discount (%)
                </option>

                <option value="fixed">
                  Fixed Discount (BDT)
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold">
                {type === 'final_price'
                  ? 'Final Payable Amount'
                  : type === 'percentage'
                  ? 'Discount Percentage'
                  : 'Discount Amount'}
              </span>

              <input
                required
                type="number"
                min={1}
                max={type === 'percentage' ? 99 : 2999}
                step={1}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-indigo-500"
              />

              <p className="text-xs text-slate-500">
                {type === 'final_price'
                  ? 'Example: Enter 5 to charge BDT 5.'
                  : type === 'percentage'
                  ? 'Example: Enter 50 for 50% off.'
                  : 'Example: Enter 500 for BDT 500 off.'}
              </p>
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold">
                Restrict to Email (Optional)
              </span>

              <input
                type="email"
                value={allowedEmail}
                onChange={(event) =>
                  setAllowedEmail(event.target.value)
                }
                placeholder="student@example.com"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-indigo-500"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold">
                Expiry Date (Optional)
              </span>

              <input
                type="date"
                value={expiryDate}
                onChange={(event) =>
                  setExpiryDate(event.target.value)
                }
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-indigo-500"
              />
            </label>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-xs leading-6 text-slate-500">
              A coupon without an email restriction can be used
              by anyone who knows its code while it remains active.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-7 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold">
              Existing Coupons
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Value</th>
                  <th className="px-5 py-4">Final Fee</th>
                  <th className="px-5 py-4">Allowed Email</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td className="px-5 py-4 font-bold text-indigo-700">
                      {coupon.code}
                    </td>

                    <td className="px-5 py-4">
                      {coupon.type.replace('_', ' ')}
                    </td>

                    <td className="px-5 py-4">
                      {coupon.type === 'percentage'
                        ? `${coupon.value}%`
                        : `৳${coupon.value}`}
                    </td>

                    <td className="px-5 py-4 font-bold">
                      ৳{coupon.finalPrice}
                    </td>

                    <td className="px-5 py-4">
                      {coupon.allowedEmail || 'All customers'}
                    </td>

                    <td className="px-5 py-4">
                      {coupon.active ? 'Active' : 'Inactive'}
                    </td>

                    <td className="px-5 py-4">
                      {coupon.active && (
                        <button
                          type="button"
                          onClick={() =>
                            void deactivateCoupon(coupon.code)
                          }
                          className="font-semibold text-rose-600 hover:underline"
                        >
                          Disable
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {coupons.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No coupons created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}