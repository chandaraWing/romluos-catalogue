'use client';

import React from 'react';
import Link from 'next/link';
import { CompanyInfo, BranchInfo, BankerInfo } from './CatalogTypes';
import { ShieldCheck, MapPin, Phone, Mail, QrCode } from 'lucide-react';

interface CatalogFooterProps {
  company?: CompanyInfo | null;
  branch?: BranchInfo | null;
  banker?: BankerInfo | null;
  hash?: string;
}

export const CatalogFooter: React.FC<CatalogFooterProps> = ({ company, branch, banker, hash }) => {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#070b14]/50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company and Branch Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-sm flex items-center justify-center overflow-hidden">
                <img
                  src={company?.logo || 'https://d13jxrd8otm92m.cloudfront.net/raw/consumer/USR-260370000450013/profile/RES-262730080811559.png'}
                  alt={company?.name || 'Company Logo'}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                {company?.name || 'Romluos Platform'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Official retail branch catalog. High-performance electronics with live stock reservations and accredited financing.
            </p>
            {branch && (
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-brand" />
                <span>{branch.name} {branch.address ? `• ${branch.address}` : ''}</span>
              </div>
            )}
          </div>

          {/* Banker Accreditation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              District Banker Representation
            </h4>
            {banker ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">{banker.fullName}</div>
                <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{banker.email}</span>
                </div>
                {banker.phone && (
                  <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{banker.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct branch financing available upon cart checkout.
              </p>
            )}
          </div>

          {/* Security & Verification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Inventory & Financing Security
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <p>• Atomic 48-hour physical inventory lock on proposal generation</p>
              <p>• SHA-256 verifiable QR code loan packages</p>
              <p>• Genuine manufacturer warranty & verified serial tracking</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} Romluos. All rights reserved.
          </div>
          {hash && (
            <div className="font-mono text-[10px] text-slate-500">
              Link Token: {hash}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
