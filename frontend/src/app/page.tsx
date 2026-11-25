// frontend/src/app/page.tsx

import Link from 'next/link';
import Image from 'next/image';
import type { IconType } from 'react-icons';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

import Footer from '@/components/Footer';
import PayFooter from '@/components/PayFooter';
import Reveal from '@/components/course-module/Reveal';
import { COURSE_SLUG } from '@/data/course01';

const FOUNDATION_PATH = '/research-foundation-course-2026';

interface Program {
  number: string;
  category: 'Course' | 'Workshop';
  title: string;
  subtitle: string;
  description: string;
  icon: IconType;
  href: string;
  featured: boolean;
  available: boolean;
  badge: string;
  lessons: string;
}

// Courses first: Batch-01 is the primary call to action.
const programs: Program[] = [
  {
    number: '01',
    category: 'Course',
    title: 'Research Foundation Course-2026',
    subtitle: 'Build Your Research Foundation',
    description:
      'A beginner-friendly research training program covering research fundamentals, methodology, academic writing, publication awareness and higher-study preparation.',
    icon: HiOutlineAcademicCap,
    href: FOUNDATION_PATH,
    featured: true,
    available: true,
    badge: 'Batch-01 · Enrollment',
    lessons: '5 Weekly Live Sessions',
  },
  {
    number: '02',
    category: 'Course',
    title: 'Research Article Writing & Academic Publishing Guidelines',
    subtitle: 'From Research Fundamentals to Journal Submission',
    description:
      'A comprehensive, beginner-friendly live training program with guided practice, scholarly writing, peer review and publication strategy.',
    icon: HiOutlineBookOpen,
    href: `/${COURSE_SLUG}`,
    featured: true,
    available: true,
    badge: 'Enrollment Open',
    lessons: '24 Classes · 8 Modules',
  },
  {
    number: '01',
    category: 'Workshop',
    title: 'Research to Higher Study',
    subtitle: 'Building a Strong Research Profile',
    description:
      'Explore the fundamentals of research, academic profile development and international higher-study opportunities.',
    icon: HiOutlineCalendarDays,
    href: '/workshop-01',
    featured: false,
    available: true,
    badge: 'Explore workshop',
    lessons: 'Grand Opening Workshop',
  },
  {
    number: '03',
    category: 'Course',
    title: 'Advanced Research Training',
    subtitle: 'A future Research Ustad program',
    description:
      'Stay connected for information about upcoming advanced courses and practical academic training.',
    icon: HiOutlineAcademicCap,
    href: '',
    featured: false,
    available: false,
    badge: 'Coming Soon',
    lessons: 'To Be Announced',
  },
  {
    number: '02',
    category: 'Workshop',
    title: 'Upcoming Research Workshop',
    subtitle: 'More learning opportunities ahead',
    description:
      'A new workshop will be announced with its own topic, schedule and registration information.',
    icon: HiOutlineCalendarDays,
    href: '',
    featured: false,
    available: false,
    badge: 'Coming Soon',
    lessons: 'To Be Announced',
  },
];

const batchHighlights = [
  '5 weekly live sessions on Zoom',
  'Beginner friendly, for BSc and MSc students',
  'Certificate of Completion',
];

const badgeStyle = (program: Program) => {
  if (program.featured) return 'bg-[#C99589]/15 text-[#9A5F52]';
  if (program.available) return 'bg-[#3A5A78]/10 text-[#3A5A78]';
  return 'bg-slate-100 text-slate-500';
};

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-[#F5F8FB] text-slate-900">
        {/* Hero */}
        <div className="relative overflow-hidden bg-[#263D55] text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]"
          />

          <div className="container-custom relative">
            <header className="flex h-24 items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/images/RU_logo.png"
                  alt="Research Ustad"
                  width={48}
                  height={48}
                  priority
                />
                <div>
                  <p className="font-display text-xl font-extrabold">Research Ustad</p>
                  <p className="text-xs tracking-widest text-[#F0C9BE]">LEARNING ACADEMY</p>
                </div>
              </Link>

              <a
                href="https://researchustad.org"
                className="rounded-full border border-white/25 px-4 py-2 text-xs font-semibold transition-colors hover:border-white hover:bg-white/10 sm:text-sm"
              >
                Main Website
              </a>
            </header>

            <section className="grid gap-14 pb-28 pt-12 sm:pt-16 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pb-32 lg:pt-20">
              <div className="lg:col-span-7">
                <Reveal>
                  <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#F0C9BE]">
                    <span className="h-px w-8 bg-[#F0C9BE]" aria-hidden="true" />
                    Learn · Research · Publish · Grow
                  </p>
                </Reveal>

                <Reveal delay={100}>
                  <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
                    Build Your Research Skills.
                    <span className="mt-2 block text-[#F0C9BE]">Shape Your Academic Future.</span>
                  </h1>
                </Reveal>

                <Reveal delay={200}>
                  <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                    Discover professionally structured workshops and live courses designed to
                    develop research confidence, academic writing skills and responsible
                    publication practices.
                  </p>
                </Reveal>

                <Reveal delay={300}>
                  <div className="hero-btns mt-9 flex flex-wrap gap-4">
                    <a href="#programs" className="hero-btn hero-btn-solid group">
                      Explore Our Programs
                      <HiOutlineArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>

                    <Link
                      href={`${FOUNDATION_PATH}/course-module`}
                      className="hero-btn hero-btn-plain"
                    >
                      Batch-01 Course Module
                    </Link>
                  </div>
                </Reveal>
              </div>

              <Reveal delay={400} className="lg:col-span-5">
                <div className="animate-float motion-reduce:animate-none">
                  <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F0C9BE]">
                      Now Enrolling · Batch-01
                    </p>

                    <h2 className="mt-4 font-display text-2xl font-bold leading-snug">
                      Research Foundation Course-2026
                    </h2>

                    <ul className="mt-6 space-y-3 border-t border-white/15 pt-6">
                      {batchHighlights.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                          <HiOutlineCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#C99589]" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={FOUNDATION_PATH}
                      className="group mt-7 flex items-center justify-between rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#263D55] transition-colors hover:bg-[#F5F8FB]"
                    >
                      View Course Details
                      <HiOutlineArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            </section>
          </div>
        </div>

        {/* Programs */}
        <section id="programs" className="container-custom scroll-mt-4 py-20 lg:py-24">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B07468]">
                Learning Opportunities
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#263D55] sm:text-4xl">
                Choose Your Next Learning Experience
              </h2>
              <p className="mt-4 text-base text-slate-500">
                From focused workshops to comprehensive practical courses, find the learning
                path that matches your academic goals.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {programs.map((program, index) => {
              const Icon = program.icon;
              const key = `${program.category}-${program.number}`;

              const cardClass =
                'group flex h-full flex-col rounded-2xl border border-t-2 bg-white p-6 transition-all duration-300 sm:p-8 ' +
                (program.available
                  ? `border-slate-200 hover:-translate-y-1 hover:shadow-card ${
                      program.featured ? 'border-t-[#C99589]' : 'border-t-[#3A5A78]'
                    }`
                  : 'border-dashed border-slate-300 border-t-slate-300 bg-white/60');

              const content = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 ${
                        program.available ? 'group-hover:scale-105' : ''
                      } ${
                        program.featured
                          ? 'bg-[#263D55] text-white'
                          : 'bg-[#F5F8FB] text-[#3A5A78]'
                      }`}
                    >
                      <Icon className="h-7 w-7" />
                    </span>

                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${badgeStyle(program)}`}>
                      {program.badge}
                    </span>
                  </div>

                  <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#B07468]">
                    {program.category} {program.number}
                  </p>

                  <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-[#263D55]">
                    {program.title}
                  </h3>

                  <p className="mt-3 font-semibold text-slate-600">{program.subtitle}</p>

                  <p className="mt-4 flex-1 text-sm leading-7 text-slate-500">
                    {program.description}
                  </p>

                  <div className="mt-7 flex items-center gap-2 border-t border-slate-100 pt-5 text-sm text-slate-600">
                    <HiOutlineClock className="h-5 w-5 text-[#3A5A78]" />
                    {program.lessons}
                  </div>

                  <div
                    className={`mt-6 flex items-center justify-between rounded-xl px-5 py-3.5 text-sm font-bold transition-colors ${
                      program.available
                        ? 'bg-[#3A5A78] text-white group-hover:bg-[#263D55]'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <span>
                      {program.available ? 'View Program Details' : 'Details Coming Soon'}
                    </span>
                    <HiOutlineArrowRight
                      className={`h-5 w-5 ${
                        program.available
                          ? 'transition-transform duration-300 group-hover:translate-x-1'
                          : ''
                      }`}
                    />
                  </div>
                </>
              );

              return (
                <Reveal key={key} delay={(index % 2) * 120} className="h-full">
                  {program.available ? (
                    <Link href={program.href} className={cardClass}>
                      {content}
                    </Link>
                  ) : (
                    <article className={cardClass}>{content}</article>
                  )}
                </Reveal>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
      <PayFooter />
    </>
  );
}