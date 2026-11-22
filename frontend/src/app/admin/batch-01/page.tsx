// frontend/src/app/admin/batch-01/page.tsx

'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

type Settings = {
  courseId: string;
  courseName: string;
  batchName: string;
  timezone: string;
  pricing: {
    currency: string;
    earlyBirdFee: number;
    regularFee: number;
    currentFee: number;
    originalPrice: number;
    pricingType: string;
  };
  dates: {
    earlyBirdEndsAt: string;
    registrationClosesAt: string;
    courseStartAt: string;
  };
  registration: {
    isOpen: boolean;
    closedReason: string | null;
    registrationEnabled: boolean;
    expired: boolean;
  };
};

type Coupon = {
  code: string;
  type: 'final_price' | 'percentage' | 'fixed';
  value: number;
  active: boolean;
  allowedEmail: string | null;
  expiresAt: string | null;
  expired: boolean;
  createdAt: string;
};

type SettingsForm = {
  registrationEnabled: boolean;
  earlyBirdFee: string;
  regularFee: string;
  earlyBirdEndsAt: string;
  registrationClosesAt: string;
  courseStartAt: string;
};

type CouponForm = {
  code: string;
  type: Coupon['type'];
  value: string;
  allowedEmail: string;
  expiresAt: string;
};

const initialCoupon: CouponForm = {
  code: '',
  type: 'percentage',
  value: '',
  allowedEmail: '',
  expiresAt: '',
};

function toLocalInput(value: string) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function formatDate(value?: string | null) {
  if (!value) return 'No expiry';

  return new Date(value).toLocaleString('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  });
}

function getError(error: unknown) {
  const value = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
    message?: string;
  };

  const message = value?.response?.data?.message;

  if (Array.isArray(message)) return message.join(', ');

  return message || value?.message || 'Something went wrong';
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#3A5A78] focus:ring-4 focus:ring-[#3A5A78]/10';

const labelClass =
  'mb-2 block text-sm font-semibold text-slate-700';

export default function Batch01AdminPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState<SettingsForm | null>(null);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponForm, setCouponForm] =
    useState<CouponForm>(initialCoupon);

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [updatingCoupon, setUpdatingCoupon] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [settingsResponse, couponsResponse] = await Promise.all([
      adminApi.get('/course/batch-01/settings'),
      adminApi.get('/course/batch-01/admin/coupons/list'),
    ]);

    const nextSettings = settingsResponse.data as Settings;

    setSettings(nextSettings);

    setForm({
      registrationEnabled:
        nextSettings.registration.registrationEnabled,
      earlyBirdFee: String(nextSettings.pricing.earlyBirdFee),
      regularFee: String(nextSettings.pricing.regularFee),
      earlyBirdEndsAt: toLocalInput(
        nextSettings.dates.earlyBirdEndsAt,
      ),
      registrationClosesAt: toLocalInput(
        nextSettings.dates.registrationClosesAt,
      ),
      courseStartAt: toLocalInput(
        nextSettings.dates.courseStartAt,
      ),
    });

    setCoupons(couponsResponse.data as Coupon[]);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await loadData();
      } catch (error) {
        if (active) toast.error(getError(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [loadData]);

  function updateSettingsForm(
    key: keyof SettingsForm,
    value: string | boolean,
  ) {
    setForm((previous) =>
      previous
        ? { ...previous, [key]: value }
        : previous,
    );
  }

  function updateCouponForm(
    key: keyof CouponForm,
    value: string,
  ) {
    setCouponForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) return;

    const earlyFee = Number(form.earlyBirdFee);
    const regularFee = Number(form.regularFee);

    if (
      !Number.isInteger(earlyFee) ||
      !Number.isInteger(regularFee) ||
      earlyFee < 1 ||
      regularFee < 1
    ) {
      toast.error('Enter valid course fees');
      return;
    }

    if (earlyFee > regularFee) {
      toast.error('Early Bird fee cannot exceed Regular fee');
      return;
    }

    const earlyDeadline = new Date(form.earlyBirdEndsAt);
    const registrationDeadline = new Date(
      form.registrationClosesAt,
    );

    const courseStart = new Date(form.courseStartAt);

    if (
      !form.earlyBirdEndsAt ||
      !form.registrationClosesAt ||
      !form.courseStartAt ||
      Number.isNaN(earlyDeadline.getTime()) ||
      Number.isNaN(registrationDeadline.getTime()) ||
      Number.isNaN(courseStart.getTime())
    ) {
      toast.error('Please provide all course dates');
      return;
    }

    if (earlyDeadline > registrationDeadline) {
      toast.error(
        'Early Bird deadline cannot be after registration closing date',
      );
      return;
    }

    setSavingSettings(true);

    try {
      await adminApi.patch(
        '/course/batch-01/admin/settings',
        {
          registrationEnabled: form.registrationEnabled,
          earlyBirdFee: earlyFee,
          regularFee,
          earlyBirdEndsAt: toIso(form.earlyBirdEndsAt),
          registrationClosesAt: toIso(
            form.registrationClosesAt,
          ),
          courseStartAt: toIso(form.courseStartAt),
        },
      );

      await loadData();

      toast.success('Batch-01 settings updated');
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSavingSettings(false);
    }
  }

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const code = couponForm.code.trim().toUpperCase();
    const value = Number(couponForm.value);

    if (!/^[A-Z0-9_-]{4,32}$/.test(code)) {
      toast.error('Coupon code must contain 4–32 valid characters');
      return;
    }

    if (!Number.isInteger(value) || value < 1) {
      toast.error('Enter a valid coupon value');
      return;
    }

    if (
      couponForm.type === 'percentage' &&
      value > 99
    ) {
      toast.error('Percentage must be between 1 and 99');
      return;
    }

    if (couponForm.type === 'final_price' && value > 999) {
      toast.error('Final price must not exceed 999');
      return;
    }

    if (couponForm.type === 'fixed' && value > 999) {
      toast.error('Fixed discount must not exceed 999');
      return;
    }

    setCreatingCoupon(true);

    try {
      await adminApi.post(
        '/course/batch-01/admin/coupons',
        {
          code,
          type: couponForm.type,
          value,
          ...(couponForm.allowedEmail.trim()
            ? { allowedEmail: couponForm.allowedEmail.trim() }
            : {}),
          ...(couponForm.expiresAt
            ? { expiresAt: toIso(couponForm.expiresAt) }
            : {}),
        },
      );

      setCouponForm(initialCoupon);

      await loadData();

      toast.success('Coupon created successfully');
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setCreatingCoupon(false);
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    setUpdatingCoupon(coupon.code);

    try {
      await adminApi.patch(
        `/course/batch-01/admin/coupons/${encodeURIComponent(coupon.code)}`,
        {
          active: !coupon.active,
        },
      );

      await loadData();

      toast.success(
        coupon.active
          ? 'Coupon deactivated'
          : 'Coupon activated',
      );
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setUpdatingCoupon(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F8FB]">
        <p className="font-semibold text-[#3A5A78]">
          Loading Batch-01 administration...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F8FB]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#3A5A78]">
              Research Ustad Administration
            </p>
            <h1 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
              Batch-01 Management
            </h1>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Admin
          </Link>
            <div>
                <a
                    href="/admin/batch-01/participants"
                    className="inline-flex items-center rounded-lg bg-[#3A5A78] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                    Manage Participants
                </a>
            </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {settings && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Current Course Fee</p>
              <p className="mt-2 text-2xl font-extrabold text-[#3A5A78]">
                ৳{settings.pricing.currentFee.toLocaleString('en-BD')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {settings.pricing.pricingType === 'early_bird'
                  ? 'Early Bird'
                  : 'Regular'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Registration Status</p>
              <p className={`mt-2 text-xl font-extrabold ${
                settings.registration.isOpen
                  ? 'text-emerald-700'
                  : 'text-red-600'
              }`}>
                {settings.registration.isOpen ? 'Open' : 'Closed'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {settings.registration.closedReason || 'Accepting registrations'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Early Bird Deadline</p>
              <p className="mt-2 text-base font-bold text-slate-900">
                {formatDate(settings.dates.earlyBirdEndsAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Registration Closing</p>
              <p className="mt-2 text-base font-bold text-slate-900">
                {formatDate(settings.dates.registrationClosesAt)}
              </p>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#3A5A78]">
              Course Configuration
            </p>
            <h2 className="mt-2 text-xl font-extrabold">
              Course Settings
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Changes here affect Batch-01 only. New payment amounts
              are recalculated by the backend before checkout.
            </p>
          </div>

          {form && (
            <form onSubmit={saveSettings} className="mt-8 space-y-6">
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-[#F5F8FB] p-5">
                <span>
                  <span className="block font-bold text-slate-900">
                    Registration Availability
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    Enable or manually close new registrations.
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={form.registrationEnabled}
                  onChange={(event) =>
                    updateSettingsForm(
                      'registrationEnabled',
                      event.target.checked,
                    )
                  }
                  className="h-6 w-6 accent-[#3A5A78]"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Early Bird Fee (BDT)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.earlyBirdFee}
                    onChange={(event) =>
                      updateSettingsForm('earlyBirdFee', event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Regular Fee (BDT)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.regularFee}
                    onChange={(event) =>
                      updateSettingsForm('regularFee', event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Early Bird Deadline (Dhaka Time)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.earlyBirdEndsAt}
                    onChange={(event) =>
                      updateSettingsForm('earlyBirdEndsAt', event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Registration Closing (Dhaka Time)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.registrationClosesAt}
                    onChange={(event) =>
                      updateSettingsForm(
                        'registrationClosesAt',
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>
                    Course Start Date (Dhaka Time)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.courseStartAt}
                    onChange={(event) =>
                      updateSettingsForm('courseStartAt', event.target.value)
                    }
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    If registration closing date is not separately
                    provided, the backend uses the course start date
                    as the closing date.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset Changes
                </button>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="rounded-xl bg-[#3A5A78] px-7 py-3 text-sm font-bold text-white hover:bg-[#2d465e] disabled:opacity-50"
                >
                  {savingSettings ? 'Saving...' : 'Save Course Settings'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#3A5A78]">
              Discount Management
            </p>
            <h2 className="mt-2 text-xl font-extrabold">
              Create Coupon
            </h2>
          </div>

          <form
            onSubmit={createCoupon}
            className="mt-7 grid gap-5 sm:grid-cols-2"
          >
            <div>
              <label className={labelClass}>Coupon Code</label>
              <input
                required
                minLength={4}
                maxLength={32}
                value={couponForm.code}
                onChange={(event) =>
                  updateCouponForm(
                    'code',
                    event.target.value.toUpperCase(),
                  )
                }
                placeholder="e.g. RUFOUNDATION20"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Discount Type</label>
              <select
                value={couponForm.type}
                onChange={(event) =>
                  updateCouponForm(
                    'type',
                    event.target.value as Coupon['type'],
                  )
                }
                className={inputClass}
              >
                <option value="percentage">Percentage Discount</option>
                <option value="fixed">Fixed Amount Discount</option>
                <option value="final_price">Set Final Course Price</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                {couponForm.type === 'percentage'
                  ? 'Discount Percentage'
                  : couponForm.type === 'fixed'
                    ? 'Discount Amount (BDT)'
                    : 'Final Price (BDT)'}
              </label>
              <input
                required
                type="number"
                min="1"
                max={couponForm.type === 'percentage' ? 99 : 999}
                step="1"
                value={couponForm.value}
                onChange={(event) =>
                  updateCouponForm('value', event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Allowed Email (Optional)
              </label>
              <input
                type="email"
                value={couponForm.allowedEmail}
                onChange={(event) =>
                  updateCouponForm('allowedEmail', event.target.value)
                }
                placeholder="participant@example.com"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>
                Coupon Expiry (Optional)
              </label>
              <input
                type="datetime-local"
                value={couponForm.expiresAt}
                onChange={(event) =>
                  updateCouponForm('expiresAt', event.target.value)
                }
                className={inputClass}
              />
              <p className="mt-2 text-xs text-slate-500">
                Leave blank if the coupon should not have a scheduled expiry.
              </p>
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={creatingCoupon}
                className="rounded-xl bg-[#3A5A78] px-7 py-3 font-bold text-white hover:bg-[#2d465e] disabled:opacity-50"
              >
                {creatingCoupon ? 'Creating...' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold">
              Batch-01 Coupons
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage coupon availability and expiry.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#F5F8FB] text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Allowed Email</th>
                  <th className="px-6 py-4">Expiry</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.code}>
                    <td className="px-6 py-4 font-mono text-sm font-bold">
                      {coupon.code}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {coupon.type === 'percentage'
                        ? 'Percentage'
                        : coupon.type === 'fixed'
                          ? 'Fixed'
                          : 'Final Price'}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold">
                      {coupon.type === 'percentage'
                        ? `${coupon.value}%`
                        : `৳${coupon.value}`}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {coupon.allowedEmail || 'All participants'}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(coupon.expiresAt)}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        coupon.active && !coupon.expired
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {coupon.expired
                          ? 'Expired'
                          : coupon.active
                            ? 'Active'
                            : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={
                          updatingCoupon === coupon.code ||
                          coupon.expired
                        }
                        onClick={() => void toggleCoupon(coupon)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      >
                        {updatingCoupon === coupon.code
                          ? 'Updating...'
                          : coupon.active
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}

                {coupons.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No coupons have been created for Batch-01.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
          <strong>Note:</strong> This admin page currently manages
          course settings and coupons. The current backend does not
          expose a Batch-01 admin participant listing or manual
          enrollment confirmation endpoint. Those require separate
          backend APIs before participant management can be added.
        </div>
      </div>
    </main>
  );
}