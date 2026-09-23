//frontend/src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import Image from 'next/image';


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Promise', href: '#promise' },
    { label: 'Agenda', href: '#agenda' },
    { label: 'Outcomes', href: '#outcomes' },
    { label: 'Certificate', href: '#certificate' },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-ink-100 bg-white/90 backdrop-blur-lg'
          : 'bg-transparent'
      }`}
    >
      <nav className="container-custom flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg">
            <Image
                  src="/images/RU_logo.png"
                  alt="logo"
                  width={100}
                  height={100}
                />
          </div>
          <span className="font-display text-lg font-bold text-ink-950">
            Research Ustad
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-600 transition-colors hover:text-primary-600"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Link href="/register" className="btn-primary !py-2.5 !text-sm">
            Register Now
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-ink-700 md:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-ink-100 bg-white md:hidden">
          <div className="container-custom flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-primary-50 hover:text-primary-600"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/register"
              className="btn-primary mt-2"
              onClick={() => setIsOpen(false)}
            >
              Register Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}