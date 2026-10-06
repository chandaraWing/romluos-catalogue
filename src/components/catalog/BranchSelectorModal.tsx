'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { BranchItem, PartnerBusinessItem } from '@/types';
import {
  CheckCircle2,
  ChevronDown,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Store,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { BranchInfo, CompanyInfo } from './CatalogTypes';
import { CompanySelector } from './CompanySelectorModal';

interface BranchSelectorProps {
  currentBranch?: BranchInfo | null;
  company?: CompanyInfo | null;
  onSelectBranch?: (branch: BranchItem) => void;
  onSelectCompany?: (company: PartnerBusinessItem) => void;
  onSelectCompanyAndBranch?: (company: PartnerBusinessItem, branch: BranchItem) => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  currentBranch,
  company,
  onSelectBranch,
  onSelectCompany,
  onSelectCompanyAndBranch,
}) => {
  const { user, districtBankerToken, partnerProfile, switchBranch, fetchBranches } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const companyId =
    String(company?.id || '') ||
    partnerProfile?.default_company?.id ||
    user?.companyId ||
    '';

  // Fetch branches for company using District Banker token
  useEffect(() => {
    let isMounted = true;
    const loadBranches = async () => {
      setLoading(true);
      try {
        const branchList = await fetchBranches(companyId);
        if (isMounted) {
          setBranches(branchList);
        }
      } catch (err) {
        console.warn('Failed to load branches:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (companyId) {
      loadBranches();
    }
    return () => {
      isMounted = false;
    };
  }, [companyId, fetchBranches, districtBankerToken]);

  const activeBranchId =
    user?.branchId ||
    partnerProfile?.default_company?.default_branch?.id ||
    String(currentBranch?.id || '');

  const selectedBranchName =
    user?.branchName ||
    currentBranch?.name ||
    branches.find((b) => String(b.id) === String(activeBranchId))?.name ||
    'Select Branch';

  const handleSelect = (b: BranchItem) => {
    if (switchBranch) {
      switchBranch(b);
    }
    if (onSelectBranch) {
      onSelectBranch(b);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('romluos_selected_branch', JSON.stringify(b));
    }
    toast.success(`Active branch switched to ${b.name}`);
    setIsOpen(false);
  };

  const filteredBranches = branches.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.code?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative flex items-center gap-1.5 sm:gap-2">
      {/* Interactive Company Selector Dropdown / Modal */}
      <CompanySelector
        currentCompany={company}
        onSelectCompany={onSelectCompany}
        onSelectCompanyAndBranch={onSelectCompanyAndBranch}
      />

      {/* Switch Branch Trigger Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="group h-auto flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-brand/10 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand/50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-sm cursor-pointer"
        title="Click to switch showroom branch"
      >
        <div className="w-5 h-5 rounded-lg bg-brand/15 text-brand flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <MapPin className="w-3 h-3 text-brand" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal leading-none hidden md:block">
            Branch Location
          </span>
          <span className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-white truncate max-w-[70px] xs:max-w-[120px] sm:max-w-[180px] leading-tight">
            {selectedBranchName}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 group-hover:text-brand transition-transform duration-200 flex-shrink-0" />
      </Button>

      {/* Modal / Dialog Overlay */}
      {isOpen && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full max-w-lg bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 relative flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/10 text-brand dark:text-brand-300 text-[10px] font-bold">
                      <Store className="w-3 h-3" />
                      <span>Company ID: {companyId}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Select Showroom Branch
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Switch between verified partner branch locations to view real-time localized stock and banker financing terms.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="mt-4 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search branch by name, code, or area..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Branch List Items */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100 dark:divide-slate-800/40">
                {loading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading branch catalog...
                  </div>
                ) : filteredBranches.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                    <MapPin className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No branches found
                    </p>
                    <p className="text-[11px]">Try adjusting your search criteria.</p>
                  </div>
                ) : (
                  filteredBranches.map((b) => {
                    const isSelected = String(b.id) === String(activeBranchId);
                    return (
                      <div
                        key={b.id}
                        onClick={() => handleSelect(b)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-brand bg-brand/5 shadow-sm'
                            : 'border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{b.name}</span>
                              {isSelected && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand text-slate-950 font-black tracking-wide uppercase">
                                  Current
                                </span>
                              )}
                            </h4>
                            {b.code && (
                              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {b.code}
                              </span>
                            )}
                          </div>

                          {b.address && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-1">
                              <MapPin className="w-3 h-3 text-brand flex-shrink-0 mt-0.5" />
                              <span>{b.address}</span>
                            </p>
                          )}

                          {b.phone && (
                            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              <span>{b.phone}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end justify-between self-stretch">
                          {isSelected ? (
                            <div className="w-7 h-7 rounded-full bg-brand text-slate-950 flex items-center justify-center shadow-md">
                              <CheckCircle2 className="w-4 h-4 font-black" />
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-auto text-[11px] font-bold text-brand hover:underline px-2 py-1 rounded-lg hover:bg-brand/10 transition-colors"
                            >
                              Switch
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Branch Inventory</span>
                </span>
                <span>{filteredBranches.length} locations available</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
