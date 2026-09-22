//frontend/src/components/CTASection.tsx
import Link from 'next/link';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

export default function CTASection() {
  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-20 sm:py-24">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <HiOutlineSparkles className="h-4 w-4" />
            Limited Seats Available
          </div>

          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to Start Your Research Journey?
          </h2>

          <p className="mt-4 text-base leading-relaxed text-primary-100 sm:text-lg">
            Join hundreds of students and researchers for our Grand Opening
            Workshop. Registration is completely free.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-primary-700 shadow-lg transition-all hover:bg-primary-50 hover:shadow-xl"
            >
              Register Now
              <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-semibold text-white backdrop-blur">
              <FiCalendar className="h-4 w-4" />
              26 September 2026
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}