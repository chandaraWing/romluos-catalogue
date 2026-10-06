'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Moon, Sun, MapPin, Zap, Flame, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { CompanyInfo, BranchInfo } from './CatalogTypes';

import { BranchSelector } from './BranchSelectorModal';
import { BranchItem, PartnerBusinessItem } from '@/types';
import { Button } from '@/components/ui/button';

interface CatalogHeaderProps {
  company: CompanyInfo;
  branch?: BranchInfo | null;
  homeUrl?: string;
  totalCartItems: number;
  onOpenCart: () => void;
  onOpenFinancing?: () => void;
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
  onOpenFinancing,
  onFilterDeals,
  onFilterBestSellers,
  onSelectBranch,
  onSelectCompany,
  onSelectCompanyAndBranch,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#080c14]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Company Details */}
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <Link href={homeUrl} className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none min-w-0">
            <div className="w-16 h-20 p-1 transition-transform flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src={'https://d13jxrd8otm92m.cloudfront.net/raw/consumer/USR-260370000450013/profile/RES-262730080811559.png'}
                alt={'Brand Logo'}
                className="w-full h-full object-contain"
              />
            </div>
            {/* <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-brand transition-colors truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">
                  {company?.name || 'Romluos Branch Catalog'}
                </span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand animate-pulse flex-shrink-0" title="Verified Branch Catalog" />
              </div>
              {branch && (
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">
                  {branch.name} • {branch.code}
                </span>
              )}
            </div> */}
          </Link>

          {/* Quick Nav Links */}
          {/* <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-400 ml-4">
            <span className="text-brand dark:text-brand">Branch Shop</span>
            {onFilterBestSellers && (
              <button
                type="button"
                onClick={onFilterBestSellers}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Best Sellers
              </button>
            )}
            {onFilterDeals && (
              <button
                type="button"
                onClick={onFilterDeals}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-rose-500 dark:text-rose-400"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Special Deals</span>
              </button>
            )}
          </nav> */}
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Interactive Branch Selector Dropdown */}
          <BranchSelector
            currentBranch={branch}
            company={company}
            onSelectBranch={onSelectBranch}
            onSelectCompany={onSelectCompany}
            onSelectCompanyAndBranch={onSelectCompanyAndBranch}
          />

          {/* Banker / Consumer Auth Indicator */}
          <Link
            href="/login"
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isAuthenticated
                ? 'bg-brand/10 border-brand/30 text-brand-700 dark:text-brand hover:bg-brand/20'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand hover:border-brand'
            }`}
            title={isAuthenticated ? `Logged in: ${user?.phone || 'Active Session'}` : 'Sign in as Banker/Consumer'}
          >
            <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0" />
            <span className="hidden sm:inline font-bold">
              {isAuthenticated ? user?.firstName || 'Banker' : 'Sign In'}
            </span>
          </Link>

          {/* Dark / Light Mode Toggle */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Toggle Dark/Light Mode"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Cart Drawer Trigger Button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onOpenCart}
            className="relative p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand dark:hover:text-brand transition-colors flex items-center justify-center"
            title="View Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand text-slate-950 text-[10px] font-black flex items-center justify-center shadow-md shadow-brand/30 animate-scale-in">
                {totalCartItems > 99 ? '99+' : totalCartItems}
              </span>
            )}
          </Button>

          {/* Direct Banker Financing Button */}
          {onOpenFinancing && (
            <Button
              type="button"
              variant="gradient-outline"
              size="sm"
              onClick={onOpenFinancing}
              className="hidden lg:flex items-center gap-1.5 rounded-xl group"
            >
              <Zap className="w-3.5 h-3.5 text-brand-600 dark:text-brand group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-bold bg-gradient-to-r from-brand-700 via-brand-600 to-brand-blue-600 dark:from-brand dark:via-brand-200 dark:to-brand-blue bg-clip-text text-transparent">
                Checkout Cart
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
