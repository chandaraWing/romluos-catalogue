'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useTheme } from '@/lib/theme-context';
import { BranchItem, PartnerBusinessItem } from '@/types';
import {
  BarChart3,
  Building2,
  ChevronDown,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Phone,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sun
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BranchSelector } from './BranchSelectorModal';
import { BranchInfo, CompanyInfo } from './CatalogTypes';

interface CatalogHeaderProps {
  company: CompanyInfo;
  branch?: BranchInfo | null;
  homeUrl?: string;
  totalCartItems: number;
  onOpenCart: () => void;
  onOpenOrders?: () => void;
  onOpenFinancing?: () => void;
  onOpenReport?: () => void;
  onFilterDeals?: () => void;
  onFilterBestSellers?: () => void;
  onSelectBranch?: (branch: BranchItem) => void;
  onSelectCompany?: (company: PartnerBusinessItem) => void;
  onSelectCompanyAndBranch?: (company: PartnerBusinessItem, branch: BranchItem) => void;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  company,
  branch,
  homeUrl = '/',
  totalCartItems,
  onOpenCart,
  onOpenOrders,
  onOpenFinancing,
  onOpenReport,
  onFilterDeals,
  onFilterBestSellers,
  onSelectBranch,
  onSelectCompany,
  onSelectCompanyAndBranch,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { clearCart } = useCart();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element | null;
      // If clicking inside a portal modal (e.g. Branch/Company selector modal dialog), don't close the dropdown
      if (target && target.closest('[data-portal-modal]')) {
        return;
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (typeof document !== 'undefined' && document.querySelector('[data-portal-modal]')) return;
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const userInitials = useMemo(() => {
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    if (first || last) return `${first}${last}`.toUpperCase();
    return user.phone?.slice(-2) || 'DB';
  }, [user]);

  const userDisplayName = useMemo(() => {
    if (!user) return 'User';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.phone || 'District Banker';
  }, [user]);

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#080c14]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Company Details */}
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <Link href={homeUrl} className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none min-w-0">
            <div className="h-14 sm:h-14 w-auto max-w-[100px] sm:max-w-[160px] p-1 transition-transform flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={'https://d13jxrd8otm92m.cloudfront.net/raw/consumer/USR-260370000450013/profile/RES-262730080811559.png'}
                alt={'Brand Logo'}
                className="h-full w-auto object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Global Branch Selector Modal Trigger (Visible on tablet/desktop, moved to profile dropdown on mobile) */}
        <div className="hidden sm:block flex-1 max-w-sm mx-1 sm:mx-4">
          <BranchSelector
            company={company}
            currentBranch={branch}
            onSelectBranch={(b) => {
              if (onSelectBranch) onSelectBranch(b);
            }}
            onSelectCompany={(c) => {
              if (onSelectCompany) onSelectCompany(c);
            }}
            onSelectCompanyAndBranch={(c, b) => {
              if (onSelectCompanyAndBranch) onSelectCompanyAndBranch(c, b);
            }}
          />
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Cart Drawer Trigger Button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onOpenCart}
            className="relative p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="View Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-brand text-slate-950 text-[10px] font-black flex items-center justify-center shadow-md shadow-brand/30 animate-scale-in z-10 pointer-events-none">
                {totalCartItems > 99 ? '99+' : totalCartItems}
              </span>
            )}
          </Button>

          {/* My Orders Button - Links to /romlous-orders */}
          <Link
            href="/romlous-orders"
            className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center shrink-0"
            title="Rumluos Orders"
          >
            <ShoppingBag className="w-4 h-4" />
          </Link>

          {/* Dark / Light Mode Toggle (Hidden on small screens when user menu contains theme toggle) */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            className="hidden sm:inline-flex p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Toggle Dark/Light Mode"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* User Profile Avatar & Dropdown Menu */}
          {isAuthenticated ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/40"
                title="Account Menu"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-brand to-brand-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-xs">
                  {userInitials}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[100px]">
                    {userDisplayName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                    {user?.role === 'DISTRICT_BANKER' ? 'District Banker' : 'Partner'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden md:block ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Info Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-brand-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shrink-0">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {userDisplayName}
                        </h4>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-brand/15 text-brand dark:text-brand border border-brand/30 shrink-0">
                          {user?.role || 'Banker'}
                        </span>
                      </div>
                      {user?.phone && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{user.phone}</span>
                        </p>
                      )}
                      {user?.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Company & Branch Selector Section in Dropdown */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>Assigned Organization</span>
                      </span>
                    </div>

                    {/* Interactive Company & Branch Selector in Dropdown (Stacked vertically) */}
                    <div className="w-full">
                      <BranchSelector
                        company={company}
                        currentBranch={branch}
                        variant="dropdown"
                        onSelectBranch={(b) => {
                          setProfileDropdownOpen(false);
                          if (onSelectBranch) onSelectBranch(b);
                        }}
                        onSelectCompany={(c) => {
                          setProfileDropdownOpen(false);
                          if (onSelectCompany) onSelectCompany(c);
                        }}
                        onSelectCompanyAndBranch={(c, b) => {
                          setProfileDropdownOpen(false);
                          if (onSelectCompanyAndBranch) onSelectCompanyAndBranch(c, b);
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Menu Items */}
                  <div className="pt-1 space-y-1.5">
                    {/* My Orders Link */}
                    <Link
                      href="/romlous-orders"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-brand group-hover:scale-110 transition-transform shrink-0" />
                        <span>Rumluos Orders</span>
                      </div>
                      <span className="text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">
                        →
                      </span>
                    </Link>

                    {/* View Report */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        if (onOpenReport) {
                          onOpenReport();
                        } else if (onOpenOrders) {
                          onOpenOrders();
                        } else if (onOpenFinancing) {
                          onOpenFinancing();
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <BarChart3 className="w-3.5 h-3.5 text-brand group-hover:scale-110 transition-transform shrink-0" />
                        <span>View Report</span>
                      </div>
                      <span className="text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">
                        →
                      </span>
                    </button>

                    {/* Dark / Light Mode Switcher (Visible on small screens / in dropdown) */}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        {resolvedTheme === 'dark' ? (
                          <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform shrink-0" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 group-hover:-rotate-12 transition-transform shrink-0" />
                        )}
                        <span>Theme Mode</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                        {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
                      </span>
                    </button>

                    {/* Sign Out Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        clearCart();
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand hover:border-brand text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0" />
              <span className="hidden sm:inline font-bold">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
