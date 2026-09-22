//frontend/src/components/RegistrationForm.tsx.
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiChevronDown, FiLoader } from 'react-icons/fi';
import {
  HiOutlineUser,
  HiOutlineAcademicCap,
  HiOutlineBeaker,
  HiOutlineGlobeAlt,
  HiOutlineMegaphone,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { registrationSchema, type RegistrationSchemaType } from '@/lib/validation';
import { submitRegistration } from '@/lib/api';

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

const registrationSources = [
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

export default function RegistrationForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationSchemaType>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      higherStudyInterest: 'No',
    },
  });

  const higherStudyInterest = watch('higherStudyInterest');

  const onSubmit = async (data: RegistrationSchemaType) => {
    try {
      setSubmitting(true);
      const response = await submitRegistration(data);
      toast.success('Registration successful!');
      router.push(`/success?id=${response.registrationId}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Registration failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Personal Information */}
      <FormSection
        icon={<HiOutlineUser className="h-5 w-5" />}
        title="Personal Information"
        subtitle="We'll use this to contact you about the workshop."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label-field" htmlFor="fullName">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              className="input-field"
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="error-text">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="label-field" htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="input-field"
              {...register('email')}
            />
            {errors.email && (
              <p className="error-text">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label-field" htmlFor="whatsapp">
              WhatsApp Number <span className="text-red-500">*</span>
            </label>
            <input
              id="whatsapp"
              type="tel"
              placeholder="+880 1XXX XXXXXX"
              className="input-field"
              {...register('whatsapp')}
            />
            {errors.whatsapp && (
              <p className="error-text">{errors.whatsapp.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Academic Information */}
      <FormSection
        icon={<HiOutlineAcademicCap className="h-5 w-5" />}
        title="Academic Information"
        subtitle="Tell us about your current academic status."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="academicStatus">
              Academic Status <span className="text-red-500">*</span>
            </label>
            <SelectField
              id="academicStatus"
              options={academicStatuses}
              register={register('academicStatus')}
              error={errors.academicStatus?.message}
            />
          </div>

          <div>
            <label className="label-field" htmlFor="universityName">
              University Name <span className="text-red-500">*</span>
            </label>
            <input
              id="universityName"
              type="text"
              placeholder="e.g., University of Dhaka"
              className="input-field"
              {...register('universityName')}
            />
            {errors.universityName && (
              <p className="error-text">{errors.universityName.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="label-field" htmlFor="department">
              Department / Discipline{' '}
              <span className="text-ink-400">(Optional)</span>
            </label>
            <input
              id="department"
              type="text"
              placeholder="e.g., Computer Science"
              className="input-field"
              {...register('department')}
            />
            {errors.department && (
              <p className="error-text">{errors.department.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Research Background */}
      <FormSection
        icon={<HiOutlineBeaker className="h-5 w-5" />}
        title="Research Background"
        subtitle="Help us tailor the workshop to your level."
      >
        <div>
          <label className="label-field" htmlFor="researchLevel">
            Research Knowledge Level <span className="text-red-500">*</span>
          </label>
          <SelectField
            id="researchLevel"
            options={researchLevels}
            register={register('researchLevel')}
            error={errors.researchLevel?.message}
          />
        </div>
      </FormSection>

      {/* Higher Study Information */}
      <FormSection
        icon={<HiOutlineGlobeAlt className="h-5 w-5" />}
        title="Higher Study Information"
        subtitle="Are you planning to pursue higher studies abroad?"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label-field">
              Higher Study Interest <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {['Yes', 'No'].map((option) => (
                <label
                  key={option}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    higherStudyInterest === option
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={option}
                    className="sr-only"
                    {...register('higherStudyInterest')}
                  />
                  {higherStudyInterest === option && (
                    <HiOutlineCheckCircle className="h-4 w-4" />
                  )}
                  {option}
                </label>
              ))}
            </div>
            {errors.higherStudyInterest && (
              <p className="error-text">{errors.higherStudyInterest.message}</p>
            )}
          </div>

          {higherStudyInterest === 'Yes' && (
            <div>
              <label className="label-field" htmlFor="preferredCountry">
                Preferred Country for Higher Study{' '}
                <span className="text-red-500">*</span>
              </label>
              <SelectField
                id="preferredCountry"
                options={countries}
                placeholder="Select a country"
                register={register('preferredCountry')}
                error={errors.preferredCountry?.message}
              />
            </div>
          )}
        </div>
      </FormSection>

      {/* Registration Source */}
      <FormSection
        icon={<HiOutlineMegaphone className="h-5 w-5" />}
        title="Registration Source"
        subtitle="How did you hear about this workshop?"
      >
        <div>
          <label className="label-field" htmlFor="registrationSource">
            Select Source <span className="text-red-500">*</span>
          </label>
          <SelectField
            id="registrationSource"
            options={registrationSources}
            placeholder="Choose an option"
            register={register('registrationSource')}
            error={errors.registrationSource?.message}
          />
        </div>
      </FormSection>

      {/* Consent */}
      <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-ink-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
            {...register('consent')}
          />
          <span className="text-sm leading-relaxed text-ink-700">
            I agree that my submitted information may be used for workshop
            communication, participant analysis, certificate preparation, and
            sharing relevant future opportunities from Research Ustad.{' '}
            <span className="font-semibold text-red-500">*</span>
          </span>
        </label>
        {errors.consent && (
          <p className="error-text ml-7">{errors.consent.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full !py-4 !text-base"
      >
        {submitting ? (
          <>
            <FiLoader className="h-5 w-5 animate-spin" />
            Registering...
          </>
        ) : (
          'Register for Free'
        )}
      </button>
    </form>
  );
}

function FormSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-7">
      <div className="mb-6 flex items-start gap-3 border-b border-ink-100 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          {icon}
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-ink-950">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SelectField({
  id,
  options,
  placeholder = 'Select an option',
  register,
  error,
}: {
  id: string;
  options: string[];
  placeholder?: string;
  register: any;
  error?: string;
}) {
  return (
    <>
      <div className="relative">
        <select
          id={id}
          defaultValue=""
          className="input-field appearance-none pr-10"
          {...register}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      </div>
      {error && <p className="error-text">{error}</p>}
    </>
  );
}