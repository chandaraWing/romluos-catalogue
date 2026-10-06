'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import {
  buildShoppingOrderPayload,
  checkoutShoppingOrder,
  createShoppingOrder,
  DEFAULT_CHECKOUT_METADATA,
  DEFAULT_MOCK_DELIVERY,
  DEFAULT_MOCK_PAYMENT,
  updateShoppingOrder,
} from '@/lib/order-service';
import { formatCurrency } from '@/lib/utils';
import { Role } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface BankerCartViewProps {
  isPublicCheckout?: boolean;
  branchId?: string | null;
  itemIds?: string[] | null;
  title?: string;
  subtitle?: string;
  backUrl?: string;
  backLabel?: string;
}

export const BankerCartView: React.FC<BankerCartViewProps> = ({
  isPublicCheckout = false,
  branchId: propBranchId,
  itemIds: propItemIds,
  title,
  subtitle,
  backUrl,
  backLabel,
}) => {
  const { user, consumerToken } = useAuth();
  const searchParams = useSearchParams();

  // Active Draft Order from URL or LocalStorage
  const urlOrderId = searchParams.get('orderId');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(urlOrderId);
  const [isSyncingDraft, setIsSyncingDraft] = useState<boolean>(false);
  const [draftSynced, setDraftSynced] = useState<boolean>(false);
  const [draftOrderData, setDraftOrderData] = useState<any>(null);

  useEffect(() => {
    if (urlOrderId) {
      setActiveOrderId(urlOrderId);
    } else if (typeof window !== 'undefined') {
      const stored =
        sessionStorage.getItem('romluos_active_draft_order_id') ||
        localStorage.getItem('romluos_active_draft_order_id');
      if (stored) setActiveOrderId(stored);
    }
  }, [urlOrderId]);

  // Determine branch and items filters from props or URL search params
  const activeBranchId = propBranchId || searchParams.get('branchId') || null;
  const activeItemIds = useMemo(() => {
    if (propItemIds && propItemIds.length > 0) return propItemIds;
    const urlItems = searchParams.get('items');
    if (urlItems) return urlItems.split(',').filter(Boolean);
    return null;
  }, [propItemIds, searchParams]);

  const {
    items: allCartItems,
    removeItem,
    updateQuantity,
    clearCart,
    downPaymentRate,
    setDownPaymentRate,
  } = useCart();

  // Filter items if specific branch or items were passed into checkout
  const displayItems = useMemo(() => {
    if (!activeBranchId && !activeItemIds) {
      return allCartItems;
    }
    return allCartItems.filter((item) => {
      const branchMatches = !activeBranchId || (item.branchId || 'unknown') === activeBranchId;
      const itemId = item.id || item.productId;
      const itemMatches =
        !activeItemIds ||
        activeItemIds.length === 0 ||
        activeItemIds.includes(itemId) ||
        activeItemIds.includes(item.productId);
      return branchMatches && itemMatches;
    });
  }, [allCartItems, activeBranchId, activeItemIds]);

  // Derived financial figures for the active items
  const sessionTotalItems = displayItems.reduce((acc, item) => acc + item.quantity, 0);
  const sessionTotalAmount = displayItems.reduce(
    (acc, item) => acc + Number(item.unitPrice) * item.quantity,
    0
  );
  const sessionDownPaymentAmount =
    Math.round(sessionTotalAmount * downPaymentRate * 100) / 100;
  const sessionLoanPrincipal = sessionTotalAmount - sessionDownPaymentAmount;
  const sessionEstimatedMonthly =
    sessionTotalAmount > 0
      ? Math.round(((sessionLoanPrincipal * 1.052) / 24) * 100) / 100
      : 0;

  // Active Branch Name and ID
  const targetBranchId = displayItems[0]?.branchId || activeBranchId || user?.branchId;
  const branchName =
    displayItems[0]?.branchName || user?.branchName || 'Authorized Showroom';

  // District Bankers state
  const [bankers, setBankers] = useState<any[]>([]);
  const [selectedBankerId, setSelectedBankerId] = useState<string>('');
  const [loadingBankers, setLoadingBankers] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBankers() {
      if (!targetBranchId) return;
      try {
        setLoadingBankers(true);
        if (user && user.id) {
          const currentBanker = {
            id: user.id,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'District Banker',
            email: user.email || 'banker@nationalbank.com.kh',
            phone: user.phone || '+855 23 888 999',
            branchName: branchName || user.branchName || '',
          };
          if (isMounted) {
            setBankers([currentBanker]);
            setSelectedBankerId(currentBanker.id);
          }
        } else {
          const fallbackBanker = {
            id: 'banker-default-01',
            fullName: 'Sokha Mean',
            email: 'sokha.mean@nationalbank.com.kh',
            phone: '+855 23 888 999',
            branchName: branchName,
          };
          if (isMounted) {
            setBankers([fallbackBanker]);
            setSelectedBankerId(fallbackBanker.id);
          }
        }
      } catch {
        if (isMounted) {
          const fallbackBanker = {
            id: 'banker-default-01',
            fullName: 'Sokha Mean',
            email: 'sokha.mean@nationalbank.com.kh',
            phone: '+855 23 888 999',
            branchName: branchName,
          };
          setBankers([fallbackBanker]);
          setSelectedBankerId(fallbackBanker.id);
        }
      } finally {
        if (isMounted) setLoadingBankers(false);
      }
    }
    loadBankers();
    return () => {
      isMounted = false;
    };
  }, [targetBranchId, branchName, user?.id]);

  // Automatic Draft Order Synchronization on Checkout Load
  const syncDraftOrder = useCallback(async () => {
    if (!activeOrderId) return;
    const orderIdToSync = String(activeOrderId);

    setIsSyncingDraft(true);
    try {
      console.log('[BankerCartView] Updating draft order with delivery info:', orderIdToSync);
      const updateRes = await updateShoppingOrder(
        orderIdToSync,
        {
          order_id: orderIdToSync,
          delivery: DEFAULT_MOCK_DELIVERY,
          payment: DEFAULT_MOCK_PAYMENT,
        },
        consumerToken || undefined
      );

      const isSuccess =
        updateRes &&
        updateRes.result !== false &&
        (updateRes.result === true ||
          updateRes.result_code === '200' ||
          updateRes.result_code === 200 ||
          updateRes.code === 200 ||
          updateRes.body ||
          updateRes.data);

      if (isSuccess) {
        setDraftSynced(true);
        setDraftOrderData(updateRes?.body || updateRes?.data || updateRes);
      } else {
        setDraftSynced(false);
      }
    } catch (err) {
      console.warn('Draft order auto-update error:', err);
      setDraftSynced(false);
    } finally {
      setIsSyncingDraft(false);
    }
  }, [activeOrderId, consumerToken]);

  useEffect(() => {
    syncDraftOrder();
  }, [syncDraftOrder]);

  const selectedBanker = bankers.find((b) => b.id === selectedBankerId) || bankers[0];

  // Customer Form Fields
  const [customerRefId, setCustomerRefId] = useState(
    () => 'CUST-' + Math.floor(100000 + Math.random() * 900000)
  );
  const [customerName, setCustomerName] = useState(() => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return 'Robert Langdon';
  });
  const [customerPhone, setCustomerPhone] = useState(
    () => user?.phone || '+855 12 345 678'
  );
  const [customerEmail, setCustomerEmail] = useState(
    () => user?.email || 'customer@romluos.com'
  );
  const [notes, setNotes] = useState(
    '24-month device financing package with showroom stock reservation'
  );

  // Request Submission State
  const [submitting, setSubmitting] = useState(false);
  const [completedPaymentUrl, setCompletedPaymentUrl] = useState<string | null>(null);

  const handleSubmitFinancingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayItems.length === 0) return;
    setSubmitting(true);
    setCompletedPaymentUrl(null);

    // Pre-open new tab synchronously on click to bypass browser popup blockers
    const popupTab = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;

    try {
      let finalOrderId = activeOrderId;

      if (!finalOrderId) {
        const shoppingPayload = buildShoppingOrderPayload(displayItems, {
          companyId: user?.companyId || '',
          branchId: activeBranchId || user?.branchId || '',
          paymentMethod: 'RML',
          riderNote: notes,
          deliveryAddress: customerName ? `${customerName} - ${customerPhone}` : undefined,
        });

        const res = await createShoppingOrder(shoppingPayload, consumerToken || undefined);
        const draftOrder = Array.isArray(res?.body) ? res.body[0] : (res?.body || res?.data || res?.order_detail || res);
        finalOrderId =
          draftOrder?.order_id ||
          draftOrder?.order_number ||
          draftOrder?.id ||
          `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;
      }

      // Update draft order with customer notes & mock delivery
      if (finalOrderId) {
        try {
          const updateDeliveryRes = await updateShoppingOrder(
            finalOrderId,
            {
              order_id: finalOrderId,
              delivery: {
                ...DEFAULT_MOCK_DELIVERY,
                rider_note: notes,
              },
              payment: DEFAULT_MOCK_PAYMENT,
            },
            consumerToken || undefined
          );

          const updateSuccess =
            updateDeliveryRes &&
            updateDeliveryRes.result !== false &&
            (updateDeliveryRes.result === true ||
              updateDeliveryRes.result_code === '200' ||
              updateDeliveryRes.result_code === 200 ||
              updateDeliveryRes.code === 200 ||
              updateDeliveryRes.body ||
              updateDeliveryRes.data);

          if (!updateSuccess) {
            if (popupTab && !popupTab.closed) popupTab.close();
            const err = updateDeliveryRes?.result_message || 'Failed to update delivery information';
            toast.error(err);
            return;
          }
          setDraftSynced(true);
        } catch (uErr: any) {
          if (popupTab && !popupTab.closed) popupTab.close();
          console.warn('Update delivery information error:', uErr);
          toast.error(uErr?.message || 'Failed to update delivery information');
          return;
        }
      }

      // Call checkout API
      if (finalOrderId) {
        try {
          const checkoutRes = await checkoutShoppingOrder(
            finalOrderId,
            DEFAULT_CHECKOUT_METADATA,
            consumerToken || undefined
          );

          const isCheckoutSuccess =
            checkoutRes &&
            checkoutRes.result !== false &&
            (checkoutRes.result === true ||
              checkoutRes.result_code === '200' ||
              checkoutRes.result_code === 200 ||
              checkoutRes.code === 200 ||
              checkoutRes.payment_redirect_web_url ||
              checkoutRes.body?.payment_redirect_web_url);

          const paymentRedirectWebUrl =
            checkoutRes?.payment_redirect_web_url ||
            checkoutRes?.body?.payment_redirect_web_url ||
            null;

          const hasValidRedirectUrl =
            typeof paymentRedirectWebUrl === 'string' &&
            paymentRedirectWebUrl.trim().length > 0 &&
            (paymentRedirectWebUrl.startsWith('http://') || paymentRedirectWebUrl.startsWith('https://'));

          if (isCheckoutSuccess && hasValidRedirectUrl && paymentRedirectWebUrl) {
            setCompletedPaymentUrl(paymentRedirectWebUrl);
            toast.success('Redirecting to Wing payment checkout...');

            let tabOpened = false;
            if (popupTab && !popupTab.closed) {
              try {
                popupTab.location.href = paymentRedirectWebUrl;
                popupTab.focus();
                tabOpened = true;
              } catch (e) {
                console.warn('Popup redirect warning:', e);
              }
            }

            // If popup was blocked or failed, directly navigate the current page to the payment gateway
            if (!tabOpened && typeof window !== 'undefined') {
              window.location.href = paymentRedirectWebUrl;
            }
          } else {
            if (popupTab && !popupTab.closed) popupTab.close();
            if (!isCheckoutSuccess) {
              const errMsg = checkoutRes?.result_message || 'Failed to complete checkout process';
              toast.error(errMsg);
              return;
            }
            if (checkoutRes?.result_message) {
              toast.info(checkoutRes.result_message);
            }
          }
        } catch (checkoutErr: any) {
          if (popupTab && !popupTab.closed) popupTab.close();
          console.warn('Checkout API request error:', checkoutErr);
          const errMsg = checkoutErr?.message || 'Failed to complete checkout process';
          toast.error(errMsg);
          return;
        }
      }

      displayItems.forEach((i) => removeItem(i.id || i.productId));
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('romluos_active_draft_order_id');
        sessionStorage.removeItem('romluos_active_draft_order');
        localStorage.removeItem('romluos_active_draft_order_id');
        localStorage.removeItem('romluos_active_draft_order');
      }
    } catch (err: any) {
      if (popupTab && !popupTab.closed) popupTab.close();
      console.warn('Live shopping order flow error:', err);
      toast.error(err?.message || 'Failed to process checkout');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultBackUrl = isPublicCheckout ? '/' : '/';
  const defaultBackLabel = isPublicCheckout ? 'Back to Catalog' : 'Back to Device Catalog';

  if (
    !isPublicCheckout &&
    user &&
    user.role !== Role.DISTRICT_BANKER &&
    user.role !== Role.SUPER_ADMIN &&
    user.role !== Role.SYSTEM_ADMIN
  ) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          You do not have clearance to access the District Banker Financing Cart. This portal is restricted to accredited District Bankers and Financial Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={backUrl || defaultBackUrl}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-white transition-colors mb-2 group font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            {backLabel || defaultBackLabel}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-brand" />
            {title || (isPublicCheckout ? 'Order Checkout & Financing Builder' : 'Customer Financing Cart & Request Builder')}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {displayItems.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-sm">
          {completedPaymentUrl ? (
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-black">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Checkout Initialized!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your order draft is ready and stock is reserved. If your browser didn&apos;t automatically open the new tab, click below:
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  type="button"
                  onClick={() => window.open(completedPaymentUrl, '_blank')}
                  className="h-12 px-6 rounded-xl bg-accent-gradient text-white font-extrabold text-xs shadow-lg shadow-brand/25 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Wing Payment Checkout</span>
                </Button>
                <Link
                  href={backUrl || defaultBackUrl}
                  className="h-12 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Back to Catalog</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 mx-auto flex items-center justify-center text-slate-400 dark:text-slate-500">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isPublicCheckout ? 'Your Checkout Cart is Empty' : 'Your Financing Cart is Empty'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Browse our electronics catalog to add smartphones, laptops, or accessories to your proposal.
              </p>
              <Link
                href={backUrl || defaultBackUrl}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-gradient text-white font-bold text-xs shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Open Device Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Draft Order & Mock Delivery Status Banner */}
            {activeOrderId && (
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-brand/40 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Draft Order Delivery & Payment (Instant Sync)
                    </span>
                  </div>
                  {isSyncingDraft ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-brand font-semibold animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Updating Delivery...
                    </span>
                  ) : draftSynced ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Delivery Info Synchronized
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => syncDraftOrder()}
                      className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry Sync Delivery
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Draft Order ID</div>
                    <div className="font-mono font-bold text-brand mt-0.5 truncate">{activeOrderId}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand" /> Delivery Address
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {DEFAULT_MOCK_DELIVERY.address}
                    </div>
                    <div className="text-[10px] text-slate-400">Instant Delivery ($0.00)</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Payment Config</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {DEFAULT_MOCK_PAYMENT.payment_method}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {DEFAULT_MOCK_PAYMENT.payment_card_id}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Selected Items ({sessionTotalItems})
                  </span>
                  {activeBranchId && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand/10 text-brand border border-brand/20">
                      {branchName}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {displayItems.map((item) => {
                  const itemKey = item.id || item.productId;
                  return (
                    <div key={itemKey} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            SKU: {item.sku} • {item.brand} {item.branchName ? `• ${item.branchName}` : ''}
                          </div>

                          {/* Selected Variant Options Badges */}
                          {item.selectedOptions && item.selectedOptions.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-2 max-w-md">
                              {item.selectedOptions.map((opt, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-200"
                                >
                                  <span className="text-slate-500 dark:text-slate-400 font-medium">{opt.groupName}:</span>
                                  <span className="font-semibold text-slate-900 dark:text-white">{opt.choiceLabel}</span>
                                  {opt.additionalPrice > 0 ? (
                                    <span className="text-brand font-bold">
                                      (+{formatCurrency(opt.additionalPrice)})
                                    </span>
                                  ) : (
                                    <span className="text-brand-blue-600 dark:text-brand-blue-400 text-[9px] font-medium">
                                      (Included)
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          ) : item.specifications ? (
                            <div className="flex flex-wrap gap-1 mt-1.5 max-w-md">
                              {Object.entries(item.specifications).slice(0, 3).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-600 dark:text-slate-300"
                                >
                                  {typeof v === 'object' && v !== null ? v.value || v.name : String(v)}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <div className="text-[11px] text-brand font-bold mt-1.5">
                            {formatCurrency(item.unitPrice)} each
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800/60">
                        {/* Quantity Controller */}
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                            className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-900 dark:text-white px-2">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.availableStock}
                            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                            className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right min-w-[90px]">
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {item.availableStock} in stock
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(itemKey)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Down Payment & Loan Calculator */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Banknote className="w-4 h-4 text-brand" />
                Financing Structure & Down Payment Options
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0.1, 0.2, 0.3, 0.4].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setDownPaymentRate(rate)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      downPaymentRate === rate
                        ? 'bg-brand/10 border-brand text-brand font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-extrabold">{rate * 100}% Down</div>
                    <div className="text-[11px] mt-0.5">{formatCurrency(sessionTotalAmount * rate)}</div>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-brand/5 dark:bg-slate-950 border border-brand/20 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-brand dark:text-brand">24-Month Installment Term Estimate</div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Financed Principal: {formatCurrency(sessionTotalAmount - sessionDownPaymentAmount)} @ 5.2% APR
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {formatCurrency(sessionEstimatedMonthly)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Info & Reservation Submit */}
          <div className="space-y-4">
            <form
              onSubmit={handleSubmitFinancingRequest}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
            >
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Customer Applicant Information
              </div>

              <div className="space-y-3 text-xs">
                {/* Assigned District Banker Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-medium">
                      District Banker
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Branch Assigned
                    </span>
                  </div>

                  {loadingBankers ? (
                    <div className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      <span>Loading branch bankers...</span>
                    </div>
                  ) : bankers.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <select
                          value={selectedBankerId}
                          onChange={(e) => setSelectedBankerId(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer pr-8"
                        >
                          {bankers.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.fullName || `${b.firstName} ${b.lastName}`} ({b.branchName || branchName})
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <Landmark className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {selectedBanker && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {selectedBanker.fullName || `${selectedBanker.firstName} ${selectedBanker.lastName}`}
                            </span>
                            <span className="text-slate-400 ml-1.5 text-[10px]">
                              {selectedBanker.phone || selectedBanker.email}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                            District Banker
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-between">
                      <span>District Banker ({branchName})</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Assigned
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Order / Application Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none"
                  />
                </div>
              </div>

              {/* Summary Totals */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Gross Total:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(sessionTotalAmount)}</span>
                </div>
                <div className="flex justify-between text-brand font-semibold">
                  <span>Down Payment ({downPaymentRate * 100}%):</span>
                  <span className="font-bold">{formatCurrency(sessionDownPaymentAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Financed Balance:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(sessionTotalAmount - sessionDownPaymentAmount)}
                  </span>
                </div>
              </div>

              {/* Stock Reservation Assurance Note */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  Submitting this proposal locks inventory at <b>{branchName}</b> and redirects directly to payment checkout.
                </span>
              </div>

              <Button
                type="submit"
                disabled={submitting || isSyncingDraft || displayItems.length === 0 || (!!activeOrderId && !draftSynced)}
                className="w-full h-12 rounded-xl bg-accent-gradient hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-xs shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment Redirect...</span>
                  </>
                ) : isSyncingDraft ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Delivery Info...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>Proceed to Payment</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
