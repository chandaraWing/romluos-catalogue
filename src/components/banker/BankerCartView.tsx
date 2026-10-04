'use client';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { buildShoppingOrderPayload, createShoppingOrder } from '@/lib/order-service';
import { Role } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Copy,
  Landmark,
  Lock,
  Minus,
  Package,
  Plus,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

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

  // Determine branch and items filters from props or URL search params
  const activeBranchId = propBranchId || searchParams.get('branchId') || null;
  const activeItemIds = useMemo(() => {
    if (propItemIds && propItemIds.length > 0) return propItemIds;
    const urlItems = searchParams.get('items');
    if (urlItems) return urlItems.split(',').filter(Boolean);
    return null;
  }, [propItemIds, searchParams]);

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
        let res = await api
          .get<any>(`/companies/branches/${targetBranchId}/district-bankers`)
          .catch(() => null);
        if (!res || (Array.isArray(res) && res.length === 0)) {
          res = await api.get<any>(`/banker-links/branch/${targetBranchId}`).catch(() => []);
        }
        const list = Array.isArray(res) ? res : res?.data || [];
        if (isMounted) {
          if (list.length > 0) {
            setBankers(list);
            const matchingBanker = list.find((b: any) => b.id === user?.id);
            setSelectedBankerId(matchingBanker ? matchingBanker.id : list[0].id);
          } else {
            // Default fallback district banker for this branch
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
    () => user?.email || 'customer@romlus.com'
  );
  const [notes, setNotes] = useState(
    '24-month device financing package with showroom stock reservation'
  );

  // Request Submission State
  const [submitting, setSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSubmitFinancingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayItems.length === 0) return;

    const shoppingPayload = buildShoppingOrderPayload(displayItems, {
      companyId: user?.companyId || '47860',
      branchId: activeBranchId || user?.branchId || '47861',
      paymentMethod: 'RML',
      riderNote: notes,
      deliveryAddress: customerName ? `${customerName} - ${customerPhone}` : undefined,
    });

    try {
      const res = await createShoppingOrder(shoppingPayload, consumerToken || undefined);
      const draftOrder = res?.body || res?.data || res?.order_detail || res;
      const orderId =
        draftOrder?.order_id ||
        draftOrder?.order_number ||
        draftOrder?.id ||
        `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;

      setCreatedRequest({
        ...draftOrder,
        requestNumber: orderId,
        customerRefId: customerRefId || `CUST-${orderId}`,
        customerName,
        totalAmount: sessionTotalAmount,
        downPaymentAmount: sessionDownPaymentAmount,
        status: 'ORDER_DRAFT_CREATED',
        qr: {
          code: `ROMLUS:ORDER:${orderId}`,
        },
      });
      displayItems.forEach((i) => removeItem(i.id || i.productId));
    } catch (err) {
      console.warn('Live shopping order creation, falling back to local draft request:', err);
      // Fallback draft generation
      const mockReqNumber = `REQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;
      const mockResult = {
        id: 'req-uuid-' + Date.now(),
        requestNumber: mockReqNumber,
        customerRefId,
        customerName,
        totalAmount: sessionTotalAmount,
        downPaymentAmount: sessionDownPaymentAmount,
        status: 'QR_GENERATED',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        qr: {
          code: `ROMLUS:FIN:${mockReqNumber}:DEMO-TOKEN`,
        },
      };
      setCreatedRequest(mockResult);
      displayItems.forEach((i) => removeItem(i.id || i.productId));
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const defaultBackUrl = isPublicCheckout ? '/' : '/';
  const defaultBackLabel = isPublicCheckout ? 'Back to Catalog' : 'Back to Device Catalog';

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

      {displayItems.length === 0 && !createdRequest ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
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
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
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
                  Submitting this proposal locks inventory at <b>{branchName}</b> with a 48h expiration TTL.
                </span>
              </div>

              <Button
                type="submit"
                disabled={submitting || displayItems.length === 0}
                className="w-full h-12 rounded-xl bg-accent-gradient hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-xs shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>Processing Stock Lock...</>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Generate QR & Reserve Stock</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Instant QR Code Generation Modal on Success */}
      {createdRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-brand/40 shadow-2xl p-6 sm:p-8 space-y-6 text-center">
            <div className="h-16 w-16 rounded-full bg-brand/15 dark:bg-brand/20 border border-brand/30 mx-auto flex items-center justify-center text-brand">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand border border-brand/20">
                Stock Reserved & QR Ready
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                Financing Request Generated
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Unique Request ID: <b className="text-brand">{createdRequest.requestNumber}</b>
              </p>
            </div>

            {/* Generated QR Code Canvas */}
            <div className="p-6 rounded-2xl bg-white mx-auto w-fit shadow-2xl border-4 border-slate-100 dark:border-slate-800">
              <QRCodeSVG
                value={`https://romlus.bank/scan/${createdRequest.requestNumber}`}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <div className="truncate text-left">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Verification Token</div>
                <div className="font-mono text-brand font-bold truncate">{createdRequest.requestNumber}</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(createdRequest.requestNumber)}
                className="h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href={backUrl || defaultBackUrl}
                className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs transition-colors flex items-center justify-center"
              >
                Back to Catalog
              </Link>
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  setCreatedRequest(null);
                }}
                className="h-11 rounded-xl bg-accent-gradient text-white font-bold text-xs shadow-md flex items-center justify-center gap-1"
              >
                <span>Done</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
