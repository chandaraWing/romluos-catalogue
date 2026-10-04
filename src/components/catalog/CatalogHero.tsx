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
  activeFilterTag: FilterTag | string;
  onSelectFilterTag: (tag: FilterTag | string) => void;
  title?: string;
  subtitle?: string;
}

export const CatalogHero: React.FC<CatalogHeroProps> = ({
  company,
  branch,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  activeFilterTag,
  onSelectFilterTag,
  subtitle,
}) => {
  const displayTitle = company?.name || 'Shop';
  return (
    <section className="relative overflow-hidden pt-4 sm:pt-6 pb-6 sm:pb-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-10 md:p-12 lg:p-16 min-h-[280px] sm:min-h-[380px] flex flex-col justify-between shadow-2xl border border-slate-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 bg-brand-radial-glow opacity-60 pointer-events-none" />

        {/* Hero Huge Text */}
        <div className="relative z-10 text-center max-w-3xl mx-auto my-auto py-2 sm:py-4">
         <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase drop-shadow-2xl select-none break-words text-white">
  {displayTitle}
</h1>
          <p className="mt-2 text-xs sm:text-base text-slate-300 font-medium px-2 leading-relaxed">
            {subtitle || (
              <>
                Official catalog for{' '}
                <span className="text-white font-bold">{company?.name || 'Authorized Electronics'}</span>
                {branch && (
                  <>
                    {' '}• Branch: <span className="text-brand font-bold">{branch.name}</span>
                  </>
                )}
              </>
            )}
          </p>

          {/* Search Pill Input */}
          <form onSubmit={onSearchSubmit} className="mt-5 sm:mt-8 max-w-xl mx-auto relative group">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products by model, brand, or specs..."
                className="w-full pl-10 sm:pl-12 pr-24 sm:pr-28 py-3 sm:py-4 bg-white/10 dark:bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white/20 transition-all shadow-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-20 sm:right-24 p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="absolute right-2 sm:right-2.5 h-auto py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl shadow-md cursor-pointer"
              >
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Quick Tag Pills in Hero Footer */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-3 sm:pt-4">
          {[
            { id: 'all', label: 'All Catalog' },
            { id: 'new', label: '🔥 New Arrivals' },
            { id: 'best', label: '⭐ Best Sellers' },
            { id: 'discount', label: '🏷️ Deals & Discounts' },
            { id: 'instock', label: '📦 In Stock Ready' },
          ].map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onSelectFilterTag(tag.id)}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold backdrop-blur-md transition-all cursor-pointer ${
                activeFilterTag === tag.id
                  ? 'bg-brand text-slate-950 font-black shadow-lg shadow-brand/30 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
