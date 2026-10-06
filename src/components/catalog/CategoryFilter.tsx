'use client';

import React, { useState, useMemo } from 'react';
import { Search, Grid, X, Layers, LucideIcon } from 'lucide-react';
import { CategoryItem } from '@/types';
import { DEFAULT_CATEGORY_ICONS } from './CategoryPills';

interface CategoryFilterProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (code: string) => void;
  productCounts?: Record<string, number>;
  totalProductsCount?: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q))
    );
  }, [categories, search]);

  const isCategorySelected = (cat: CategoryItem) => {
    if (!selectedCategory || selectedCategory === 'ALL') return false;
    const s = selectedCategory.trim().toLowerCase();
    return (
      (cat.code && cat.code.toLowerCase() === s) ||
      (cat.id && String(cat.id).toLowerCase() === s) ||
      (cat.name && cat.name.toLowerCase() === s)
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid className="w-3.5 h-3.5 text-brand" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Category
          </h4>
        </div>
        {selectedCategory && selectedCategory !== 'ALL' && (
          <button
            type="button"
            onClick={() => onSelectCategory('ALL')}
            className="text-[10px] text-brand hover:underline font-bold cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Category Search Bar */}
      {categories.length > 5 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter categories..."
            className="w-full pl-8 pr-6 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Category List */}
      <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
        <button
          type="button"
          onClick={() => onSelectCategory('ALL')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            selectedCategory === 'ALL' || !selectedCategory
              ? 'bg-brand/15 text-brand dark:text-brand-300 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">All Categories</span>
          </div>
        </button>

        {filteredCategories.map((c) => {
          const isSelected = isCategorySelected(c);
          const Icon: LucideIcon = DEFAULT_CATEGORY_ICONS[c.code?.toUpperCase()] || Layers;

          return (
            <button
              key={c.id || c.code}
              type="button"
              onClick={() => onSelectCategory(isSelected ? 'ALL' : String(c.id || c.code))}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                isSelected
                  ? 'bg-brand/15 text-brand dark:text-brand-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {c.logoUrl ? (
                  <img
                    src={c.logoUrl}
                    alt={c.name}
                    className="w-4 h-4 object-contain rounded bg-white dark:bg-slate-800 p-0.5 shrink-0"
                  />
                ) : (
                  <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="truncate">{c.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
