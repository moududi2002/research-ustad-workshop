// frontend/src/app/page.tsx

import Link from 'next/link';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineClock,
} from 'react-icons/hi2';

const COURSE_SLUG =
  '/research-article-writing-academic-publishing-masterclass';

const programs = [
  {
    number: '01',
    category: 'Workshop',
    title: 'Research to Higher Study',
    subtitle: 'Building a Strong Research Profile',
    description:
      'Explore the fundamentals of research, academic profile development, and international higher-study opportunities.',
    icon: HiOutlineCalendarDays,
    href: '/workshop-01',
    featured: false,
    available: true,
    badge: 'Explore workshop',
    lessons: 'Grand Opening Workshop',
  },
  {
    number: '02',
    category: 'Workshop',
    title: 'Upcoming Research Workshop',
    subtitle: 'More learning opportunities ahead',
    description:
      'A new workshop will be announced with its own topic, schedule, and registration information.',
    icon: HiOutlineCalendarDays,
    href: '',
    featured: false,
    available: false,
    badge: 'Coming Soon',
    lessons: 'To Be Announced',
  },
  {
    number: '01',
    category: 'Course',
    title: 'Research Article Writing & Academic Publishing Masterclass',
    subtitle: 'From Research Fundamentals to Journal Submission',
    description:
      'A comprehensive, beginner-friendly live training program with guided practice, scholarly writing, peer review, and publication strategy.',
    icon: HiOutlineBookOpen,
    href: COURSE_SLUG,
    featured: true,
    available: true,
    badge: 'Enrollment Open',
    lessons: '24 Classes · 8 Modules',
  },
  {
    number: '02',
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
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <div className="relative overflow-hidden bg-[#101b38] text-white">
        <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="container-custom relative py-7">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <HiOutlineAcademicCap className="h-7 w-7 text-indigo-200" />
              </div>

              <div>
                <p className="font-display text-xl font-extrabold">
                  Research Ustad
                </p>
                <p className="text-xs tracking-widest text-indigo-200">
                  LEARNING ACADEMY
                </p>
              </div>
            </Link>

            <a
              href="https://researchustad.org"
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold transition hover:bg-white/10 sm:text-sm"
            >
              Main Website
            </a>
          </header>

          <section className="mx-auto max-w-4xl pb-24 pt-20 text-center sm:pb-28 sm:pt-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-5 py-2 text-sm font-medium text-indigo-200">
              <HiOutlineSparkles className="h-4 w-4" />
              Learn · Research · Publish · Grow
            </span>

            <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Build Your Research Skills.
              <span className="mt-3 block bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Shape Your Academic Future.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Discover professionally structured workshops and live
              courses designed to develop research confidence, academic
              writing skills, and responsible publication practices.
            </p>

            <a
              href="#programs"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-7 py-4 font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400"
            >
              Explore Our Programs
              <HiOutlineArrowRight className="h-5 w-5" />
            </a>
          </section>
        </div>
      </div>

      <section
        id="programs"
        className="container-custom relative -mt-10 pb-24"
      >
        <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Learning Opportunities
          </p>

          <h2 className="mt-2 font-display text-3xl font-bold">
            Choose Your Next Learning Experience
          </h2>

          <p className="mt-3 max-w-2xl text-slate-500">
            From focused workshops to comprehensive practical courses,
            find the learning path that matches your academic goals.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {programs.map((program) => {
            const Icon = program.icon;

            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      program.featured
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      program.featured
                        ? 'bg-emerald-100 text-emerald-700'
                        : program.available
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {program.badge}
                  </span>
                </div>

                <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                  {program.category} {program.number}
                </p>

                <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-slate-900">
                  {program.title}
                </h3>

                <p className="mt-3 font-semibold text-slate-600">
                  {program.subtitle}
                </p>

                <p className="mt-4 flex-1 text-sm leading-7 text-slate-500">
                  {program.description}
                </p>

                <div className="mt-7 flex items-center gap-2 border-t border-slate-100 pt-5 text-sm text-slate-600">
                  <HiOutlineClock className="h-5 w-5 text-indigo-500" />
                  {program.lessons}
                </div>

                <div
                  className={`mt-6 flex items-center justify-between rounded-xl px-5 py-3.5 text-sm font-bold ${
                    program.available
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span>
                    {program.available
                      ? 'View Program Details'
                      : 'Details Coming Soon'}
                  </span>

                  <HiOutlineArrowRight className="h-5 w-5" />
                </div>
              </>
            );

            const cardClass =
              'group flex h-full flex-col rounded-3xl border ' +
              'border-slate-100 bg-white p-6 shadow-sm transition ' +
              'sm:p-8 ' +
              (program.available
                ? 'hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl'
                : 'opacity-80');

            return program.available ? (
              <Link
                href={program.href}
                key={`${program.category}-${program.number}`}
                className={cardClass}
              >
                {content}
              </Link>
            ) : (
              <article
                key={`${program.category}-${program.number}`}
                className={cardClass}
              >
                {content}
              </article>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Research Ustad.
        Advancing Research. Empowering Scholars.
      </footer>
    </main>
  );
}