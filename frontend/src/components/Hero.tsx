//frontend/src/components/Hero.tsx
import Link from 'next/link';
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineSparkles } from 'react-icons/hi2';
import Image from 'next/image';


export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent-200/40 blur-3xl" />

      <div className="container-custom relative">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left: Content */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-1.5 text-xs font-semibold text-primary-700 shadow-sm">
              <HiOutlineSparkles className="h-4 w-4" />
              Grand Opening Workshop · Free Registration
            </div>

            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
              Research to Higher Study:{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Building a Strong Academic Profile
              </span>{' '}
              for Global Opportunities
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
              A free, hands-on workshop for undergraduate students, graduates, and
              higher study aspirants who want to understand how research experience
              can unlock global academic opportunities.
            </p>

            {/* Event details */}
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 shadow-sm">
                <FiCalendar className="h-4 w-4 text-primary-600" />
                26 September 2026
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 shadow-sm">
                <FiClock className="h-4 w-4 text-primary-600" />
                2 Hours Session
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 shadow-sm">
                <FiMapPin className="h-4 w-4 text-primary-600" />
                Online (Zoom)
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/register" className="btn-primary group">
                Register Now — It&apos;s Free
                <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#about" className="btn-secondary">
                Learn More
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <FiCheckCircle className="h-4 w-4 text-green-500" />
                Free Certificate
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FiCheckCircle className="h-4 w-4 text-green-500" />
                Live Q&amp;A
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FiCheckCircle className="h-4 w-4 text-green-500" />
                Limited Seats
              </span>
            </div>
          </div>

          {/* Right: Visual card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md animate-float">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-8 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl">
                    <Image
                  src="/images/RU_logo.png"
                  alt="logo"
                  width={100}
                  height={100}
                />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-ink-950">
                      Research Ustad
                    </p>
                    <p className="text-xs text-ink-500">Grand Opening Workshop</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    'Research Fundamentals',
                    'Academic Profile Building',
                    'Publication Pathways',
                    'Scholarship Preparation',
                    'Global Opportunities Roadmap',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl bg-primary-50/60 px-4 py-3"
                    >
                      <FiCheckCircle className="h-4 w-4 shrink-0 text-primary-600" />
                      <span className="text-sm font-medium text-ink-800">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-ink-950 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
                    Registration Status
                  </p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-green-400">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                    </span>
                    Open Now
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}