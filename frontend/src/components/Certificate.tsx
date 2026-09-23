//frontend/src/components/Certificate.tsx
import { FiAward, FiCheckCircle } from 'react-icons/fi';
import { HiOutlineDocumentCheck } from 'react-icons/hi2';
import Image from 'next/image';


const eligibility = [
  'Attend the required portion of the workshop',
  'Submit the feedback form',
  'Complete registration successfully',
];

export default function Certificate() {
  return (
    <section id="certificate" className="scroll-mt-20 bg-ink-950 py-20 sm:py-24">
      <div className="container-custom">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-300">
              <HiOutlineDocumentCheck className="h-3.5 w-3.5" />
              Certificate Information
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Get Your Digital Certificate of Completion
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-300">
              All eligible participants will receive a digital Certificate of
              Completion from Research Ustad, recognized for your academic profile.
            </p>

            <div className="mt-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-ink-400">
                Eligibility Requirements
              </p>
              <div className="mt-4 space-y-3">
                {eligibility.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                    <span className="text-sm text-ink-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Certificate mockup */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white p-8 shadow-card">
              <div className="flex items-center justify-between border-b border-ink-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg  text-white">
                    <Image
                    src="/images/RU_logo.png"
                    alt="logo"
                    width={80}
                    height={80}
                  />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-ink-950">
                      Research Ustad
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-ink-400">
                      Certificate of Completion
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-700">
                  Verified
                </span>
              </div>

              <div className="py-8 text-center">
                <p className="text-xs uppercase tracking-widest text-ink-400">
                  This certificate is proudly presented to
                </p>
                <p className="mt-3 font-display text-2xl font-bold text-ink-950">
                  Participant Name
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink-500">
                  for successfully completing the
                  <br />
                  <span className="font-semibold text-ink-700">
                    Research to Higher Study Workshop
                  </span>
                  <br />
                  held on 26 September 2026
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-ink-100 pt-4">
                <div>
                  <div className="h-px w-24 bg-ink-300" />
                  <p className="mt-1 text-[10px] text-ink-400">Director</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-primary-300 text-primary-600">
                  <FiAward className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <div className="ml-auto h-px w-24 bg-ink-300" />
                  <p className="mt-1 text-[10px] text-ink-400">Date</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}