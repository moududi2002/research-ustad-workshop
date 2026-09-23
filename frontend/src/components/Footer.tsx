//frontend/src/components/Footer.tsx
import Link from 'next/link';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { FiFacebook, FiLinkedin, FiMail, FiGlobe } from 'react-icons/fi';
import { FaFacebook , FaLinkedin } from "react-icons/fa6";
import Image from 'next/image';



export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="container-custom py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg ">
                <Image
                  src="/images/RU_logo.png"
                  alt="logo"
                  width={80}
                  height={80}
                />
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
                href="https://www.facebook.com/ResearchUstad/"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
              >
                <FaFacebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/researchustad"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
              >
                <FaLinkedin className="h-4 w-4" />
              </a>
              <a
                href="https://www.researchustad.org"
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
              
              <li>info@researchustad.org</li>
             
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-100 pt-8 sm:flex-row">
          <p className="text-sm text-ink-500">
            &copy; {new Date().getFullYear()} Research Ustad. All rights reserved.
          </p>
          <p className="text-sm text-ink-500">
          <a href='https://researchustad.org' target='_blank'>Developed By RU IT Team</a>
          </p>
        </div>
      </div>
    </footer>
  );
}