'use client';

import React, { useCallback } from 'react';
import { Package, Plus, CheckCircle2, Sparkles } from 'lucide-react';
import { ProductItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface BankerProductCardProps {
  product: ProductItem;
  inCartCount: number;
  isJustAdded?: boolean;
  onAddToCart: (product: ProductItem) => void;
  onOpenConfigurator: (product: ProductItem) => void;
}

export const BankerProductCard: React.FC<BankerProductCardProps> = ({
  product,
  inCartCount,
  isJustAdded = false,
  onAddToCart,
  onOpenConfigurator,
}) => {
  const isAvailable =
    product.is_available !== undefined
      ? Boolean(product.is_available)
      : product.isAvailable !== undefined
      ? Boolean(product.isAvailable)
      : (product.availableStock !== undefined ? product.availableStock > 0 : (product.totalStock ?? 10) > 0);

  const activeOptions = product.variantGroups || product.specifications?.options || [];
  const hasVariants = Array.isArray(activeOptions) && activeOptions.length > 0;
  const displayPrice = Number(product.unitPrice || product.currentPrice || product.basePrice || 0);

  const prefetchProductDetail = useCallback(() => {
    if (!product?.id || !product?.branchId || !isAvailable) return;
    api.get(`/api/products/${product.id}?branch_id=${product.branchId}&service_types=ST_SHOPPING`, {
      cacheTtlMs: 60000,
    }).catch(() => {});
  }, [product?.id, product?.branchId, isAvailable]);

  const handleCardClick = () => {
    if (!isAvailable) return;
    onOpenConfigurator(product);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    onOpenConfigurator(product);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={prefetchProductDetail}
      onTouchStart={prefetchProductDetail}
      className={`bg-white dark:bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group ${
        isAvailable ? 'cursor-pointer' : 'opacity-65 cursor-not-allowed'
      }`}
    >
      {/* Product Image & Badges */}
      <div className="relative h-32 xs:h-36 sm:h-48 w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {product.images?.[0] || product.image ? (
          <img
            src={product.images?.[0] || product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.5]" />
          </div>
        )}

        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 text-[9px] sm:text-[10px] font-bold text-slate-900 dark:text-slate-200 shadow-xs">
            {product.brand || 'Romluos'}
          </span>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-4">
        <div>
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">
            <span className="truncate max-w-[60px] sm:max-w-none">SKU: {product.sku || 'N/A'}</span>
            <span className="hidden xs:inline">24m Financing</span>
          </div>

          <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base leading-snug group-hover:text-brand-lime transition-colors line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Pricing & Add Action */}
        <div className="pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-2">
          <div>
            <div className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight">
              {formatCurrency(displayPrice)}
            </div>
            <div className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-tight">
              Est: {formatCurrency((displayPrice * 0.9 * 1.052) / 24)}/mo
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant={inCartCount > 0 ? 'secondary-glass' : 'gradient-glass'}
            onClick={handleButtonClick}
            disabled={!isAvailable}
            className={`text-[10px] sm:text-xs font-bold gap-1 sm:gap-1.5 h-auto py-1 sm:py-2 px-2 sm:px-3 w-full xs:w-auto ${
              !isAvailable ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400' : ''
            }`}
          >
            {!isAvailable ? (
              <span className="text-slate-400 font-semibold truncate">Unavailable</span>
            ) : inCartCount > 0 ? (
              <>
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-secondary shrink-0" />
                <span className="text-secondary truncate">Selected ({inCartCount})</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white dark:text-secondary shrink-0" />
                <span className="text-white dark:bg-gradient-to-r dark:via-brand-300 dark:from-brand-blue-600 dark:to-primary dark:bg-clip-text dark:text-transparent font-extrabold truncate">
                  Select Option
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
