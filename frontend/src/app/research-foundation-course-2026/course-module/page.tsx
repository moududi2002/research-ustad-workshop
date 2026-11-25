// frontend/src/app/research-foundation-course-2026/course-module/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { FiAward, FiArrowRight, FiCheck } from 'react-icons/fi';
import Footer from '@/components/Footer';
import Reveal from '@/components/foundation-batch01/course-module/Reveal';
import SessionAccordion from '@/components/foundation-batch01/course-module/SessionAccordion';
import {
  COURSE,
  COURSE_AWARDS,
  COURSE_BASE_PATH,
  COURSE_FACTS,
  COURSE_SESSIONS,
  LEARNING_OUTCOMES,
} from '@/data/researchFoundationCourse';

const PAGE_PATH = `${COURSE_BASE_PATH}/course-module`;

export const metadata: Metadata = {
  title: 'Course Module | Research Foundation Course-2026',
  description: COURSE.summary,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: 'Research Foundation Course-2026: Course Module',
    description: COURSE.summary,
    url: PAGE_PATH,
    type: 'website',
  },
};

function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B07468]">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#263D55] sm:text-4xl">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function CourseModulePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="container-custom flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/RU_logo.png" alt="Research Ustad" width={48} height={48} />
            <div>
              <p className="font-bold">Research Ustad</p>
              <p className="text-xs tracking-widest text-[#3A5A78]">LEARNING ACADEMY</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-6">
            <Link
              href={COURSE_BASE_PATH}
              className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-[#263D55] sm:inline"
            >
              Course Overview
            </Link>
            <Link
              href={`${COURSE_BASE_PATH}/register`}
              className="rounded-xl bg-[#3A5A78] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#263D55]"
            >
              Enroll Now
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#263D55] text-white">
        <div className="container-custom pb-28 pt-16 sm:pt-20 lg:pb-32 lg:pt-24">
          <div className="max-w-3xl">
            <Reveal>
              <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#F0C9BE]">
                <span className="h-px w-8 bg-[#F0C9BE]" aria-hidden="true" />
                Research Ustad · {COURSE.batch} · Course Module
              </p>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.15] sm:text-5xl lg:text-6xl">
                {COURSE.name}
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{COURSE.summary}</p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href={`${COURSE_BASE_PATH}/register`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C99589] px-7 py-4 font-bold text-[#263D55] transition-colors hover:bg-[#ddb2a7]"
                >
                  Register for {COURSE.batch}
                  <FiArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#schedule"
                  className="rounded-xl border border-white/30 px-7 py-4 font-semibold transition-colors hover:border-white hover:bg-white/10"
                >
                  View Schedule
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Facts strip */}
      <section aria-label="Course at a glance" className="relative z-10 -mt-14">
        <div className="container-custom">
          <Reveal>
            <dl className="grid grid-cols-2 border border-slate-200 bg-white shadow-soft sm:grid-cols-3 lg:grid-cols-6">
              {COURSE_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="border-b border-r border-slate-200 p-5 last:border-r-0 sm:p-6 lg:border-b-0"
                >
                  <dt className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {fact.label}
                  </dt>
                  <dd className="mt-2 font-display text-2xl font-extrabold text-[#263D55]">
                    {fact.value}
                  </dd>
                  <dd className="mt-1 text-xs text-slate-500">{fact.note}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* About */}
      <section className="py-20 lg:py-24">
        <div className="container-custom grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <SectionHeading eyebrow="About the Course" title="A structured roadmap for first-time researchers" />
            <p className="mt-6 text-base leading-8 text-slate-600">{COURSE.description}</p>
          </Reveal>

          <Reveal delay={150} className="lg:col-span-5">
            <div className="border-t-2 border-[#263D55] bg-[#F5F8FB] p-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B07468]">
                Target Audience
              </p>
              <p className="mt-3 font-display text-xl font-bold text-[#263D55]">
                {COURSE.audience}
              </p>

              <ul className="mt-5 space-y-3">
                {COURSE.audienceFocus.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[15px] text-slate-700">
                    <FiCheck className="h-4 w-4 shrink-0 text-[#3A5A78]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-6 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-500">
                {COURSE.medium}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Schedule */}
      <section id="schedule" className="scroll-mt-24 border-t border-slate-200 bg-white py-20 lg:py-24">
        <div className="container-custom">
          <Reveal>
            <SectionHeading eyebrow="Course Schedule" title="Five sessions, one clear path">
              <p className="mt-4 text-base text-slate-500">
                Open a session to see its topics, activity and speakers. The schedule is tentative
                and may be updated.
              </p>
            </SectionHeading>
          </Reveal>

          <Reveal delay={100} className="mt-12">
            <SessionAccordion sessions={COURSE_SESSIONS} />
          </Reveal>
        </div>
      </section>

      {/* Awards */}
      <section className="bg-[#F5F8FB] py-20 lg:py-24">
        <div className="container-custom">
          <Reveal>
            <SectionHeading eyebrow="Course Award" title="Recognition for your effort" />
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {COURSE_AWARDS.map((award, index) => (
              <Reveal key={award.title} delay={index * 120}>
                <div className="h-full border border-slate-200 bg-white p-8 transition-shadow duration-300 hover:shadow-card">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#263D55] text-white">
                    <FiAward className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold text-[#263D55]">
                    {award.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-7 text-slate-600">{award.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Learning outcomes */}
      <section className="py-20 lg:py-24">
        <div className="container-custom">
          <Reveal>
            <SectionHeading eyebrow="Learning Outcomes" title="What you will be able to do">
              <p className="mt-4 text-base text-slate-500">
                After completing this course, participants will be able to:
              </p>
            </SectionHeading>
          </Reveal>

          <ol className="mt-12 grid border-t border-slate-200 md:grid-cols-2 md:gap-x-16">
            {LEARNING_OUTCOMES.map((outcome, index) => (
              <li key={outcome} className="border-b border-slate-200">
                <Reveal delay={(index % 2) * 100} className="flex items-baseline gap-5 py-6">
                  <span className="font-display text-2xl font-extrabold text-[#C99589]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base leading-7 text-slate-700">{outcome}</span>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-[#263D55] py-16 text-white lg:py-20">
        <div className="container-custom">
          <Reveal className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Take your first step toward independent research.
              </h2>
              <p className="mt-3 text-slate-300">
                {COURSE.name} · {COURSE.batch}
              </p>
            </div>

            <Link
              href={`${COURSE_BASE_PATH}/register`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#C99589] px-8 py-4 font-bold text-[#263D55] transition-colors hover:bg-[#ddb2a7]"
            >
              Register for {COURSE.batch}
              <FiArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
