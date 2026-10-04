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
  const isAvailable = (product.availableStock ?? product.totalStock ?? 10) > 0;
  const activeOptions = product.variantGroups || product.specifications?.options || [];
  const hasVariants = Array.isArray(activeOptions) && activeOptions.length > 0;
  const displayPrice = Number(product.unitPrice || product.currentPrice || product.basePrice || 0);

  const prefetchProductDetail = useCallback(() => {
    if (!product?.id) return;
    const branchId = product.branchId || '47861';
    api.get(`/api/products/${product.id}?branch_id=${branchId}&service_types=ST_SHOPPING`, {
      cacheTtlMs: 60000,
    }).catch(() => {});
  }, [product?.id, product?.branchId]);

  const handleCardClick = () => {
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
      className="bg-white dark:bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
    >
      {/* Product Image & Badges */}
      <div className="relative h-48 w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {product.images?.[0] || product.image ? (
          <img
            src={product.images?.[0] || product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Package className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 text-[10px] font-bold text-slate-900 dark:text-slate-200 shadow-xs">
            {product.brand || 'Romlus'}
          </span>
        </div>

      </div>

      {/* Product Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>SKU: {product.sku || 'N/A'}</span>
            <span>24m Financing</span>
          </div>

          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-brand-lime transition-colors line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Pricing & Add Action */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(displayPrice)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Est: {formatCurrency((displayPrice * 0.9 * 1.052) / 24)}/mo
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant={inCartCount > 0 ? 'secondary-glass' : 'gradient-glass'}
            onClick={handleButtonClick}
            disabled={!isAvailable}
            className="text-xs font-bold gap-1.5"
          >
            {inCartCount > 0 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                <span className="text-secondary">Selected ({inCartCount})</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white dark:text-secondary" />
                <span className="text-white dark:bg-gradient-to-r dark:via-brand-300 dark:from-brand-blue-600 dark:to-primary dark:bg-clip-text dark:text-transparent font-extrabold">
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
