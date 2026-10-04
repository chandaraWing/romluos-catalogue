'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, ShieldCheck, Sparkles, KeyRound, Lock, CheckCircle2, QrCode } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface text-white selection:bg-brand/30 selection:text-brand-300 font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-brand-radial-glow opacity-80 blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 bg-surface/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-accent-gradient p-0.5 shadow-lg shadow-brand/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070B14] rounded-[14px] flex items-center justify-center">
                <span className="text-brand font-black text-xl leading-none">R</span>
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                ROMLUS <span className="text-brand font-medium text-xs">CATALOG</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">
                District Banker & Showroom Portal
              </p>
            </div>
          </Link>

          <Link
            href="/DEMO"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Showroom Catalog</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Feature Highlights & Security Explanation */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 text-brand border border-brand/20 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Single Sign-On • Dual Role Integration</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Secure Financing & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-200 to-brand-blue-400">
                  Banker Portal Access
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
                Authenticate once with your phone number and 4-digit PIN to acquire encrypted session tokens for both <strong>District Banker</strong> and <strong>Consumer</strong> roles simultaneously.
              </p>
            </div>

            {/* Architecture Highlights */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-brand-blue-500/10 border border-brand-blue-500/20 text-brand-blue-400 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">
                    RSA-2048 & AES-CBC Encryption
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Your 4-digit PIN and partner client secrets are encrypted using public key cryptography before reaching the identity server.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">
                    Real-time QR Financing & Term Customization
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    District Bankers can adjust tenure, interest rates, down payments, and generate live QR financing codes for in-store customers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-brand-blue-500/10 border border-brand-blue-500/20 text-brand-blue-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">
                    Dual Session Persistence
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Both tokens (<code className="text-brand font-mono">district_banker</code> and <code className="text-brand-blue-400 font-mono">consumer</code>) are safely cached for seamless branch workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="lg:col-span-6 flex justify-center">
            <Suspense fallback={<div className="text-slate-400 text-sm">Loading authentication form...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 relative z-10 bg-[#070B14]/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Romlus Branch Catalog. All rights reserved.</p>
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
