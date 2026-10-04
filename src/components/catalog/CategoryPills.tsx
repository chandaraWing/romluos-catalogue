'use client';

import React from 'react';
import { LucideIcon, Layers, Utensils, Headphones, Smartphone, Laptop, Watch, Radio, Tv } from 'lucide-react';
import { CategoryItem } from '@/types';

export const DEFAULT_CATEGORY_ICONS: Record<string, LucideIcon> = {
  ALL: Layers,
  KITCHEN: Utensils,
  AUDIO: Headphones,
  MUSIC: Headphones,
  PHONE: Smartphone,
  SMARTPHONE: Smartphone,
  LAPTOP: Laptop,
  COMPUTERS: Laptop,
  WEARABLES: Watch,
  SMARTWATCH: Watch,
  ACCESSORY: Radio,
  OTHER: Tv,
};

interface CategoryPillsProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (code: string) => void;
  productCounts?: Record<string, number>;
  totalProductsCount?: number;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  productCounts = {},
  totalProductsCount = 0,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {/* All Products Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory('ALL')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
              : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Products</span>
          {totalProductsCount > 0 && (
            <span
              className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedCategory === 'ALL'
                  ? 'bg-white/20 dark:bg-black/10'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {totalProductsCount}
            </span>
          )}
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const Icon = DEFAULT_CATEGORY_ICONS[cat.code?.toUpperCase()] || Layers;
          const isSelected =
            Boolean(selectedCategory) &&
            selectedCategory !== 'ALL' &&
            ((cat.id && String(cat.id).toLowerCase() === selectedCategory.toLowerCase()) ||
              (cat.code && cat.code.toLowerCase() === selectedCategory.toLowerCase()) ||
              (cat.name && cat.name.toLowerCase() === selectedCategory.toLowerCase()));
          const count = productCounts[cat.code?.toUpperCase()] || productCounts[cat.id] || productCounts[cat.name];

          return (
            <button
              key={cat.id || cat.code}
              type="button"
              onClick={() => onSelectCategory(isSelected ? 'ALL' : (String(cat.id || cat.code)))}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                  : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-white/20 dark:bg-black/10'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
