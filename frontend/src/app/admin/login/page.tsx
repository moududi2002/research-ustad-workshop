'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiMail, FiLock, FiLoader, FiArrowLeft } from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { adminLogin } from '@/lib/adminApi';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ১. মূল লজিক এবং ফর্মটিকে আলাদা একটি কম্পোনেন্টে রাখা হলো
function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/admin';
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setSubmitting(true);
      await adminLogin(data.email, data.password);
      toast.success('Welcome back!');
      router.replace(redirectTo);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Login failed. Please check your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition-colors hover:text-primary-600"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Workshop Home
      </Link>

      <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <HiOutlineAcademicCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">
            Admin Login
          </h1>
          <p className="mt-1 text-sm text-primary-100">
            Research Ustad Workshop Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-8">
          <div>
            <label className="label-field" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@researchustad.org"
                className="input-field !pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="error-text">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label-field" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="input-field !pl-10"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="error-text">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full !py-3.5"
          >
            {submitting ? (
              <>
                <FiLoader className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-center text-xs text-ink-400">
            Authorized personnel only. All login attempts are logged.
          </p>
        </form>
      </div>
    </div>
  );
}

// ২. মূল পেজ এক্সপোর্টে Suspense ব্যবহার করা হলো
export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-12">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center gap-2">
            <FiLoader className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-sm font-medium text-ink-500">Loading...</p>
          </div>
        }
      >
        <AdminLoginContent />
      </Suspense>
    </main>
  );
}