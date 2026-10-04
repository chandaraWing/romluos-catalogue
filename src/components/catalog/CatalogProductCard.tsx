'use client';

import React, { useCallback } from 'react';
import { ShoppingCart, Eye, MapPin } from 'lucide-react';
import { ProductItem } from '@/types';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface CatalogProductCardProps {
  product: ProductItem;
  onAddToCart: (product: ProductItem, e?: React.MouseEvent) => void;
  onBuyNow?: (product: ProductItem, e?: React.MouseEvent) => void;
  onQuickView: (product: ProductItem) => void;
  branchName?: string;
  isPopular?: boolean;
}

export const CatalogProductCard: React.FC<CatalogProductCardProps> = ({
  product,
  onAddToCart,
  onBuyNow,
  onQuickView,
  branchName,
  isPopular = false,
}) => {
  const displayPrice = Number(
    product.unitPrice || product.currentPrice || product.basePrice || 0
  );
  const basePrice = Number(product.basePrice || displayPrice);
  const hasDiscount = basePrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((basePrice - displayPrice) / basePrice) * 100)
    : 0;

  const imageUrl =
    product.images?.[0] ||
    product.image ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop';

  const brandName = product.brand || 'Romlus';

  const prefetchProductDetail = useCallback(() => {
    if (!product?.id) return;
    const branchId = product.branchId || '47861';
    api.get(`/api/products/${product.id}?branch_id=${branchId}&service_types=ST_SHOPPING`, {
      cacheTtlMs: 60000,
    }).catch(() => {});
  }, [product?.id, product?.branchId]);

  return (
    <div
      onClick={() => onQuickView(product)}
      onMouseEnter={prefetchProductDetail}
      onTouchStart={prefetchProductDetail}
      className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-[#111722] border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm hover:shadow-xl hover:border-brand-lime/40 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Top Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
        {hasDiscount && (
          <span className="px-2.5 py-1 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-rose-500/20">
            -{discountPercent}% OFF
          </span>
        )}
        {isPopular && (
          <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
            🔥 Popular
          </span>
        )}
      </div>

      {/* Quick View Floating Action */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onQuickView(product);
        }}
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 backdrop-blur-md shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-brand-lime hover:scale-105"
        title="Quick View"
      >
        <Eye className="w-4 h-4" />
      </Button>

      {/* Product Image Stage */}
      <div className="relative w-full aspect-square rounded-2xl bg-[#F8F9FA] dark:bg-slate-900/60 p-6 mb-4 flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Product Information */}
      <div className="space-y-2.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-brand-lime uppercase tracking-wider mb-1">
            <span>{brandName}</span>
            {branchName && (
              <span className="text-slate-400 font-medium normal-case flex items-center gap-1 text-[10px]">
                <MapPin className="w-3 h-3 text-emerald-500" />
                {branchName}
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-brand-lime transition-colors">
            {product.name}
          </h3>
        </div>

        <div>
          {/* Price & Monthly Estimate */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
            <div>
              <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                ${displayPrice.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                From ${(displayPrice * 0.045).toFixed(2)}/mo
              </div>
            </div>

            <Button
              type="button"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product, e);
              }}
              className="w-9 h-9 rounded-xl shadow-md transition-all hover:scale-105"
              title="Add to Proposal Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
