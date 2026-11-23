// frontend/src/app/research-foundation-course-2026/page.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Footer from '@/components/Footer';
import PayFooter from '@/components/PayFooter';

type CourseSettings = {
  courseName: string;
  batchName: string;
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
  };
};

const BASE =
  '/research-foundation-course-2026';

const money = (amount: number) =>
  `৳${Number(amount).toLocaleString('en-BD')}`;

const dateText = (value?: string) => {
  if (!value) return 'To be announced';

  return new Date(value).toLocaleDateString('en-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  });
};

export default function ResearchFoundationPage() {
  const [settings, setSettings] =
    useState<CourseSettings | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/course/batch-01/settings', {
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load course information');
        }

        return response.json();
      })
      .then(setSettings)
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  const isOpen = settings?.registration?.isOpen ?? false;

  return (
    <main className="min-h-screen bg-[#F5F8FB] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-custom flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/RU_logo.png"
              alt="Research Ustad"
              width={48}
              height={48}
            />
            <div>
              <p className="font-bold">Research Ustad</p>
              <p className="text-xs tracking-widest text-[#3A5A78]">
                LEARNING ACADEMY
              </p>
            </div>
          </Link>

          <Link
            href={isOpen ? `${BASE}/register` : '/'}
            className="rounded-xl bg-[#3A5A78] px-5 py-3 text-sm font-bold text-white"
          >
            {isOpen ? 'Enroll Now' : 'Back to Home'}
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#263D55] text-white">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#C99589]/20 blur-3xl" />

        <div className="container-custom relative grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-[#F0C9BE]">
              Research Ustad · Batch-01
            </span>

            <h1 className="mt-7 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              Research Foundation Course-2026
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-200">
              Build a strong foundation in academic research,
              research methodology, scholarly communication,
              and higher-study preparation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                '5 Weekly Live Sessions',
                'Online via Zoom',
                'Beginner Friendly',
                'Certificate',
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              {isOpen ? (
                <Link
                  href={`${BASE}/register`}
                  className="rounded-xl bg-[#C99589] px-7 py-4 font-bold text-[#263D55] transition hover:bg-[#ddb2a7]"
                >
                  Register for Batch-01
                </Link>
              ) : (
                <span className="rounded-xl bg-white/15 px-7 py-4 font-bold text-white">
                  {settings
                    ? 'Registration Closed'
                    : loading
                      ? 'Loading...'
                      : 'Please refresh the page'}
                </span>
              )}

              <a
                href="#course-details"
                className="rounded-xl border border-white/30 px-7 py-4 font-semibold"
              >
                Explore Course
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-widest text-[#F0C9BE]">
              Course Investment
            </p>

            {loading ? (
              <p className="mt-5 text-slate-300">
                Loading current fee...
              </p>
            ) : settings ? (
              <>
                <div className="mt-5 flex items-end gap-3">
                  <span className="text-5xl font-extrabold">
                    {money(settings.pricing.currentFee)}
                  </span>
                  {settings.pricing.originalPrice >
                    settings.pricing.currentFee && (
                    <span className="pb-2 text-xl text-slate-300 line-through">
                      {money(settings.pricing.originalPrice)}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-slate-300">
                  {settings.pricing.pricingType === 'early_bird'
                    ? 'Early Bird Registration Fee'
                    : 'Regular Registration Fee'}
                </p>

                <div className="mt-8 space-y-4 border-t border-white/15 pt-6 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-300">Early Bird Deadline</span>
                    <strong>{dateText(settings.dates.earlyBirdEndsAt)}</strong>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-300">Registration Closes</span>
                    <strong>{dateText(settings.dates.registrationClosesAt)}</strong>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-300">Course Starts</span>
                    <strong>{dateText(settings.dates.courseStartAt)}</strong>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-5 text-sm text-amber-200">
                Course information is temporarily unavailable.
              </p>
            )}

            {!loading && settings && !isOpen && (
              <div className="mt-7 rounded-xl border border-amber-200/20 bg-amber-200/10 p-4 text-sm leading-6 text-amber-100">
                We are no longer taking registration. Try for Batch-02.
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        id="course-details"
        className="container-custom py-20"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#3A5A78]">
            About the Course
          </p>

          <h2 className="mt-3 font-display text-3xl font-extrabold">
            Start Your Research Journey with Confidence
          </h2>

          <p className="mt-5 leading-8 text-slate-600">
            This course is designed for students, recent graduates,
            and aspiring researchers who want to understand the
            fundamentals of academic research and prepare for
            meaningful research activities.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Research Fundamentals',
              description: 'Understand research concepts, research questions and the academic research process.',
            },
            {
              title: 'Research Methodology',
              description: 'Learn about research design, data collection and methodological choices.',
            },
            {
              title: 'Literature Review',
              description: 'Explore scholarly databases, literature searching and critical reading.',
            },
            {
              title: 'Academic Writing',
              description: 'Develop academic writing skills and understand scholarly communication.',
            },
            {
              title: 'Publication Awareness',
              description: 'Learn about journals, conferences, peer review and publication ethics.',
            },
            {
              title: 'Higher Study Preparation',
              description: 'Understand how research experience can support future academic goals.',
            },
          ].map((item, index) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <span className="text-sm font-bold text-[#C99589]">
                0{index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-7 shadow-sm">
            <h3 className="text-xl font-bold">What is Included?</h3>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              <li>✓ Five weekly live Zoom sessions</li>
              <li>✓ Learning resources and guided activities</li>
              <li>✓ Official course WhatsApp group</li>
              <li>✓ Certificate after meeting course requirements</li>
              <li>✓ Opportunity for Outstanding Research Learner Award</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-[#333456] p-7 text-white">
            <h3 className="text-xl font-bold">
              Outstanding Research Learner Award
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-200">
              The top two outstanding participants may receive
              recognition based on their participation, assignments,
              and overall learning performance.
            </p>
            <p className="mt-4 text-xs leading-6 text-slate-300">
              Award selection is subject to the course assessment
              criteria of Research Ustad.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          {isOpen ? (
            <Link
              href={`${BASE}/register`}
              className="inline-flex rounded-xl bg-[#3A5A78] px-8 py-4 font-bold text-white hover:bg-[#2d465e]"
            >
              Start Registration
            </Link>
          ) : (
            <p className="font-semibold text-slate-600">
              We are no longer taking registration. Try for Batch-02.
            </p>
          )}
        </div>
      </section>

      <Footer />
      <PayFooter />
    </main>
  );
}