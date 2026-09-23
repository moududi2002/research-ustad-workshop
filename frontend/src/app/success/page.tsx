// /frontend/src/app/success/page.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  FiCheckCircle,
  FiCalendar,
  FiMail,
  FiUser,
  FiHash,
  FiMessageCircle,
  FiExternalLink,
} from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi2';

import { getRegistration } from '@/lib/api';
import type { RegistrationResponse } from '@/types';

function SuccessContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('id') || '';
  const [mounted, setMounted] = useState(false);
  const [registration, setRegistration] =
    useState<RegistrationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  setMounted(true);

  if (!registrationId) {
    setLoading(false);
    return;
  }

  getRegistration(registrationId)
    .then((data) => {
      setRegistration(data);
    })
    .catch((error) => {
      console.error('Failed to load registration:', error);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [registrationId]);

  const workshopDate = '26 September 2026';

  const calendarUrl =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' +
    encodeURIComponent('Research Ustad Grand Opening Workshop') +
    '&dates=20260926T100000Z/20260926T120000Z' +
    '&details=' +
    encodeURIComponent(
      'Research to Higher Study: Building a Strong Academic Profile for Global Opportunities'
    );

  return (
    <main className="bg-ink-50 pb-20 pt-28 sm:pt-32">
      <div className="container-custom">
        <div className="mx-auto max-w-2xl">
          {/* Success Card */}
          <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
            <div className="bg-gradient-to-br from-green-500 to-green-600 px-8 py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <FiCheckCircle className="h-9 w-9 text-white" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-bold text-white sm:text-3xl">
                Registration Successful
              </h1>
              <p className="mt-2 text-sm text-green-50">
                Thank you for registering for the Research Ustad Grand Opening
                Workshop.
              </p>
            </div>

            <div className="px-8 py-8">
              <p className="text-center text-sm leading-relaxed text-ink-600">
                Your registration has been successfully recorded. Workshop details
                and future updates will be shared through your registered email
                address and WhatsApp number.
              </p>

              {/* Registration Details */}
              <div className="mt-8 space-y-3">
                <DetailRow
                  icon={<FiHash className="h-4 w-4" />}
                  label="Registration ID"
                  value={
                    loading
                      ? '...'
                      : registration?.registrationId || registrationId || 'N/A'
                  }
                />
                <DetailRow
                  icon={<FiUser className="h-4 w-4" />}
                  label="Participant Name"
                  value={loading ? 'Loading...' : registration?.fullName || 'N/A'}
                />
                <DetailRow
                  icon={<FiMail className="h-4 w-4" />}
                  label="Registered Email"
                  value={loading ? 'Loading...' : registration?.email || 'N/A'}
                />
                <DetailRow
                  icon={<FiCalendar className="h-4 w-4" />}
                  label="Workshop Date"
                  value={workshopDate}
                />
              </div>

              {/* Quick Actions */}
              <div className="mt-8 border-t border-ink-100 pt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Quick Actions
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <a
                    href="https://chat.whatsapp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 rounded-2xl border border-ink-100 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-green-300 hover:shadow-soft"
                  >
                    <FiMessageCircle className="h-5 w-5 text-green-600" />
                    <span className="text-xs font-semibold text-ink-800">
                      Join WhatsApp Community
                    </span>
                  </a>

                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 rounded-2xl border border-ink-100 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-soft"
                  >
                    <FiCalendar className="h-5 w-5 text-primary-600" />
                    <span className="text-xs font-semibold text-ink-800">
                      Add Event to Calendar
                    </span>
                  </a>

                  <Link
                    href="/"
                    className="flex flex-col items-center gap-2 rounded-2xl border border-ink-100 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-soft"
                  >
                    <FiExternalLink className="h-5 w-5 text-accent-600" />
                    <span className="text-xs font-semibold text-ink-800">
                      Visit Research Ustad
                    </span>
                  </Link>
                </div>
              </div>

              {/* Back home */}
              <div className="mt-8 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
                >
                  <HiOutlineAcademicCap className="h-4 w-4" />
                  Back to Workshop Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="text-ink-400">{icon}</span>
        <span className="text-sm text-ink-500">{label}</span>
      </div>
      <span className="text-sm font-semibold text-ink-900">{value}</span>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}