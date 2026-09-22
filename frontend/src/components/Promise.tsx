//frontend/src/components/Promise.tsx
import { FiCheck } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

const promises = [
  'Why research is important for academic and professional growth.',
  'How research experience strengthens higher study applications.',
  'The role of publications and academic networking.',
  'How to build a structured research profile.',
  'Pathways to scholarships, research assistantships, and global opportunities.',
];

export default function Promise() {
  return (
    <section id="promise" className="scroll-mt-20 bg-ink-50 py-20 sm:py-24">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700 shadow-sm">
            <HiOutlineSparkles className="h-3.5 w-3.5" />
            Workshop Promise
          </span>
          <h2 className="section-title mt-4">What You Will Take Away</h2>
          <p className="section-subtitle mx-auto">
            By the end of this workshop, participants will understand:
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="space-y-3">
            {promises.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition-all hover:border-primary-200 hover:shadow-card"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                  <FiCheck className="h-4 w-4" />
                </div>
                <p className="pt-1 text-base font-medium leading-relaxed text-ink-800">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}