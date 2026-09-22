//frontend/src/components/Agenda.tsx
import { FiClock } from 'react-icons/fi';
import { HiOutlineCalendarDays } from 'react-icons/hi2';

const agenda = [
  { segment: 'Participant Entry and Welcome', duration: '10 Minutes' },
  { segment: 'Research Ustad Grand Opening', duration: '10 Minutes' },
  { segment: 'Opening Speech and Context', duration: '10 Minutes' },
  { segment: 'Research Fundamentals', duration: '30 Minutes' },
  { segment: 'Interactive Activity', duration: '10 Minutes' },
  { segment: 'Building Research Profile for Higher Study', duration: '30 Minutes' },
  { segment: 'Q&A Session', duration: '10 Minutes' },
  { segment: 'Closing and Certificate Instructions', duration: '10 Minutes' },
];

export default function Agenda() {
  return (
    <section id="agenda" className="scroll-mt-20 bg-ink-50 py-20 sm:py-24">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700 shadow-sm">
            <HiOutlineCalendarDays className="h-3.5 w-3.5" />
            Workshop Agenda
          </span>
          <h2 className="section-title mt-4">How the Session Will Flow</h2>
          <p className="section-subtitle mx-auto">
            A carefully structured 2-hour journey from research fundamentals to
            global opportunities.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
          <div className="hidden grid-cols-12 gap-4 border-b border-ink-100 bg-ink-950 px-6 py-4 sm:grid">
            <div className="col-span-9 text-xs font-semibold uppercase tracking-wider text-ink-400">
              Segment
            </div>
            <div className="col-span-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-400">
              Duration
            </div>
          </div>

          <div className="divide-y divide-ink-100">
            {agenda.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/40"
              >
                <div className="col-span-12 flex items-start gap-4 sm:col-span-9">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-sm font-medium text-ink-800">
                    {item.segment}
                  </span>
                </div>
                <div className="col-span-12 flex items-center gap-1.5 sm:col-span-3 sm:justify-end">
                  <FiClock className="h-3.5 w-3.5 text-ink-400" />
                  <span className="text-sm font-semibold text-ink-600">
                    {item.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-ink-100 bg-primary-50/60 px-6 py-4">
            <span className="text-sm font-bold text-ink-900">Total Duration</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-1.5 text-sm font-bold text-white">
              <FiClock className="h-4 w-4" />
              Approximately 2 Hours
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}