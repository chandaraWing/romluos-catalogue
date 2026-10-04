'use client';

import React from 'react';
import { SlidersHorizontal, DollarSign } from 'lucide-react';

interface PriceFilterProps {
  priceRange: [number, number];
  maxPriceLimit: number;
  onChangePriceRange: (range: [number, number]) => void;
  onResetPrice?: () => void;
}

export const PriceFilter: React.FC<PriceFilterProps> = ({
  priceRange,
  maxPriceLimit,
  onChangePriceRange,
  onResetPrice,
}) => {
  const limit = Math.max(maxPriceLimit || 3500, 100);
  const minVal = Math.max(0, Math.min(priceRange[0], priceRange[1]));
  const maxVal = Math.min(limit, Math.max(priceRange[0], priceRange[1]));
  const step = 25;

  const minPercent = Math.min(100, Math.max(0, (minVal / limit) * 100));
  const maxPercent = Math.min(100, Math.max(0, (maxVal / limit) * 100));

  const handleMinSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const newMin = Math.min(value, maxVal - step);
    onChangePriceRange([Math.max(0, newMin), maxVal]);
  };

  const handleMaxSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const newMax = Math.max(value, minVal + step);
    onChangePriceRange([minVal, Math.min(limit, newMax)]);
  };

  const handleMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : Number(e.target.value);
    if (!isNaN(value)) {
      onChangePriceRange([Math.max(0, Math.min(value, maxVal)), maxVal]);
    }
  };

  const handleMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? limit : Number(e.target.value);
    if (!isNaN(value)) {
      onChangePriceRange([minVal, Math.max(minVal, Math.min(value, limit))]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-brand" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Price Range
          </h4>
        </div>
        {(minVal > 0 || maxVal < limit) && onResetPrice && (
          <button
            type="button"
            onClick={onResetPrice}
            className="text-[10px] text-brand hover:underline font-bold cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Dual Slider Component */}
      <div className="space-y-3 pt-1">
        <div className="relative h-6 flex items-center">
          {/* Slider Background Track */}
          <div className="absolute w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />

          {/* Active Highlight Range Track */}
          <div
            className="absolute h-1.5 rounded-full bg-gradient-to-r from-brand to-brand-blue"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(0, maxPercent - minPercent)}%`,
            }}
          />

          {/* Dual Range Inputs */}
          <input
            type="range"
            min="0"
            max={limit}
            step={step}
            value={minVal}
            onChange={handleMinSlider}
            aria-label="Minimum price"
            className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none cursor-pointer z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900"
          />
          <input
            type="range"
            min="0"
            max={limit}
            step={step}
            value={maxVal}
            onChange={handleMaxSlider}
            aria-label="Maximum price"
            className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none cursor-pointer z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-blue [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-blue [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900"
          />
        </div>

        {/* Min and Max Adjustable Number Input Fields */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Min Price
            </span>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-xs text-slate-400 font-bold">$</span>
              <input
                type="number"
                min="0"
                max={maxVal}
                step={step}
                value={minVal}
                onChange={handleMinInput}
                className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Max Price
            </span>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-xs text-slate-400 font-bold">$</span>
              <input
                type="number"
                min={minVal}
                max={limit}
                step={step}
                value={maxVal}
                onChange={handleMaxInput}
                className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
