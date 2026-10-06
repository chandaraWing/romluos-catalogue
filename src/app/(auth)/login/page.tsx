'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen text-white selection:bg-brand/30 selection:text-brand-300 font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-brand-radial-glow opacity-80 blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md sticky top-0 z-40 bg-white/70 dark:bg-[#070B14]/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-16 h-20 p-1 transition-transform flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src="https://d13jxrd8otm92m.cloudfront.net/raw/consumer/USR-260370000450013/profile/RES-262730080811559.png"
                alt="Brand Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                ROMLUOS <span className="text-brand font-medium text-xs">CATALOGUE</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                District Banker & Showroom Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Showroom Catalogue</span>
            </Link>

            {/* Dark / Light Mode Toggle */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Toggle Dark/Light Mode"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10 w-full">
        <div className="lg:col-span-6 flex justify-center">
          <Suspense fallback={<div className="text-slate-400 text-sm">Loading authentication form...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 relative z-10 bg-[#070B14]/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Romluos Branch Catalog. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Identity API: WingMall QA Gateway
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
