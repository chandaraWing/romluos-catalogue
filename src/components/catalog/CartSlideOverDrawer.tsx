'use client';

import { Button } from '@/components/ui/button';
import { CartItem, useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { buildShoppingOrderPayload, createShoppingOrder } from '@/lib/order-service';
import { ArrowRight, Loader2, Minus, Plus, ShoppingCart, Trash2, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface CartSlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  onOpenFinancing?: (branchId: string, itemIds: string[]) => void;
  onCheckout?: (branchId: string, itemIds: string[], orderId?: string) => void;
  onRemoveItem?: (itemId: string) => void;
  checkoutUrl?: string;
}

export const CartSlideOverDrawer: React.FC<CartSlideOverDrawerProps> = ({
  isOpen,
  onClose,
  items,
  totalAmount,
  totalItems,
  onOpenFinancing,
  onCheckout,
  onRemoveItem,
  checkoutUrl = '/checkout',
}) => {
  const router = useRouter();
  const { removeItem, updateQuantity } = useCart();
  const { user, consumerToken } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [creatingDraftOrder, setCreatingDraftOrder] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && items.length > 0) {
      if (selectedBranchId === null || !items.some((i) => (i.branchId || 'unknown') === selectedBranchId)) {
        const firstBranch = items[0].branchId || 'unknown';
        setSelectedBranchId(firstBranch);
        const branchItems = items
          .filter((i) => (i.branchId || 'unknown') === firstBranch)
          .map((i) => i.id || i.productId);
        setSelectedItemIds(new Set(branchItems));
      }
    }
  }, [isOpen, items, selectedBranchId]);

  if (!isOpen) return null;

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
    const branchItems = items
      .filter((i) => (i.branchId || 'unknown') === branchId)
      .map((i) => i.id || i.productId);
    setSelectedItemIds(new Set(branchItems));
  };

  const handleItemToggle = (itemId: string, branchId: string) => {
    if (branchId !== selectedBranchId) {
      setSelectedBranchId(branchId);
      setSelectedItemIds(new Set([itemId]));
      return;
    }
    const newSet = new Set(selectedItemIds);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItemIds(newSet);
  };

  const handleRemoveItem = (itemId: string) => {
    if (onRemoveItem) {
      onRemoveItem(itemId);
    } else {
      removeItem(itemId);
    }
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const groupedItems = items.reduce((acc, item) => {
    const key = item.branchId || 'unknown';
    if (!acc[key]) {
      acc[key] = { branchName: item.branchName || 'Showroom Branch', items: [], total: 0 };
    }
    acc[key].items.push(item);

    const itemId = item.id || item.productId;
    if (selectedBranchId === key && selectedItemIds.has(itemId)) {
      acc[key].total += Number(item.unitPrice) * item.quantity;
    }
    return acc;
  }, {} as Record<string, { branchName: string; items: CartItem[]; total: number }>);

  const selectedTotal = selectedBranchId && groupedItems[selectedBranchId] ? groupedItems[selectedBranchId].total : 0;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden animate-in fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl p-4 sm:p-6 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-brand" />
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Shopping Cart ({totalItems})
              </h3>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5">
            {items.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Your cart is currently empty</p>
                <p className="text-xs text-slate-500">Configure devices from the showroom catalog to see them here.</p>
              </div>
            ) : (
              Object.entries(groupedItems).map(([branchId, group]) => {
                const isBranchSelected = selectedBranchId === branchId;
                return (
                  <div
                    key={branchId}
                    className={`space-y-3 p-4 rounded-2xl border transition-colors ${
                      isBranchSelected
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-brand/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="branchSelection"
                          checked={isBranchSelected}
                          onChange={() => handleBranchSelect(branchId)}
                          className="w-4 h-4 text-brand focus:ring-brand"
                        />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                          {group.branchName || 'Showroom Branch'}
                        </h4>
                      </label>
                      {isBranchSelected && (
                        <span className="text-sm font-black text-brand">
                          ${group.total.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {group.items.map((item) => {
                      const itemId = item.id || item.productId;
                      const isSelected = isBranchSelected && selectedItemIds.has(itemId);
                      return (
                        <div
                          key={itemId}
                          className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                            isSelected
                              ? 'bg-white dark:bg-slate-800 shadow-sm'
                              : 'opacity-70 hover:opacity-100 grayscale hover:grayscale-0'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleItemToggle(itemId, branchId)}
                            className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer shrink-0"
                          />
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-xl bg-white dark:bg-slate-700 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            {/* Specific Variant Attributes / Options Badges */}
                            {item.selectedOptions && item.selectedOptions.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.selectedOptions.map((opt, optIdx) => (
                                  <span
                                    key={optIdx}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand/10 dark:bg-brand/15 text-brand dark:text-brand-400 text-[10px] font-semibold border border-brand/20"
                                  >
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">{opt.groupName}:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{opt.choiceLabel}</span>
                                    {opt.additionalPrice > 0 && (
                                      <span className="text-[9px] text-brand font-bold">
                                        (+${opt.additionalPrice.toFixed(2)})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ) : item.specifications && Object.keys(item.specifications).length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(item.specifications).slice(0, 2).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]"
                                  >
                                    <span className="text-slate-400 font-normal mr-1">{k}:</span>
                                    <span className="font-semibold">
                                      {typeof v === 'object' && v !== null ? (v as any).value || (v as any).name : String(v)}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            {/* Quantity Stepper & Price info */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.quantity > 1) {
                                      updateQuantity(itemId, item.quantity - 1);
                                    } else {
                                      handleRemoveItem(itemId);
                                    }
                                  }}
                                  className="w-6 h-6 rounded-none text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 p-0"
                                  title={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-xs font-bold text-slate-900 dark:text-white px-2 min-w-[20px] text-center select-none">
                                  {item.quantity}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const max = item.availableStock || 999;
                                    if (item.quantity < max) {
                                      updateQuantity(itemId, item.quantity + 1);
                                    }
                                  }}
                                  disabled={item.quantity >= (item.availableStock || 999)}
                                  className="w-6 h-6 rounded-none text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 p-0 disabled:opacity-30"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                × ${Number(item.unitPrice).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end justify-between h-full gap-1 shrink-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">
                              ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(itemId);
                              }}
                              className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 shrink-0"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer Checkout Button */}
          {items.length > 0 && selectedBranchId && selectedItemIds.size > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={creatingDraftOrder}
                onClick={async () => {
                  setCreatingDraftOrder(true);
                  try {
                    const selectedItems = items.filter((i) =>
                      (i.branchId || 'unknown') === selectedBranchId &&
                      selectedItemIds.has(i.id || i.productId)
                    );

                    const shoppingPayload = buildShoppingOrderPayload(selectedItems, {
                      branchId: selectedBranchId,
                      companyId: user?.companyId,
                    });

                    let createdOrderId: string | undefined = undefined;
                    try {
                      const res = await createShoppingOrder(shoppingPayload, consumerToken || undefined);
                      const draftOrder = Array.isArray(res?.body) ? res.body[0] : (res?.body || res?.data || res?.order_detail || res);
                      createdOrderId =
                        draftOrder?.order_id ||
                        draftOrder?.order_number ||
                        draftOrder?.id ||
                        res?.order_id;

                      if (typeof window !== 'undefined' && createdOrderId) {
                        sessionStorage.setItem('romluos_active_draft_order_id', createdOrderId);
                        sessionStorage.setItem('romluos_active_draft_order', JSON.stringify(draftOrder));
                      }
                    } catch (apiErr) {
                      console.warn('API error creating draft order, fallback to local flow:', apiErr);
                    }

                    onClose();
                    if (onCheckout) {
                      onCheckout(selectedBranchId, Array.from(selectedItemIds), createdOrderId);
                    } else if (onOpenFinancing) {
                      onOpenFinancing(selectedBranchId, Array.from(selectedItemIds));
                    } else {
                      const params = new URLSearchParams();
                      if (selectedBranchId) params.set('branchId', selectedBranchId);
                      if (selectedItemIds.size > 0) params.set('items', Array.from(selectedItemIds).join(','));
                      if (createdOrderId) params.set('orderId', createdOrderId);
                      router.push(`${checkoutUrl}?${params.toString()}`);
                    }
                  } finally {
                    setCreatingDraftOrder(false);
                  }
                }}
                className="w-full text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-brand/20 cursor-pointer border border-transparent [background:linear-gradient(#ffffff,#ffffff)_padding-box,linear-gradient(135deg,#A9CB37_0%,#0077FF_100%)_border-box] dark:[background:linear-gradient(#0f172a,#0f172a)_padding-box,linear-gradient(135deg,#A9CB37_0%,#0077FF_100%)_border-box] hover:shadow-lg hover:shadow-brand/20 transition-all group cursor-pointer"
              >
                {creatingDraftOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 text-brand-600 dark:text-brand animate-spin" />
                    <span className="font-bold text-brand-600 dark:text-brand">Creating Draft Order...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-brand-600 dark:text-brand" />
                    <span className="font-bold bg-gradient-to-r from-brand-700 via-brand-600 to-brand-blue-600 dark:from-brand dark:via-brand-200 dark:to-brand-blue bg-clip-text text-transparent">Proceed to Checkout (${selectedTotal.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4 ml-1 text-brand-600 dark:text-brand" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
