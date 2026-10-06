'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function CatalogProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted && !isAuthenticated) {
      const redirectUrl =
        pathname && pathname !== '/' ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login';
      
      router.replace(redirectUrl);

      // Fallback redirect in case client router is blocked/delayed
      const timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.replace(redirectUrl);
        }
      }, 400);

      return () => clearTimeout(timeoutId);
    }
  }, [loading, mounted, isAuthenticated, router, pathname]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-[#FDFEFE] dark:bg-[#0B0F17] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 animate-pulse">
          Authenticating catalogue access...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFEFE] dark:bg-[#0B0F17] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 animate-pulse">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
