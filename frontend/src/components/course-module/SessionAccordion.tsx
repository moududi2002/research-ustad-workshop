// frontend/src/components/foundation-batch01/course-module/SessionAccordion.tsx

'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import type { CourseSession } from '@/data/researchFoundationCourse';

interface SessionAccordionProps {
  sessions: CourseSession[];
}

const pad = (value: number) => String(value).padStart(2, '0');

export default function SessionAccordion({ sessions }: SessionAccordionProps) {
  const [openNumber, setOpenNumber] = useState<number | null>(sessions[0]?.number ?? null);

  const toggle = (number: number) =>
    setOpenNumber((current) => (current === number ? null : number));

  return (
    <ol className="divide-y divide-slate-200 border-y border-slate-200">
      {sessions.map((session) => {
        const isOpen = openNumber === session.number;
        const panelId = `session-panel-${session.number}`;
        const buttonId = `session-button-${session.number}`;

        return (
          <li key={session.number}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(session.number)}
                className="group flex w-full items-stretch gap-5 py-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3A5A78] focus-visible:ring-offset-2 sm:gap-8"
              >
                <span className="w-14 shrink-0 text-center sm:w-20">
                  <span className="block text-xs font-bold uppercase tracking-widest text-[#3A5A78]">
                    {session.date.month}
                  </span>
                  <span className="block font-display text-4xl font-extrabold leading-none text-[#263D55] sm:text-5xl">
                    {session.date.day}
                  </span>
                  <span className="mt-1.5 block text-xs text-slate-500">
                    {session.date.weekday}
                  </span>
                </span>

                <span className="flex min-w-0 flex-1 flex-col justify-center border-l border-slate-200 pl-5 sm:pl-8">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#B07468]">
                    Session {pad(session.number)} · {session.tag}
                  </span>
                  <span className="mt-2 font-display text-lg font-bold leading-snug text-[#263D55] transition-colors group-hover:text-[#3A5A78] sm:text-xl">
                    {session.title}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full border border-slate-200 text-[#3A5A78] transition-colors group-hover:border-[#3A5A78]"
                >
                  <FiChevronDown
                    className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows] duration-500 ease-in-out motion-reduce:transition-none ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div
                className={`overflow-hidden transition-[visibility] ${
                  isOpen ? 'visible duration-0' : 'invisible duration-500'
                }`}
              >
                <div className="flex gap-5 pb-8 sm:gap-8">
                  <div className="w-14 shrink-0 sm:w-20" aria-hidden="true" />

                  <div className="min-w-0 flex-1 border-l border-slate-200 pl-5 sm:pl-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Topics Covered
                    </p>

                    <ul className="mt-4 grid gap-x-10 gap-y-3 text-[15px] leading-6 text-slate-700 md:grid-cols-2">
                      {session.topics.map((topic) => (
                        <li key={topic} className="flex gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-[#C99589]"
                          />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 border-l-2 border-[#C99589] bg-[#F5F8FB] px-5 py-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#B07468]">
                        Interactive Activity
                      </p>
                      <p className="mt-1.5 text-[15px] leading-6 text-slate-800">
                        {session.activity}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Followed by Q&amp;A Session
                      </p>
                    </div>

                    <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          Keynote Speaker
                        </dt>
                        <dd className="mt-1.5 font-semibold text-[#263D55]">
                          {session.keynote.name}
                        </dd>
                        <dd className="text-sm text-slate-500">{session.keynote.role}</dd>
                      </div>

                      <div>
                        <dt className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          Guest Speaker
                        </dt>
                        <dd className="mt-1.5 font-semibold text-[#263D55]">
                          {session.guest.name}
                        </dd>
                        <dd className="text-sm text-slate-500">{session.guest.role}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
