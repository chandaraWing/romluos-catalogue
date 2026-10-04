'use client';

import React from 'react';
import { ShieldCheck, QrCode, Lock, Clock, Building, UserCheck } from 'lucide-react';
import { BankerInfo, BranchInfo, CompanyInfo } from './CatalogTypes';

interface BankerTrustRibbonProps {
  banker?: BankerInfo | null;
  branch?: BranchInfo | null;
  company?: CompanyInfo | null;
}

export const BankerTrustRibbon: React.FC<BankerTrustRibbonProps> = ({ banker, branch, company }) => {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
      <div className="rounded-2xl p-3.5 sm:p-5 bg-gradient-to-r from-slate-900 via-[#131B29] to-slate-900 border border-slate-800 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-4">
        {/* Banker & Verified Showroom Info */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-xs sm:text-sm tracking-tight text-white">
                Official Accredited Catalog
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] sm:text-[10px] font-extrabold uppercase border border-emerald-500/30">
                Verified
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {banker?.fullName ? (
                <>
                  Facilitated by <strong className="text-slate-200">{banker.fullName}</strong> • {branch?.name || 'Authorized Branch'}
                </>
              ) : (
                <>
                  Direct inventory connection to <strong className="text-slate-200">{branch?.name || company?.name || 'Apex Showroom'}</strong>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Value Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/80 border border-slate-700/60">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>48h Inventory Lock</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/80 border border-slate-700/60">
            <QrCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Instant QR Proposal</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/80 border border-slate-700/60">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Stock Sync</span>
          </div>
        </div>
      </div>
    </section>
  );
};
