'use client';

import React, { useState, useMemo } from 'react';
import { Search, Tag, X } from 'lucide-react';

export interface BrandFilterItem {
  name: string;
  count: number;
  logoUrl?: string;
  code?: string;
}

interface BrandFilterProps {
  brands: BrandFilterItem[];
  selectedBrand: string;
  onSelectBrand: (brandName: string) => void;
  totalProductsCount?: number;
}

export const BrandFilter: React.FC<BrandFilterProps> = ({
  brands,
  selectedBrand,
  onSelectBrand,
  totalProductsCount = 0,
}) => {
  const [search, setSearch] = useState('');

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands;
    const q = search.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-brand" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Brand
          </h4>
        </div>
        {selectedBrand !== 'ALL' && (
          <button
            type="button"
            onClick={() => onSelectBrand('ALL')}
            className="text-[10px] text-brand hover:underline font-bold"
          >
            Reset
          </button>
        )}
      </div>

      {/* Brand Search Bar */}
      {brands.length > 5 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter brands..."
            className="w-full pl-8 pr-6 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Brand List */}
      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        <button
          type="button"
          onClick={() => onSelectBrand('ALL')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            selectedBrand === 'ALL'
              ? 'bg-brand/15 text-brand dark:text-brand-300 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span>All Brands</span>
          {totalProductsCount > 0 && (
            <span className="text-[10px] opacity-70">({totalProductsCount})</span>
          )}
        </button>

        {filteredBrands.map((b) => {
          const isSelected = selectedBrand.toLowerCase() === b.name.toLowerCase();
          return (
            <button
              key={b.name}
              type="button"
              onClick={() => onSelectBrand(b.name)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                isSelected
                  ? 'bg-brand/15 text-brand dark:text-brand-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {b.logoUrl && (
                  <img
                    src={b.logoUrl}
                    alt={b.name}
                    className="w-4 h-4 object-contain rounded bg-white dark:bg-slate-800 p-0.5"
                  />
                )}
                <span className="truncate">{b.name}</span>
              </div>
              <span className="text-[10px] opacity-70 shrink-0">({b.count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
