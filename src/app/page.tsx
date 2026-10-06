'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  ArrowRight,
  Building2,
  Compass,
  Layers,
  QrCode,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState('');

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      router.push(`/${token.trim()}`);
    } else {
      router.push('/demo');
    }
  };

  const sampleBranches = [
    {
      hash: 'DEMO',
      name: 'City Center Flagship Showroom',
      code: 'CC01',
      address: 'Building 128, Preah Norodom Blvd, Phnom Penh',
      banker: 'Sokha Mean',
      bankerPhone: '+855 23 888 999',
      badge: 'Flagship Partner',
    },
    {
      hash: 'RIVERSIDE',
      name: 'Riverside Digital Showroom',
      code: 'RS02',
      address: 'Sisowath Quay, Riverfront District, Phnom Penh',
      banker: 'Dara Chan',
      bankerPhone: '+855 23 777 888',
      badge: 'Premium Experience',
    },
    {
      hash: 'AIRPORT-GATEWAY',
      name: 'Airport Gateway Tech Lounge',
      code: 'AP03',
      address: 'Russian Federation Blvd, International Gate 2',
      banker: 'Bopha Vong',
      bankerPhone: '+855 23 666 555',
      badge: 'Express Hub',
    },
  ];

  return (
    <div className="min-h-screen bg-surface text-white selection:bg-brand/30 selection:text-brand-300 font-sans relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-brand-radial-glow opacity-70 blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 bg-surface/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-accent-gradient p-0.5 shadow-lg shadow-brand/20 flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-[#080C14] rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                <span className="text-brand font-black text-base sm:text-xl leading-none">R</span>
              </div>
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5 truncate">
                ROMLUOS <span className="text-brand font-medium text-[10px] sm:text-xs">BRANCH CATALOG</span>
              </span>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">
                District Banker & Showroom Direct Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/login"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
              <span className="hidden sm:inline">Banker Sign In</span>
              <span className="sm:hidden">Login</span>
            </Link>
            <Link
              href="/DEMO"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'rounded-xl',
              })}
            >
              <span className="hidden sm:inline">Launch Demo Catalog</span>
              <span className="sm:hidden">Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Showcase */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-24 space-y-12 sm:space-y-20 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand text-[10px] sm:text-xs font-extrabold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Verified Branch Electronic Catalog
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.15] sm:leading-[1.1] break-words">
            Seamless Showroom Ordering & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand via-brand-200 to-brand-blue-400 bg-clip-text text-transparent">
              Instant Banker Financing
            </span>
          </h1>

          <p className="text-xs sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto px-2">
            Explore active branch inventory, select configurable smartphone and laptop variants, and lock in approved installment plans with certified District Bankers.
          </p>

          {/* Token Search Box */}
          <form onSubmit={handleLookup} className="pt-2 sm:pt-4 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all">
              <div className="hidden sm:block pl-3 text-slate-500">
                <Compass className="w-5 h-5 text-brand" />
              </div>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter Branch Catalog Hash (e.g. DEMO)"
                className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono"
              />
              <Button
                type="submit"
                variant="outline"
                className="px-4 sm:px-5 py-2.5 h-auto rounded-xl shrink-0"
              >
                <span>Enter Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 relative group hover:border-brand/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Full Variant Configurator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Custom-tailor storage, memory, and color specs with automatic real-time price calculations on every item.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 relative group hover:border-brand/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue-500/10 border border-brand-blue-500/20 text-brand-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">District Banker Assignment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically routes loan applications to branch-assigned District Bankers with zero manual paperwork.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 relative group hover:border-brand/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue-500/10 border border-brand-blue-500/20 text-brand-blue-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">48h QR Stock Lock</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly creates verifiable QR codes that reserve physical stock at the designated showroom floor.
            </p>
          </div>
        </div>

        {/* Available Demo Showrooms */}
        <div className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand" />
                Select a Verified Branch Showroom
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose an authorized showroom to browse live catalog inventory and financing terms.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleBranches.map((branch) => (
              <Link
                key={branch.hash}
                href={`/${branch.hash}`}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-brand/60 transition-all group flex flex-col justify-between space-y-6 relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand/10 text-brand border border-brand/20">
                      {branch.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-bold">{branch.code}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-brand transition-colors">
                      {branch.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{branch.address}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    <span className="text-[10px] block uppercase text-slate-500">Banker</span>
                    <span className="font-semibold text-slate-200">{branch.banker}</span>
                  </div>
                  <div className="flex items-center gap-1 text-brand font-bold group-hover:translate-x-1 transition-transform">
                    <span>Open Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-800/80 py-8 mt-20 text-center text-xs text-slate-500">
        <p>© 2026 Romluos Retail Financial Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
