//frontend/src/app/register/page.tsx
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RegistrationForm from '@/components/RegistrationForm';
import { FiArrowLeft, FiCalendar, FiClock, FiAward } from 'react-icons/fi';

export const metadata = {
  title: 'Register | Research Ustad Grand Opening Workshop',
  description: 'Register for the free Research Ustad Grand Opening Workshop.',
};

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ink-50 pb-20 pt-28 sm:pt-32">
        <div className="container-custom">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition-colors hover:text-primary-600"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="grid gap-10 lg:grid-cols-12">
            {/* Left: Info */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-5">
                <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
                  <h1 className="font-display text-2xl font-bold text-ink-950">
                    Register for the Workshop
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    Complete the form to secure your free seat at the Research
                    Ustad Grand Opening Workshop.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-primary-50/60 px-4 py-3">
                      <FiCalendar className="h-4 w-4 shrink-0 text-primary-600" />
                      <span className="text-sm font-medium text-ink-800">
                        26 September 2026
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-primary-50/60 px-4 py-3">
                      <FiClock className="h-4 w-4 shrink-0 text-primary-600" />
                      <span className="text-sm font-medium text-ink-800">
                        Approximately 2 Hours
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-primary-50/60 px-4 py-3">
                      <FiAward className="h-4 w-4 shrink-0 text-primary-600" />
                      <span className="text-sm font-medium text-ink-800">
                        Digital Certificate Included
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
                    Registration Status
                  </p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-green-800">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    Open — Limited Seats
                  </p>
                </div>
              </div>
            </aside>

            {/* Right: Form */}
            <div className="lg:col-span-8">
              <RegistrationForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}