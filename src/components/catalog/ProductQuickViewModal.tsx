'use client';

import { ProductItem } from '@/types';
import { ShieldCheck, ShoppingCart, Truck, X, Zap } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

interface ProductQuickViewModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onAddToCart: (product: ProductItem, selectedOptions?: any, e?: React.MouseEvent) => void;
  onBuyNow: (product: ProductItem, e?: React.MouseEvent) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  if (!product) return null;

  const displayPrice = Number(
    product.unitPrice || product.currentPrice || product.basePrice || 0
  );

  const imageUrl =
    product.images?.[0] ||
    product.image ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-left overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Image Preview Stage */}
            <div className="bg-[#F8F9FA] dark:bg-slate-950 p-8 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800">
              <img
                src={imageUrl}
                alt={product.name}
                className="max-h-72 w-full object-contain"
              />
            </div>

            {/* Product Details */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="text-xs font-bold text-brand uppercase tracking-wider">
                  {product.brand} • {product.model || product.category}
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {product.name}
                </h2>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  ${displayPrice.toFixed(2)}
                </div>
                {product.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                )}

                <div className="space-y-1.5 pt-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Manufacturer Verified Warranty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand-blue-500" />
                    <span>Showroom Stock Lock (48h Reservation)</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="gradient"
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  className="flex-1 text-xs gap-2"
                >
                  <ShoppingCart className="w-4 h-4 text-white group-hover:scale-110 transition-transform shrink-0" />
                  <span className="font-bold text-white">
                    Add to Cart
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onBuyNow(product);
                    onClose();
                  }}
                  className="flex-1 rounded-xl bg-accent-gradient text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>Checkout Now</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
