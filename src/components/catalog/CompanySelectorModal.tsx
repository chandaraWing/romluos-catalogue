'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { formatImageUrl, getPreferredLocaleName } from '@/lib/utils';
import { BranchItem, PartnerBusinessItem } from '@/types';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  ChevronDown,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  X
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { CompanyInfo } from './CatalogTypes';

interface CompanySelectorProps {
  currentCompany?: CompanyInfo | null;
  onSelectCompanyAndBranch?: (company: PartnerBusinessItem, branch: BranchItem) => void;
  onSelectCompany?: (company: PartnerBusinessItem) => void;
  className?: string;
  variant?: 'header' | 'dropdown';
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  currentCompany,
  onSelectCompanyAndBranch,
  onSelectCompany,
  className = '',
  variant = 'header',
}) => {
  const {
    user,
    businesses,
    selectedBusiness,
    switchCompanyAndBranch,
    fetchBusinesses,
    fetchBranches,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'company' | 'branch'>('company');
  const [candidateCompany, setCandidateCompany] = useState<PartnerBusinessItem | null>(null);
  const [candidateBranches, setCandidateBranches] = useState<BranchItem[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeCompanyId =
    selectedBusiness?.id ||
    user?.companyId ||
    (currentCompany?.id ? String(currentCompany.id) : '');

  const activeCompanyName =
    (selectedBusiness?.name_locales && getPreferredLocaleName(selectedBusiness.name_locales)) ||
    selectedBusiness?.name ||
    user?.companyName ||
    currentCompany?.name ||
    'Select Company';

  const activeLogoUrl = formatImageUrl(
    selectedBusiness?.logo?.file_url || currentCompany?.logo
  );

  const openModal = () => {
    setStep('company');
    setCandidateCompany(null);
    setCandidateBranches([]);
    setSearchQuery('');
    setIsOpen(true);
  };

  const handleCandidateCompanySelect = async (business: PartnerBusinessItem) => {
    setCandidateCompany(business);
    setSearchQuery('');
    setStep('branch');
    setLoadingBranches(true);

    try {
      const branchesList = await fetchBranches(business.id);
      setCandidateBranches(branchesList || []);
    } catch (err) {
      console.error('Failed to load branches for candidate company:', err);
      toast.error('Failed to load branches for this company');
      setCandidateBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleBranchSelect = async (branch: BranchItem) => {
    if (!candidateCompany) return;

    try {
      await switchCompanyAndBranch(candidateCompany, branch);
      if (onSelectCompanyAndBranch) {
        onSelectCompanyAndBranch(candidateCompany, branch);
      } else if (onSelectCompany) {
        onSelectCompany(candidateCompany);
      }

      const bizName =
        getPreferredLocaleName(candidateCompany.name_locales) ||
        candidateCompany.name ||
        `Business ${candidateCompany.id}`;

      toast.success(`Active company switched to ${bizName} (${branch.name})`);
      setIsOpen(false);
      setStep('company');
      setCandidateCompany(null);
    } catch (err) {
      console.error('Failed to commit company and branch:', err);
      toast.error('Failed to switch company and branch');
    }
  };

  const handleCancelOrClose = () => {
    if (step === 'branch' && candidateCompany) {
      toast.info('Company switch cancelled. Current company remains active.');
    }
    setIsOpen(false);
    setStep('company');
    setCandidateCompany(null);
    setCandidateBranches([]);
  };

  const handleManualRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    try {
      await fetchBusinesses();
      toast.success('Company listing updated');
    } catch {
      toast.error('Failed to refresh businesses');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredBusinesses = useMemo(() => {
    if (!searchQuery.trim()) return businesses;
    const q = searchQuery.toLowerCase().trim();
    return businesses.filter((b) => {
      const idMatch = String(b.id).toLowerCase().includes(q);
      const nameMatches = b.name_locales?.some((l) =>
        l.name?.toLowerCase().includes(q)
      );
      const primaryNameMatch = b.name?.toLowerCase().includes(q);
      return idMatch || nameMatches || primaryNameMatch;
    });
  }, [businesses, searchQuery]);

  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return candidateBranches;
    const q = searchQuery.toLowerCase().trim();
    return candidateBranches.filter((b) => {
      const nameMatch = b.name?.toLowerCase().includes(q);
      const codeMatch = b.code?.toLowerCase().includes(q);
      const addressMatch = b.address?.toLowerCase().includes(q);
      return nameMatch || codeMatch || addressMatch;
    });
  }, [candidateBranches, searchQuery]);

  return (
    <div className={`relative flex items-center ${variant === 'dropdown' ? 'w-full' : ''} ${className}`}>
      {/* Interactive Trigger Button */}
      {variant === 'dropdown' ? (
        <Button
          type="button"
          variant="ghost"
          onClick={openModal}
          className="w-full justify-between h-auto flex items-center px-3 py-2 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-brand-blue/10 dark:hover:bg-brand-blue/20 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-blue/50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-2xs cursor-pointer group"
          title="Click to switch merchant business company"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {activeLogoUrl ? (
              <img
                src={activeLogoUrl}
                alt={activeCompanyName}
                className="w-6 h-6 rounded-lg object-contain bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-700/50 shrink-0 p-0.5"
              />
            ) : (
              <div className="w-6 h-6 rounded-lg bg-brand-blue/15 text-brand-blue-500 dark:text-brand-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            )}

            <div className="flex flex-col text-left min-w-0">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                Merchant Business
              </span>
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-[210px] leading-tight">
                {activeCompanyName}
              </span>
            </div>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-blue transition-transform duration-200 shrink-0 ml-1" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={openModal}
          className="group h-auto flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-brand-blue/10 dark:hover:bg-brand-blue/20 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-blue/50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-sm cursor-pointer"
          title="Click to switch merchant business company"
        >
          {activeLogoUrl ? (
            <img
              src={activeLogoUrl}
              alt={activeCompanyName}
              className="w-5 h-5 rounded-lg object-contain bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 shrink-0 p-0.5"
            />
          ) : (
            <div className="w-5 h-5 rounded-lg bg-brand-blue/15 text-brand-blue-500 dark:text-brand-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Building2 className="w-3 h-3" />
            </div>
          )}

          <div className="flex flex-col text-left">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal leading-none hidden lg:block">
              Merchant
            </span>
            <span className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-white truncate max-w-[85px] xs:max-w-[110px] md:max-w-[130px] lg:max-w-[150px] leading-tight">
              {activeCompanyName}
            </span>
          </div>

          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-brand-blue transition-transform duration-200 shrink-0" />
        </Button>
      )}

      {/* Enforced 2-Step Modal Dialog Overlay */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            data-portal-modal="true"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
            onClick={handleCancelOrClose}
          >
            <div
              className="w-full max-w-xl bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh] my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* STEP 1: COMPANY SELECTION */}
              {step === 'company' && (
                <>
                  {/* Modal Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 relative shrink-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue-600 dark:text-brand-blue-400 text-[10px] font-bold">
                          <Sparkles className="w-3 h-3" />
                          <span>Step 1 of 2: Select Company</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Switch Partner Company</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Select a business merchant. You will then be prompted to select a showroom branch under that company.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={handleManualRefresh}
                          disabled={refreshing}
                          className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Refresh Companies List"
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand' : ''}`} />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelOrClose}
                          className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-4 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search company by name or ID (e.g. Estoy Bien, 47664)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue focus:ring-0.7 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Company List Items */}
                  <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1">
                    {filteredBusinesses.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                        <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                            {businesses.length === 0 ? 'No partner companies found' : 'No matching companies'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {businesses.length === 0
                              ? 'Ensure you are signed in with an active District Banker account.'
                              : 'Try searching with a different business name or ID.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      filteredBusinesses.map((b) => {
                        const isSelected = String(b.id) === String(activeCompanyId);
                        const primaryName = getPreferredLocaleName(b.name_locales) || b.name || `Business ${b.id}`;
                        const logoUrl = formatImageUrl(b.logo?.file_url);
                        const otherLocales = (b.name_locales || []).filter(
                          (l) => l.name && l.name !== primaryName
                        );

                        return (
                          <div
                            key={b.id}
                            onClick={() => handleCandidateCompanySelect(b)}
                            className={`group p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 ${
                              isSelected
                                ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 shadow-sm ring-1 ring-brand-blue/30'
                                : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/80'
                            }`}
                          >
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform p-1">
                              {logoUrl ? (
                                <img
                                  src={logoUrl}
                                  alt={primaryName}
                                  className="w-full h-full object-contain rounded-xl"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="font-black text-sm text-brand-blue-600 dark:text-brand-blue-400">
                                  {primaryName.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {primaryName}
                                </h4>
                                {isSelected && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-blue text-white font-black tracking-wide uppercase">
                                    Current
                                  </span>
                                )}
                              </div>

                              {otherLocales.length > 0 && (
                                <p className="text-[10px] text-slate-400 truncate">
                                  {otherLocales.map((l) => l.name).join(' • ')}
                                </p>
                              )}

                              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold">
                                  ID: {b.id}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                  <Store className="w-2.5 h-2.5 text-brand" />
                                  <span>{b.branch_count} {b.branch_count === 1 ? 'Branch' : 'Branches'}</span>
                                </span>
                                {b.status === 'ACTIVE' && (
                                  <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end justify-center shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary-glass"
                              >
                                Select Branches →
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Authorized Banker Portal</span>
                    </span>
                    <span>{filteredBusinesses.length} verified companies</span>
                  </div>
                </>
              )}

              {/* STEP 2: ENFORCED BRANCH SELECTION UNDER CANDIDATE COMPANY */}
              {step === 'branch' && candidateCompany && (
                <>
                  {/* Modal Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 relative shrink-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setStep('company');
                            setSearchQuery('');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline mb-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Company Selection</span>
                        </button>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3" />
                          <span>Step 2 of 2: Required Branch Selection</span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Select Showroom Branch</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          To switch to{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {getPreferredLocaleName(candidateCompany.name_locales) || candidateCompany.name}
                          </strong>
                          , please select an active showroom branch.
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelOrClose}
                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                        title="Cancel switch & keep previous company"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Candidate Company Info Card */}
                    <div className="mt-3 p-2.5 rounded-xl bg-brand-blue/5 dark:bg-brand-blue/10 border border-brand-blue/20 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center overflow-hidden shrink-0">
                        {candidateCompany.logo?.file_url ? (
                          <img
                            src={formatImageUrl(candidateCompany.logo.file_url)}
                            alt="Logo"
                            className="w-full h-full object-contain p-0.5"
                          />
                        ) : (
                          <Building2 className="w-4 h-4 text-brand-blue" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {getPreferredLocaleName(candidateCompany.name_locales) || candidateCompany.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          ID: {candidateCompany.id} • {candidateBranches.length} branch location{candidateBranches.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-3 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search branch by name, code, or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Branch List Items */}
                  <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1">
                    {loadingBranches ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading showroom branches for this company...
                      </div>
                    ) : filteredBranches.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                        <MapPin className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                            {candidateBranches.length === 0 ? 'No branches found for this company' : 'No matching branches'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {candidateBranches.length === 0
                              ? 'This partner merchant currently has no registered branch locations.'
                              : 'Try adjusting your search query.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      filteredBranches.map((branch) => {
                        const isCurrentActiveBranch =
                          String(branch.id) === String(user?.branchId) &&
                          String(candidateCompany.id) === String(user?.companyId);

                        return (
                          <div
                            key={branch.id}
                            onClick={() => handleBranchSelect(branch)}
                            className="group p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-blue dark:hover:border-brand-blue bg-white dark:bg-slate-900/40 hover:bg-brand-blue/5 dark:hover:bg-brand-blue/10 transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 shadow-sm"
                          >
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                  <span>{branch.name}</span>
                                  {isCurrentActiveBranch && (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-blue text-white font-black tracking-wide uppercase">
                                      Current Active
                                    </span>
                                  )}
                                </h4>
                                {branch.code && (
                                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {branch.code}
                                  </span>
                                )}
                              </div>

                              {branch.address && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-1">
                                  <MapPin className="w-3 h-3 text-brand-blue shrink-0 mt-0.5" />
                                  <span className="truncate">{branch.address}</span>
                                </p>
                              )}

                              {branch.phone && (
                                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{branch.phone}</span>
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end justify-center shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="primary-glass"
                              >
                                Switch to Branch
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Modal Footer with Cancel / Revert Notice */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
                    <span className="text-slate-500">
                      Closing without selecting will keep previous company.
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCancelOrClose}
                      className="text-xs h-7 rounded-lg"
                    >
                      Cancel & Keep Current
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
