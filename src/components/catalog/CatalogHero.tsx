'use client';

import { Search, X } from 'lucide-react';
import React from 'react';
import { BranchInfo, CompanyInfo, FilterTag } from './CatalogTypes';
import { Button } from '@/components/ui/button';

interface CatalogHeroProps {
  company?: CompanyInfo | null;
  branch?: BranchInfo | null;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  activeFilterTag?: FilterTag | string;
  onSelectFilterTag?: (tag: FilterTag | string) => void;
  title?: string;
  subtitle?: string;
}

export const CatalogHero: React.FC<CatalogHeroProps> = ({
  company,
  branch,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  sortBy = '',
  onSortChange,
  activeFilterTag,
  onSelectFilterTag,
  subtitle,
}) => {
  const displayTitle = company?.name || 'Shop';

  const sortOptions = [
    { id: '', label: '⚡ Default' },
    { id: 'MOST_POPULAR', label: '🔥 Most Popular' },
    { id: 'BIGGEST_DISCOUNT', label: '🏷️ Biggest Discount' },
    { id: 'NEWEST_DEALS', label: '⭐ Newest Deals' },
    { id: 'NEWEST_ARRIVAL', label: '✨ New Arrivals' },
  ];

  return (
    <section className="relative overflow-hidden pt-4 sm:pt-6 pb-6 sm:pb-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-sky-50/80 via-white/90 to-brand-50/80 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 p-5 sm:p-10 md:p-12 lg:p-16 min-h-[280px] sm:min-h-[380px] flex flex-col justify-between shadow-lg dark:shadow-2xl border border-sky-100/80 dark:border-slate-800 transition-colors duration-300">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 sm:opacity-28 dark:opacity-35 dark:sm:opacity-50 mix-blend-multiply dark:mix-blend-luminosity scale-105 transition-transform duration-1000 pointer-events-none"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80")',
          }}
        />
        {/* Soft Ethereal White / Dark Atmosphere Gradient Fade Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/55 via-white/30 to-white/10 dark:from-slate-950/95 dark:via-slate-950/60 dark:to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40 dark:from-transparent dark:via-transparent dark:to-slate-950/80 pointer-events-none" />
        
        {/* Gentle Dual Ambient Radial Fades (Sky top-left, Lime bottom-right) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-200/40 via-sky-50/10 to-transparent dark:from-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-brand-200/35 via-brand-50/10 to-transparent dark:from-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-brand-radial-glow opacity-20 dark:opacity-60 pointer-events-none" />

        {/* Hero Huge Text */}
        <div className="relative z-10 text-center max-w-3xl mx-auto my-auto py-2 sm:py-4">
          <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase drop-shadow-sm dark:drop-shadow-2xl select-none break-words text-slate-900 dark:text-white transition-colors">
            {displayTitle}
          </h1>
          <p className="mt-2 text-xs sm:text-base text-slate-700 dark:text-slate-300 font-medium px-2 leading-relaxed">
            {subtitle || (
              <>
                Official catalog for{' '}
                <span className="text-slate-950 dark:text-white font-bold">{company?.name || 'Authorized Electronics'}</span>
                {branch && (
                  <>
                    {' '}• Branch: <span className="text-brand-700 dark:text-brand font-bold">{branch.name}</span>
                  </>
                )}
              </>
            )}
          </p>

          {/* Search Pill Input */}
          <form onSubmit={onSearchSubmit} className="mt-5 sm:mt-8 max-w-xl mx-auto relative group">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-brand-700 dark:group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products by model, brand, or specs..."
                className="w-full pl-10 sm:pl-12 pr-24 sm:pr-28 py-3 sm:py-4 bg-white/95 dark:bg-white/10 backdrop-blur-md border dark:border-white/20 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white dark:focus:bg-white/20 transition-all shadow-lg dark:shadow-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-20 sm:right-24 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="absolute right-2 sm:right-2.5 h-auto py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl shadow-md cursor-pointer border-gray-200 dark:border-white/20 bg-white dark:bg-slate-900/80 hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              >
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Sort Option Pills in Hero Footer */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-3 sm:pt-4">
          {sortOptions.map((option) => {
            const isSelected = sortBy === option.id;
            return (
              <button
                key={option.id || 'default'}
                type="button"
                onClick={() => {
                  if (onSortChange) {
                    onSortChange(option.id);
                  } else if (onSelectFilterTag) {
                    onSelectFilterTag(option.id);
                  }
                }}
                className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold backdrop-blur-md transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-brand text-slate-950 font-black shadow-lg shadow-brand/35 border-brand scale-105'
                    : 'bg-white/90 dark:bg-white/10 text-slate-800 dark:text-slate-300 dark:border-white/10 hover:bg-sky-50/80 dark:hover:bg-white/20 hover:text-slate-950 dark:hover:text-white shadow-2xs'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
