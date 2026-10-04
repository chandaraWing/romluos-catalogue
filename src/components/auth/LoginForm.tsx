'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Phone,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  RefreshCw,
  LogOut,
  UserCheck,
  Eye,
  EyeOff,
  Briefcase,
  User,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Role } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  redirectUrl?: string;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ redirectUrl, onSuccess }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetRedirect = redirectUrl || searchParams.get('redirect') || '/DEMO';

  const {
    user,
    isAuthenticated,
    hasConsumerAuth,
    hasDistrictBankerAuth,
    activeRole,
    consumerToken,
    districtBankerToken,
    login,
    logout,
    switchRole,
    fetchUserProfile,
  } = useAuth();

  const [phone, setPhone] = useState('77323315');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginStep, setLoginStep] = useState<'idle' | 'encrypting' | 'authenticating' | 'complete'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto focus first PIN input
  useEffect(() => {
    if (!isAuthenticated && pinInputRefs[0].current) {
      // Focus if phone is already filled
      if (phone.length >= 8) {
        pinInputRefs[0].current.focus();
      }
    }
  }, [isAuthenticated]);

  const handlePinChange = (index: number, val: string) => {
    // Only accept numeric characters
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = digit;
    setPinDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance to next input
    if (digit && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (pasted) {
      const newDigits = ['', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setPinDigits(newDigits);
      if (pasted.length === 4) {
        pinInputRefs[3].current?.focus();
      } else {
        pinInputRefs[pasted.length].current?.focus();
      }
    }
  };

  const fullPin = pinDigits.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.trim().replace(/[\s\-]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('Please enter a valid Cambodian phone number (8-10 digits)');
      toast.error('Invalid phone number format');
      return;
    }

    if (fullPin.length !== 4) {
      setErrorMsg('Please enter your 4-digit security PIN');
      toast.error('4-digit PIN is required');
      pinInputRefs[fullPin.length < 4 ? fullPin.length : 0].current?.focus();
      return;
    }

    setIsSubmitting(true);
    setLoginStep('encrypting');

    try {
      await new Promise((r) => setTimeout(r, 250));
      setLoginStep('authenticating');

      const result = await login({
        phone: cleanPhone,
        pin: fullPin,
      });

      if (result.success) {
        setLoginStep('complete');
        toast.success(
          `Logged in successfully! ${
            result.districtBankerOk && result.consumerOk
              ? 'Stored District Banker & Consumer tokens.'
              : result.districtBankerOk
              ? 'District Banker token stored.'
              : 'Consumer token stored.'
          }`
        );

        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            router.push(targetRedirect);
          }, 800);
        }
      } else {
        setErrorMsg(result.message || 'Authentication failed. Please verify credentials.');
        toast.error(result.message || 'Authentication failed');
        setLoginStep('idle');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error');
      toast.error('Connection error occurred');
      setLoginStep('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickFillPreset = (presetPhone: string, presetPin: string = '1234') => {
    setPhone(presetPhone);
    const digits = presetPin.split('').slice(0, 4);
    setPinDigits([digits[0] || '', digits[1] || '', digits[2] || '', digits[3] || '']);
    setErrorMsg(null);
    pinInputRefs[3].current?.focus();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {isAuthenticated && user ? (
        // Active Authenticated State Card
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-brand-500/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{user.firstName} {user.lastName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                    Active Session
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {user.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Company & Branch Card from Profile */}
          {(user.companyName || user.branchName) && (
            <div className="p-3.5 rounded-2xl bg-brand-500/5 border border-brand-500/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand" /> Store / Branch
                </span>
                <span className="text-[10px] font-mono font-bold text-brand-700 dark:text-brand bg-brand/15 px-2 py-0.5 rounded-full border border-brand/20">
                  ID: {user.branchId || user.companyId || '47861'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {user.companyName}
              </p>
              {user.branchName && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.branchName}
                </p>
              )}
            </div>
          )}

          {/* Stored Tokens Status */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Simultaneous Dual Auth Status
              </p>
              {hasDistrictBankerAuth && (
                <button
                  type="button"
                  onClick={async () => {
                    toast.loading('Refreshing partner profile...');
                    const prof = await fetchUserProfile();
                    toast.dismiss();
                    if (prof) {
                      toast.success(`Profile refreshed: ${prof.first_name} ${prof.last_name}`);
                    } else {
                      toast.error('Could not refresh profile');
                    }
                  }}
                  className="text-[10px] text-brand hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Profile</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                    <Briefcase className="w-3.5 h-3.5 text-brand" /> Banker API
                  </span>
                  {hasDistrictBankerAuth ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <span className="text-[9px] text-slate-400">None</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Profile, Branches, QR
                </p>
                <p className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 truncate mt-1">
                  {districtBankerToken ? `...${districtBankerToken.slice(-10)}` : 'Not loaded'}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                    <User className="w-3.5 h-3.5 text-brand-blue-500" /> Consumer API
                  </span>
                  {hasConsumerAuth ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <span className="text-[9px] text-slate-400">None</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Products, Categories
                </p>
                <p className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 truncate mt-1">
                  {consumerToken ? `...${consumerToken.slice(-10)}` : 'Not loaded'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push(targetRedirect)}
              className="w-full text-sm flex items-center justify-center gap-2"
            >
              <span>Continue to Showroom Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="destructive-outline"
              size="default"
              onClick={logout}
              className="w-full text-xs flex items-center justify-center gap-2 rounded-2xl"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out & Clear Tokens</span>
            </Button>
          </div>
        </div>
      ) : (
        // Login Input Form
        <div className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-brand-500/5 backdrop-blur-xl relative overflow-hidden">
          {/* Top Accent Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent-gradient" />

          {/* Form Header */}
          <div className="space-y-2 mb-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand-700 dark:text-brand border border-brand/20 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
              <span>Unified Dual-Role Auth</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Banker & Partner Login
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your phone number & 4-digit PIN. RSA encrypted tokens will be requested for both District Banker and Consumer roles.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone Number Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-brand" /> Phone Number
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Cambodia (+855)</span>
              </label>

              <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all overflow-hidden">
                <div className="px-3.5 py-3 border-r border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 select-none">
                  <span className="text-base leading-none">🇰🇭</span>
                  <span>+855</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^0-9]/g, ''));
                    setErrorMsg(null);
                  }}
                  placeholder="77 323 315"
                  className="w-full px-3.5 py-3 bg-transparent text-slate-900 dark:text-white text-sm font-medium tracking-wide focus:outline-none placeholder:text-slate-400"
                  disabled={isSubmitting}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* 4-Digit PIN Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-brand" /> 4-Digit Security PIN
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                  {showPin ? (
                    <>
                      <EyeOff className="w-3 h-3" /> Hide PIN
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" /> Show PIN
                    </>
                  )}
                </button>
              </div>

              {/* 4 Digit Boxes */}
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3" onPaste={handlePinPaste}>
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={pinInputRefs[idx]}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    disabled={isSubmitting}
                    className="w-full h-14 text-center text-xl font-bold bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all shadow-inner"
                  />
                ))}
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-tight">{errorMsg}</p>
              </div>
            )}

            {/* Encryption & Role Info Pills */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-brand" /> Security Protocol
                </span>
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
                  RSA-2048 PKCS1 / AES
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Dual Role Tokens:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Consumer + District Banker
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full text-sm shadow-md"
            >
              {isSubmitting ? (
                <span>
                  {loginStep === 'encrypting'
                    ? 'Encrypting Credentials...'
                    : loginStep === 'authenticating'
                    ? 'Authenticating Both Roles...'
                    : 'Finalizing Session...'}
                </span>
              ) : (
                <>
                  <span>Sign In & Store Tokens</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Preset Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFillPreset('77323315', '1234')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand/50 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
              >
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block group-hover:text-brand">
                  +855 77 323 315
                </span>
                <span className="text-[10px] text-slate-400">Sample Consumer</span>
              </button>

              <button
                type="button"
                onClick={() => quickFillPreset('12221122', '1234')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand/50 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
              >
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block group-hover:text-brand">
                  +855 12 221 122
                </span>
                <span className="text-[10px] text-slate-400">Sample District Banker</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
