//frontend/src/components/Outcomes.tsx
import { FiCheckCircle } from 'react-icons/fi';
import { HiOutlineTrophy } from 'react-icons/hi2';

const outcomes = [
  'Fundamentals of academic research',
  'How to start research from undergraduate level',
  'Research projects and thesis opportunities',
  'Academic profile building strategies',
  'Publication pathways',
  'Research networking techniques',
  'Scholarship preparation insights',
  'Higher study preparation roadmap',
];

export default function Outcomes() {
  return (
    <section id="outcomes" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
            <HiOutlineTrophy className="h-3.5 w-3.5" />
            Learning Outcomes
          </span>
          <h2 className="section-title mt-4">What You Will Learn</h2>
          <p className="section-subtitle mx-auto">
            Concrete, actionable knowledge that you can apply immediately after the
            workshop.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.map((item, index) => (
            <div
              key={index}
              className="card group"
            >
              <FiCheckCircle className="h-6 w-6 text-primary-600 transition-transform group-hover:scale-110" />
              <p className="mt-4 text-sm font-semibold leading-relaxed text-ink-800">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}