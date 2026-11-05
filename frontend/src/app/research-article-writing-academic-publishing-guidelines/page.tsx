// frontend/src/app/research-article-writing-academic-publishing-guidelines/page.tsx

import Link from 'next/link';
import type { Metadata } from 'next';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClock,
  HiOutlineVideoCamera,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineChevronDown,
  HiOutlineDocumentText,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2';

import Image from 'next/image';

import {
  COURSE_TITLE,
  COURSE_SUBTITLE,
  COURSE_INFO,
  COURSE_MODULES,
  COURSE_OUTCOMES,
} from '@/data/course01';

import Certificate from '@/components/C_Certificate';

import Footer from '../../components/Footer';

import PayFooter from '@/components/PayFooter';

const REGISTER_URL =
  '/research-article-writing-academic-publishing-guidelines/register';

export const metadata: Metadata = {
  title: `${COURSE_TITLE} | Research Ustad`,
  description:
    'Join a 24-class, 8-module live guidelines covering research foundations, literature review, academic writing, research ethics, peer review and journal submission.',
};

export default function CourseDetailsPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="container-custom flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            
            <div className="flex h-12 w-12 items-center justify-center rounded-lg">
              <Image
                    src="/images/RU_logo.png"
                    alt="logo"
                    width={100}
                    height={100}
                  />
            </div>
            <div>
              <p className="font-display text-lg font-bold">
                Research Ustad
              </p>
              <p className="text-xs tracking-widest text-indigo-600">
                LEARNING ACADEMY
              </p>
            </div>
          </Link>

          <Link
            href={REGISTER_URL}
            className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Enroll Now
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent-200/40 blur-3xl" />

        <div className="container-custom relative grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-1.5 text-xs font-semibold text-primary-700 shadow-sm">
              <HiOutlineSparkles className="h-4 w-4" />
              Batch 01 · Live Online Learning
            </span>

            <h1 className="mt-7 max-w-4xl font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {COURSE_TITLE}
            </h1>

            <p className="mt-5 text-xl font-medium text-primary-700">
              {COURSE_SUBTITLE}
            </p>

            <p className="mt-7 max-w-3xl text-base leading-8 text-slate-600">
              A structured and practical learning journey designed to
              help aspiring researchers understand the research
              process, critically evaluate scholarly literature,
              develop original manuscripts, and navigate the
              academic publication process responsibly.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              {[
                '24 Live Classes',
                '8 Comprehensive Modules',
                'Beginner-Friendly',
                'Hands-on Assignments',
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href={REGISTER_URL}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-4 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                Register for the Guidelines
                <HiOutlineArrowRight className="h-5 w-5" />
              </Link>

              <a
                href="#curriculum"
                className="rounded-xl border border-slate-300 bg-white px-7 py-4 font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                Explore Curriculum
              </a>
            </div>
          </div>

          {/* Hero course highlights */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Course at a Glance
              </p>

              <div className="mt-7 grid grid-cols-2 gap-4">
                {[
                  {
                    label: 'Classes',
                    value: '24',
                    icon: HiOutlineBookOpen,
                  },
                  {
                    label: 'Modules',
                    value: '08',
                    icon: HiOutlineDocumentText,
                  },
                  {
                    label: 'Duration',
                    value: '8–12',
                    icon: HiOutlineClock,
                  },
                  {
                    label: 'Learning',
                    value: 'LIVE',
                    icon: HiOutlineVideoCamera,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <Icon className="mb-4 h-6 w-6 text-indigo-600" />

                      <p className="text-2xl font-extrabold text-slate-900">
                        {item.value}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="text-sm text-slate-500">
                  Special Enrollment Fee
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-xl text-slate-400 line-through">
                    ৳5,000
                  </span>

                  <span className="text-4xl font-extrabold text-emerald-600">
                    ৳3,000
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-emerald-600">
                  Save 40% on the original fee
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="container-custom py-16">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            An Academic Learning Experience
          </p>

          <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            A Practical Roadmap from Research Idea to Manuscript Submission
          </h2>

          <p className="mt-5 leading-8 text-slate-600">
            This course combines conceptual understanding with guided
            exercises and applied academic writing. Participants
            progressively develop research ideas, literature matrices,
            methodological plans, manuscript drafts, and publication
            readiness skills.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Training Format',
              text: COURSE_INFO.format,
              icon: HiOutlineVideoCamera,
            },
            {
              label: 'Estimated Duration',
              text: COURSE_INFO.duration,
              icon: HiOutlineClock,
            },
            {
              label: 'Instruction Language',
              text: COURSE_INFO.language,
              icon: HiOutlineGlobeAlt,
            },
            {
              label: 'Learning Approach',
              text: 'Lecture, demonstration, practice and feedback',
              icon: HiOutlineBookOpen,
            },
          ].map((info) => {
            const Icon = info.icon;

            return (
              <div
                key={info.label}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <Icon className="h-7 w-7 text-indigo-600" />
                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {info.label}
                </p>
                <p className="mt-2 font-semibold leading-6">
                  {info.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Curriculum */}
      <section
        id="curriculum"
        className="border-y border-slate-200 bg-white py-20"
      >
        <div className="container-custom">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Complete Course Curriculum
            </p>

            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
              8 Modules. 24 Structured Classes.
            </h2>

            <p className="mt-5 leading-8 text-slate-500">
              Explore the complete class-by-class curriculum.
              Expand a module to view its topics and practical
              learning assignments.
            </p>
          </div>

          <div className="space-y-5">
            {COURSE_MODULES.map((module) => (
              <details
                key={module.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm open:border-indigo-200 open:shadow-md"
                open={module.id === 1 ? true : undefined}
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5 sm:p-7">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-700">
                    {String(module.id).padStart(2, '0')}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Module {module.id} · Classes{' '}
                      {String(module.classes[0].number).padStart(2, '0')}–
                      {String(module.classes[2].number).padStart(2, '0')}
                    </p>

                    <h3 className="mt-2 text-lg font-bold leading-snug sm:text-xl">
                      {module.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {module.subtitle}
                    </p>
                  </div>

                  <HiOutlineChevronDown className="h-6 w-6 shrink-0 text-indigo-600 transition group-open:rotate-180" />
                </summary>

                <div className="border-t border-slate-100 bg-slate-50/60 p-5 sm:p-7">
                  <div className="grid gap-4 lg:grid-cols-3">
                    {module.classes.map((lesson) => (
                      <article
                        key={lesson.number}
                        className="rounded-2xl border border-slate-100 bg-white p-6"
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                          Class {String(lesson.number).padStart(2, '0')}
                        </p>

                        <h4 className="mt-3 font-bold leading-6">
                          {lesson.title}
                        </h4>

                        <ul className="mt-5 space-y-3">
                          {lesson.topics.map((topic) => (
                            <li
                              key={topic}
                              className="flex gap-2.5 text-sm leading-6 text-slate-600"
                            >
                              <HiOutlineCheckCircle className="mt-1 h-4 w-4 shrink-0 text-indigo-600" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="text-sm font-bold text-emerald-800">
                      Module Practical Assignment
                    </p>

                    <p className="mt-2 text-sm leading-7 text-emerald-900">
                      {module.practical}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="container-custom py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Learning Outcomes
            </p>

            <h2 className="mt-3 font-display text-3xl font-extrabold">
              What Will You Learn?
            </h2>

            <p className="mt-5 leading-8 text-slate-500">
              Gain the academic foundations and practical skills
              needed to approach scholarly research and publishing
              with greater confidence.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {COURSE_OUTCOMES.map((outcome, index) => (
              <div
                key={outcome}
                className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <p className="text-sm leading-7 text-slate-700">
                  {outcome}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificate */}
      <Certificate />

      {/* Enrollment CTA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FBCEB1] via-[#fde4d3] to-white py-20 text-slate-900">
          {/* Soft glow accents */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#FBCEB1]/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />

          {/* Grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(194,65,12,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(194,65,12,0.06) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <HiOutlineShieldCheck className="mx-auto h-12 w-12 text-indigo-300" />

            <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">
              Ready to Develop Your Research and Publishing Skills?
            </h2>

            <p className="mt-5 leading-8 text-slate-700">
              Join a structured, practical learning experience and
              begin building your own research and manuscript
              development roadmap.
            </p>

            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="text-2xl text-slate-500 line-through">
                ৳5,000
              </span>

              <span className="text-4xl font-extrabold text-green-600">
                ৳3,000
              </span>
            </div>

            <Link
              href={REGISTER_URL}
              className="mt-9 inline-flex items-center gap-3 rounded-xl bg-white text-slate-900 px-8 py-4 text-lg font-bold transition hover:bg-green-600 hover:text-white-900"
            >
              Start Registration
              <HiOutlineArrowRight className="h-6 w-6" />
            </Link>

            <p className="mt-4 text-xs text-slate-400">
              Registration is confirmed only after verified payment
              and acceptance of course terms.
            </p>
          </div>
        </div>
      </section>

      < Footer />
      <PayFooter />
    </main>
  );
}