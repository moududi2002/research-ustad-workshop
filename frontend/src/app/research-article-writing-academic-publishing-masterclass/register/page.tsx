// frontend/src/app/research-article-writing-academic-publishing-masterclass/register/page.tsx

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  HiOutlineAcademicCap,
  HiOutlineUser,
  HiOutlineGlobeAlt,
  HiOutlineBookOpen,
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

import {
  registrationSchema,
  RegistrationSchemaType,
} from '@/lib/validation';

import PayFooter from '@/components/PayFooter';
import Footer from '@/components/Footer';
import Image from 'next/image';

const SLUG =
  '/research-article-writing-academic-publishing-masterclass';

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

const countries = [
  'United States', 'United Kingdom', 'Canada',
  'Australia', 'Germany', 'Netherlands', 'Sweden',
  'Norway', 'Finland', 'Denmark', 'Japan',
  'South Korea', 'China', 'Singapore', 'Malaysia',
  'Saudi Arabia', 'UAE', 'Other',
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

function FormCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

export default function CourseRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [resumeEmail, setResumeEmail] = useState('');
  const [resumeOtp, setResumeOtp] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationSchemaType>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      consent: false,
      department: '',
      preferredCountry: '',
    },
  });

  const higherStudy = watch('higherStudyInterest');

  async function requestResumeOtp(emailInput: string) {
    const email = emailInput.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid registered email address');
      return;
    }

    setResumeLoading(true);

    try {
      const response = await fetch('/api/course/resume-request', {
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
      const response = await fetch('/api/course/resume-verify', {
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

      // Server has now set a new HttpOnly session cookie.
      toast.success('Registration session restored');

      router.replace(`${SLUG}/checkout`);
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

  async function onSubmit(data: RegistrationSchemaType) {
    setLoading(true);

    try {
      const response = await fetch('/api/course/register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({}));

      // Existing email: do not create another registration.
      // Verify ownership by sending OTP.
      if (response.status === 409) {
        await requestResumeOtp(data.email);
        return;
      }

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(', ')
            : result.message || 'Registration could not be saved',
        );
      }

      // The successful register response includes Set-Cookie.
      // Browser stores it before navigation.
      toast.success(
        'Information saved successfully. Review your registration.',
      );

      router.push(`${SLUG}/checkout`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Registration could not be saved',
      );
    } finally {
      setLoading(false);
    }
  }

  const textField = (name: keyof RegistrationSchemaType) => (
    <p className="mt-1 text-xs font-medium text-red-600">
      {errors[name]?.message?.toString()}
    </p>
  );

  if (resumeEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-12">
        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl">
          <div className="bg-indigo-700 px-8 py-10 text-center text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              <HiOutlineShieldCheck className="h-9 w-9" />
            </div>

            <p className="mt-5 text-sm font-medium uppercase tracking-widest text-indigo-200">
              Research Ustad · Course 01
            </p>

            <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
              Resume Your Registration
            </h1>

            <p className="mt-3 text-sm leading-7 text-indigo-100">
              This email has an existing registration.
              Verify your identity to securely continue.
            </p>
          </div>

          <div className="space-y-6 p-7 sm:p-9">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Verification Email
              </p>

              <p className="mt-2 break-all font-bold text-indigo-950">
                {resumeEmail}
              </p>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                Enter the six-digit code sent to your inbox.
                The code expires after 10 minutes.
              </p>
            </div>

            <div>
              <label
                htmlFor="courseResumeOtp"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Six-Digit Verification Code
              </label>

              <input
                id="courseResumeOtp"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-center text-2xl font-bold tracking-[0.5em] text-indigo-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <button
              type="button"
              onClick={() => void verifyResumeOtp()}
              disabled={resumeLoading || resumeOtp.length !== 6}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-6 py-4 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {resumeLoading
                ? 'Verifying...'
                : 'Verify & Continue to Preview'}

              {!resumeLoading && (
                <HiOutlineArrowRight className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              disabled={resumeLoading}
              onClick={() => void requestResumeOtp(resumeEmail)}
              className="w-full text-center text-sm font-semibold text-indigo-600 hover:underline disabled:opacity-50"
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
                className="text-sm font-medium text-slate-500 hover:text-indigo-600"
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
    <main className="min-h-screen bg-[#f5f7fc] text-slate-900">
      <header className="border-b bg-white">
        <div className="container-custom flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg">
              <Image
                src="/images/RU_logo.png"
                alt="logo"
                width={100}
                height={100}
              />
            </div>

            <div>
              <p className="font-display text-lg font-bold">
                Research Ustad
              </p>
              <p className="text-xs text-indigo-600">
                COURSE REGISTRATION
              </p>
            </div>
          </Link>

          <Link href={SLUG} className="text-sm font-semibold text-indigo-600">
            Course Details
          </Link>
        </div>
      </header>

      <div className="container-custom py-12">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
            Course 01 · Step 1 of 3
          </p>

          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            Course Registration
          </h1>

          <p className="mt-4 max-w-2xl text-slate-500">
            Complete your academic profile to begin enrollment in
            Research Article Writing & Academic Publishing Masterclass.
            Submitting this form does not confirm enrollment.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-12">
          <aside className="lg:sticky lg:top-8 lg:col-span-4">
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md">
              <div className="bg-indigo-950 p-7 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Your Selected Course
                </p>

                <h2 className="mt-4 text-xl font-extrabold leading-7">
                  Research Article Writing & Academic Publishing Masterclass
                </h2>

                <p className="mt-3 text-sm text-indigo-200">
                  24 Live Classes · 8 Modules · Practical Training
                </p>
              </div>

              <div className="p-7">
                <p className="text-sm text-slate-500">
                  Special Enrollment Fee
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <span className="text-xl text-slate-400 line-through">
                    ৳5,000
                  </span>
                  <span className="text-4xl font-extrabold">
                    ৳3,000
                  </span>
                </div>

                <span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  40% Discount
                </span>

                <div className="mt-7 space-y-3 border-t border-slate-100 pt-6">
                  {[
                    'Complete your registration information',
                    'Review your submitted details',
                    'Pay securely through PayStation',
                    'Accept terms and confirm enrollment',
                  ].map((text, i) => (
                    <div key={text} className="flex gap-3 text-sm">
                      <span className="font-bold text-indigo-600">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-slate-600">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-start gap-2 rounded-xl bg-indigo-50 p-4 text-xs leading-6 text-indigo-800">
                  <HiOutlineShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  Your enrollment will only become confirmed after
                  successful payment verification.
                </div>
              </div>
            </div>
          </aside>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 lg:col-span-8"
          >
            <FormCard
              title="Personal Information"
              subtitle="Provide your contact information accurately."
              icon={<HiOutlineUser className="h-6 w-6" />}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label-field">Full Name *</label>
                  <input
                    {...register('fullName')}
                    className="input-field"
                    placeholder="Your full name"
                  />
                  {textField('fullName')}
                </div>

                <div>
                  <label className="label-field">Email Address *</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                  {textField('email')}
                </div>

                <div>
                  <label className="label-field">WhatsApp Number *</label>
                  <input
                    type="tel"
                    {...register('whatsapp')}
                    className="input-field"
                    placeholder="01XXXXXXXXX"
                  />
                  {textField('whatsapp')}
                  <p className="mt-2 text-xs text-slate-500">
                    Use an active Bangladesh mobile number to receive
                    the confirmation SMS.
                  </p>
                </div>
              </div>
            </FormCard>

            <FormCard
              title="Academic Information"
              subtitle="Tell us about your educational background."
              icon={<HiOutlineAcademicCap className="h-6 w-6" />}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label-field">Academic Status *</label>
                  <select
                    className="input-field"
                    defaultValue=""
                    {...register('academicStatus')}
                  >
                    <option value="" disabled>Select status</option>
                    {academicStatuses.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  {textField('academicStatus')}
                </div>

                <div>
                  <label className="label-field">University Name *</label>
                  <input
                    {...register('universityName')}
                    className="input-field"
                    placeholder="University / Institution"
                  />
                  {textField('universityName')}
                </div>

                <div className="sm:col-span-2">
                  <label className="label-field">
                    Department / Discipline
                  </label>
                  <input
                    {...register('department')}
                    className="input-field"
                    placeholder="e.g. Computer Science"
                  />
                  {textField('department')}
                </div>
              </div>
            </FormCard>

            <FormCard
              title="Research Background"
              subtitle="Help us understand your research experience."
              icon={<HiOutlineBookOpen className="h-6 w-6" />}
            >
              <label className="label-field">
                Research Knowledge Level *
              </label>

              <select
                className="input-field"
                defaultValue=""
                {...register('researchLevel')}
              >
                <option value="" disabled>Select your level</option>
                {researchLevels.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              {textField('researchLevel')}
            </FormCard>

            <FormCard
              title="Higher Study Information"
              subtitle="Share your higher education interests."
              icon={<HiOutlineGlobeAlt className="h-6 w-6" />}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label-field">
                    Interested in Higher Study? *
                  </label>

                  <select
                    className="input-field"
                    defaultValue=""
                    {...register('higherStudyInterest')}
                  >
                    <option value="" disabled>Select an option</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                  {textField('higherStudyInterest')}
                </div>

                {higherStudy === 'Yes' && (
                  <div>
                    <label className="label-field">
                      Preferred Country *
                    </label>

                    <select
                      className="input-field"
                      defaultValue=""
                      {...register('preferredCountry')}
                    >
                      <option value="" disabled>Select country</option>
                      {countries.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>

                    {textField('preferredCountry')}
                  </div>
                )}
              </div>
            </FormCard>

            <FormCard
              title="How Did You Hear About Us?"
              subtitle="Let us know how you discovered Research Ustad."
              icon={<HiOutlineGlobeAlt className="h-6 w-6" />}
            >
              <label className="label-field">
                Registration Source *
              </label>

              <select
                className="input-field"
                defaultValue=""
                {...register('registrationSource')}
              >
                <option value="" disabled>Select source</option>
                {sources.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>

              {textField('registrationSource')}
            </FormCard>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0 accent-indigo-600"
                  {...register('consent')}
                />

                <span className="text-sm leading-7 text-slate-700">
                  I consent to Research Ustad securely processing
                  my submitted information for course enrollment,
                  payment verification, learning communications,
                  and related administrative purposes.
                  <span className="text-red-600"> *</span>
                </span>
              </label>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                For enrollment support and security, we record basic
                device information, including device type, browser,
                operating system and a masked network address.

                {' '}We do not collect a precise location or
                unique hardware fingerprint.
              </p>

              {errors.consent && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.consent.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-2 py-2 text-lg font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading
                ? 'Saving Your Information...'
                : 'Continue to Registration Preview'}

              {!loading && (
                <HiOutlineArrowRight className="h-6 w-6" />
              )}
            </button>

            <p className="text-center text-xs text-slate-500">
              No payment will be charged when submitting this form.
            </p>
          </form>
        </div>
      </div>
      <Footer />
      <PayFooter />
    </main>
  );
}