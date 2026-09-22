//frontend/src/components/Footer.tsx
import Link from 'next/link';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { FiFacebook, FiLinkedin, FiMail, FiGlobe } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="container-custom py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                <HiOutlineAcademicCap className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold text-ink-950">
                Research Ustad
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-500">
              An academic and research-focused platform dedicated to empowering
              students and researchers through mentorship, research opportunities,
              skill development, and academic collaboration.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
              >
                <FiFacebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
              >
                <FiLinkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Website"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
              >
                <FiGlobe className="h-4 w-4" />
              </a>
              <a
                href="mailto:info@researchustad.org"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
              >
                <FiMail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink-950">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { label: 'About Workshop', href: '#about' },
                { label: 'Agenda', href: '#agenda' },
                { label: 'Outcomes', href: '#outcomes' },
                { label: 'Certificate', href: '#certificate' },
                { label: 'Register', href: '/register' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-500 transition-colors hover:text-primary-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink-950">
              Contact
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-500">
              <li>workshop.researchustad.org</li>
              <li>info@researchustad.org</li>
              <li>26 September 2026</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-100 pt-8 sm:flex-row">
          <p className="text-sm text-ink-500">
            &copy; {new Date().getFullYear()} Research Ustad. All rights reserved.
          </p>
          <p className="text-sm text-ink-500">
            Made with ❤️ for researchers
          </p>
        </div>
      </div>
    </footer>
  );
}