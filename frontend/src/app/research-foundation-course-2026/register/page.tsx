// frontend/src/app/research-foundation-course-2026/register/page.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import PayFooter from '@/components/PayFooter';

const BASE = '/research-foundation-course-2026';

const academicStatuses = [
  'Undergraduate Student',
  "Master's Student",
  'Recent Graduate',
  'Researcher',
  'Higher Study Applicant',
  'Other',
];

const researchLevels = [
  'Complete Beginner',
  'Beginner',
  'Developing',
  'Intermediate',
  'Experienced',
];

const sources = [
  'Research Ustad Facebook Page',
  'Research Ustad Facebook Group',
  'LinkedIn',
  'WhatsApp Group',
  'Friend or Colleague',
  'University Group',
  'Faculty Member or Mentor',
  'Research Ustad Team Member',
  'Other',
];

const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Netherlands',
  'Sweden',
  'Norway',
  'Finland',
  'Denmark',
  'Japan',
  'South Korea',
  'China',
  'Singapore',
  'Malaysia',
  'Saudi Arabia',
  'UAE',
  'Other',
];

type Settings = {
  courseName: string;
  pricing: {
    currentFee: number;
    originalPrice: number;
  };
  registration: {
    isOpen: boolean;
  };
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#3A5A78] focus:ring-4 focus:ring-[#3A5A78]/10';

export default function Batch01RegistrationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [resumeEmail, setResumeEmail] = useState('');
  const [resumeOtp, setResumeOtp] = useState('');
  const [resumeInput, setResumeInput] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    academicStatus: '',
    universityName: '',
    department: '',
    researchLevel: '',
    higherStudyInterest: '',
    preferredCountry: '',
    registrationSource: '',
    consent: false,
  });

  useEffect(() => {
    fetch('/api/course/batch-01/settings', 
      { 
        cache: 'no-store' 
      })
      .then((response) => response.json())
      .then(setSettings)
      .catch(() => toast.error('Unable to load course information'));
  }, []);

  function update(
    key: keyof typeof form,
    value: string | boolean,
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function requestResumeOtp(emailInput: string) {
    const email = emailInput.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid registered email address');
      return;
    }

    setResumeLoading(true);

    try {
      const response = await fetch('/api/course/batch-01/resume-request', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(', ')
            : result.message || 'Unable to send verification code',
        );
      }

      setResumeEmail(email);
      setResumeOtp('');

      toast.success('Check your email for a verification code');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to send verification code',
      );
    } finally {
      setResumeLoading(false);
    }
  }

  async function verifyResumeOtp() {
    if (!/^\d{6}$/.test(resumeOtp)) {
      toast.error('Please enter the six-digit OTP');
      return;
    }

    setResumeLoading(true);

    try {
      const response = await fetch('/api/course/batch-01/resume-verify', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resumeEmail,
          code: resumeOtp,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(', ')
            : result.message || 'OTP verification failed',
        );
      }

      // The proxy has now set a new HttpOnly session cookie.
      toast.success('Registration session restored');
      router.replace(`${BASE}/checkout`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Verification failed',
      );
    } finally {
      setResumeLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.consent) {
      toast.error('Please accept the registration declaration');
      return;
    }

    if (form.higherStudyInterest === 'Yes' && !form.preferredCountry) {
      toast.error('Please select your preferred country');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/course/batch-01/register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const result = await response.json().catch(() => ({}));

      // Existing email: do not create another registration.
      // Verify ownership by sending an OTP.
      if (response.status === 409) {
        await requestResumeOtp(form.email);
        return;
      }

      if (!response.ok) {
        const message = Array.isArray(result.message)
          ? result.message.join(', ')
          : result.message;

        throw new Error(
          message || 'Registration could not be completed',
        );
      }

      toast.success('Registration information saved');
      router.push(`${BASE}/checkout`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Registration failed',
      );
    } finally {
      setLoading(false);
    }
  }

  const isOpen = settings?.registration?.isOpen ?? false;

    if (resumeEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F8FB] px-4 py-12">
        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-[#3A5A78] px-8 py-10 text-center text-white">
            <p className="text-sm font-medium uppercase tracking-widest text-white/70">
              Research Ustad · Batch-01
            </p>

            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
              Resume Your Registration
            </h1>

            <p className="mt-3 text-sm leading-7 text-white/80">
              This email has an existing registration.
              Verify your identity to securely continue.
            </p>
          </div>

          <div className="space-y-6 p-7 sm:p-9">
            <div className="rounded-xl border border-slate-200 bg-[#F5F8FB] p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#3A5A78]">
                Verification Email
              </p>

              <p className="mt-2 break-all font-bold text-slate-900">
                {resumeEmail}
              </p>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                Enter the six-digit code sent to your inbox.
                The code expires after 10 minutes.
              </p>
            </div>

            <div>
              <label
                htmlFor="batch01ResumeOtp"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Six-Digit Verification Code
              </label>

              <input
                id="batch01ResumeOtp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={resumeOtp}
                onChange={(event) =>
                  setResumeOtp(
                    event.target.value.replace(/\D/g, '').slice(0, 6),
                  )
                }
                placeholder="000000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-[#3A5A78] focus:ring-4 focus:ring-[#3A5A78]/10"
              />
            </div>

            <button
              type="button"
              onClick={() => void verifyResumeOtp()}
              disabled={resumeLoading || resumeOtp.length !== 6}
              className="w-full rounded-xl bg-[#3A5A78] px-6 py-4 font-bold text-white transition hover:bg-[#2d465e] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {resumeLoading ? 'Verifying...' : 'Verify & Continue to Checkout'}
            </button>

            <button
              type="button"
              disabled={resumeLoading}
              onClick={() => void requestResumeOtp(resumeEmail)}
              className="w-full text-center text-sm font-semibold text-[#3A5A78] hover:underline disabled:opacity-50"
            >
              Resend Verification Code
            </button>

            <div className="border-t border-slate-100 pt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setResumeEmail('');
                  setResumeOtp('');
                }}
                className="text-sm font-medium text-slate-500 hover:text-[#3A5A78]"
              >
                Back to Registration Form
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F8FB] text-slate-900">
      <header className="border-b bg-white">
        <div className="container-custom flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/RU_logo.png"
              alt="Research Ustad"
              width={48}
              height={48}
            />
            <div>
              <p className="font-bold">Research Ustad</p>
              <p className="text-xs text-[#3A5A78]">
                BATCH-01 REGISTRATION
              </p>
            </div>
          </Link>

          <Link
            href={BASE}
            className="text-sm font-semibold text-[#3A5A78]"
          >
            Course Details
          </Link>
        </div>
      </header>

      <div className="container-custom py-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#3A5A78]">
            Research Foundation Course-2026 · Batch-01
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Registration Form
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Complete your personal and academic information.
            Your registration will be saved securely and you
            can review the payable fee before proceeding.
          </p>

          {!isOpen && settings && (
            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
              We are no longer taking registration. Try for Batch-02.
            </div>
          )}

          <section className="mt-8 rounded-3xl border border-[#3A5A78]/20 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold">
              Already registered?
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Lost your session or switched device? Enter your
              registered email address and we will send a
              six-digit code so you can continue where you left off.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                maxLength={254}
                autoComplete="email"
                className={`${inputClass} min-w-0 flex-1`}
                placeholder="Registered email address"
                value={resumeInput}
                onChange={(e) => setResumeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void requestResumeOtp(resumeInput);
                  }
                }}
              />

              <button
                type="button"
                disabled={resumeLoading}
                onClick={() => void requestResumeOtp(resumeInput)}
                className="rounded-xl border-2 border-[#3A5A78] px-6 py-3 font-bold text-[#3A5A78] transition hover:bg-[#F5F8FB] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resumeLoading ? 'Sending...' : 'Send Code'}
              </button>
            </div>
          </section>

          <form onSubmit={onSubmit} className="mt-7 space-y-7">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold">
                Personal Information
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Full Name *">
                    <input
                      required
                      minLength={3}
                      maxLength={100}
                      className={inputClass}
                      placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={(e) => update('fullName', e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Email Address *">
                  <input
                    required
                    type="email"
                    maxLength={254}
                    className={inputClass}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </Field>

                <Field label="WhatsApp Number *">
                  <input
                    required
                    type="tel"
                    minLength={10}
                    maxLength={20}
                    className={inputClass}
                    placeholder="01XXXXXXXXX"
                    value={form.whatsapp}
                    onChange={(e) => update('whatsapp', e.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold">
                Academic Information
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Academic Status *">
                  <select
                    required
                    className={inputClass}
                    value={form.academicStatus}
                    onChange={(e) => update('academicStatus', e.target.value)}
                  >
                    <option value="">Select your status</option>
                    {academicStatuses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>

                <Field label="University / Institution *">
                  <input
                    required
                    minLength={2}
                    maxLength={150}
                    className={inputClass}
                    placeholder="University name"
                    value={form.universityName}
                    onChange={(e) => update('universityName', e.target.value)}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Department / Discipline">
                    <input
                      maxLength={150}
                      className={inputClass}
                      placeholder="e.g. Computer Science"
                      value={form.department}
                      onChange={(e) => update('department', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold">
                Research Background
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Research Knowledge Level *">
                  <select
                    required
                    className={inputClass}
                    value={form.researchLevel}
                    onChange={(e) => update('researchLevel', e.target.value)}
                  >
                    <option value="">Select your level</option>
                    {researchLevels.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Interested in Higher Study? *">
                  <select
                    required
                    className={inputClass}
                    value={form.higherStudyInterest}
                    onChange={(e) => update('higherStudyInterest', e.target.value)}
                  >
                    <option value="">Select an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>

                {form.higherStudyInterest === 'Yes' && (
                  <div className="sm:col-span-2">
                    <Field label="Preferred Country">
                      <select
                        className={inputClass}
                        value={form.preferredCountry}
                        onChange={(e) => update('preferredCountry', e.target.value)}
                      >
                        <option value="">Select a country</option>
                        {countries.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold">
                Registration Information
              </h2>

              <div className="mt-6">
                <Field label="How did you hear about Research Ustad? *">
                  <select
                    required
                    className={inputClass}
                    value={form.registrationSource}
                    onChange={(e) => update('registrationSource', e.target.value)}
                  >
                    <option value="">Select a source</option>
                    {sources.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-xl bg-[#F5F8FB] p-5">
                <input
                  type="checkbox"
                  required
                  checked={form.consent}
                  onChange={(e) => update('consent', e.target.checked)}
                  className="mt-1 h-5 w-5 accent-[#3A5A78]"
                />

                <span className="text-sm leading-7 text-slate-700">
                  I confirm that the information provided is accurate.
                  I understand that submitting this form does not
                  confirm my enrollment. My enrollment will be subject
                  to successful payment verification and applicable
                  course requirements.
                </span>
              </label>
            </section>

            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
              <Link
                href={BASE}
                className="rounded-xl border border-slate-300 bg-white px-7 py-4 text-center font-semibold text-slate-700"
              >
                Back to Course
              </Link>

              <button
                type="submit"
                disabled={loading || !isOpen}
                className="rounded-xl bg-[#3A5A78] px-8 py-4 font-bold text-white transition hover:bg-[#2d465e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving Registration...' : 'Continue to Checkout'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
      <PayFooter />
    </main>
  );
}