// path: frontend/src/components/AdminGuard.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentAdmin, type AdminInfo } from '@/lib/adminApi';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side guard that verifies the admin session by calling
 * GET /api/admin/me. If unauthorized, redirects to /admin/login.
 * This complements the edge middleware (which only checks cookie presence).
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    getCurrentAdmin()
      .then((data) => {
        if (!mounted) return;
        setAdmin(data.admin);
        setChecking(false);
      })
      .catch(() => {
        if (!mounted) return;
        router.replace('/admin/login');
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="mt-4 text-sm text-ink-500">
            Verifying admin session...
          </p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return <>{children}</>;
}