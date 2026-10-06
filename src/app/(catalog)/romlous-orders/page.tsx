'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate, formatImageUrl, getPreferredLocaleName } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface OrderItemLocale {
  id?: string;
  name: string;
  locale: string;
}

interface OrderItemDetail {
  id: string;
  item_id: string;
  product_id: string;
  unit_price: number;
  quantity: number;
  currency: string;
  total_amount: number;
  metadata?: {
    item_detail?: {
      id?: number | string;
      name?: string;
      price?: number;
      currency?: string;
      sku_code?: string;
      image_url?: string;
      stock_on_hand?: number;
      attribute_details?: Array<{
        name?: string;
        value?: {
          name?: string;
          image_url?: string;
          name_locales?: OrderItemLocale[];
        };
        name_locales?: OrderItemLocale[];
      }>;
    };
    product_detail?: {
      id?: string;
      current_price?: number;
      info_locales?: OrderItemLocale[];
      documents?: Array<{ file_url?: string }>;
    };
  };
}

interface OrderDeliveryAddress {
  id?: string;
  address?: string;
  waypoint?: 'ORIGIN' | 'DESTINATION';
  information_address?: string;
  address_detail?: {
    name?: string;
    information_address?: string;
  };
}

interface OrderDelivery {
  delivery_status?: string;
  logistic_type?: string;
  ordering_type?: string;
  delivery_addresses?: OrderDeliveryAddress[];
}

interface ConsumerOrderItem {
  order_id: string;
  user_id?: string;
  order_number: string;
  order_sequence_number?: string;
  service_type: string;
  order_status: string;
  currency: string;
  exchange_rate?: number;
  total_amount: number;
  placed_date: string;
  updated_date?: string;
  business_info?: {
    name_locales?: OrderItemLocale[];
    logo?: {
      file_url?: string;
    };
    eta?: string;
  };
  items: OrderItemDetail[];
  deliveries?: OrderDelivery[];
  business_id?: string;
  branch_id?: string;
}

const STATUS_FILTERS = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Placed', value: 'PLACED' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Delivering', value: 'DELIVERING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function RomlousOrdersPage() {
  const { consumerToken, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<ConsumerOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (consumerToken) {
        headers['Authorization'] = `Bearer ${consumerToken}`;
      }

      // Build custom status filter if active
      let filterParam = '';
      if (statusFilter !== 'ALL') {
        filterParam = JSON.stringify([
          { field: 'service_type', values: ['ST_SHOPPING'], condition: 'IN' },
          { field: 'order_status', values: [statusFilter], condition: 'IN' },
        ]);
      } else {
        filterParam = JSON.stringify([
          { field: 'service_type', values: ['ST_SHOPPING'], condition: 'IN' },
          {
            field: 'order_status',
            values: ['PLACED', 'CONFIRMED', 'DELIVERING', 'COMPLETED', 'CANCELLED'],
            condition: 'IN',
          },
        ]);
      }

      const res = await fetch(`/api/orders?page=1&rpp=50&filter=${encodeURIComponent(filterParam)}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch orders (${res.status})`);
      }

      const data = await res.json();
      if (data?.body?.items) {
        setOrders(data.body.items);
      } else if (Array.isArray(data?.items)) {
        setOrders(data.items);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error('Error loading orders:', err);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [consumerToken, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PLACED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>PLACED</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>CONFIRMED</span>
          </span>
        );
      case 'DELIVERING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Truck className="w-3 h-3" />
            <span>DELIVERING</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>COMPLETED</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 uppercase">
            {status || 'PENDING'}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const orderNum = order.order_number?.toLowerCase() || '';
    const seqNum = order.order_sequence_number?.toLowerCase() || '';
    const bizName = (getPreferredLocaleName(order.business_info?.name_locales) || '').toLowerCase();
    const itemNames = order.items
      ?.map((it) => {
        const pName = getPreferredLocaleName(it.metadata?.product_detail?.info_locales);
        const iName = it.metadata?.item_detail?.name;
        return `${pName} ${iName}`;
      })
      .join(' ')
      .toLowerCase();

    return orderNum.includes(q) || seqNum.includes(q) || bizName.includes(q) || itemNames.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080C14] text-slate-900 dark:text-slate-100 selection:bg-brand/20 selection:text-brand">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#080C14]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Showroom</span>
            </Link>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                  Rumluos Orders
                </h1>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Track showroom orders & delivery status
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-1.5"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {STATUS_FILTERS.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-brand dark:text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order #, merchant, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Orders Listing State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 sm:py-24 text-center rounded-3xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-inner">
              <Package className="w-8 h-8 text-brand" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                No orders found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No orders match your active filter criteria. Try clearing your search.'
                  : 'You have not placed any showroom shopping orders yet.'}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-slate-950 text-xs font-bold hover:brightness-105 transition-all shadow-md shadow-brand/20"
            >
              <Store className="w-4 h-4" />
              <span>Explore Showroom Catalog</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const bizName =
                getPreferredLocaleName(order.business_info?.name_locales) || 'Partner Merchant';
              const bizLogo = formatImageUrl(order.business_info?.logo?.file_url);
              const destination = order.deliveries?.[0]?.delivery_addresses?.find(
                (addr) => addr.waypoint === 'DESTINATION'
              );
              const destinationText =
                destination?.information_address || destination?.address || 'Showroom Address';

              return (
                <div
                  key={order.order_id}
                  className="rounded-3xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          {order.order_number}
                        </span>
                        {order.order_sequence_number && (
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {order.order_sequence_number}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-400">
                          {order.service_type || 'ST_SHOPPING'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Placed: {formatDate(order.placed_date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.order_status)}
                    </div>
                  </div>

                  {/* Merchant & Delivery Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                        {bizLogo ? (
                          <img src={bizLogo} alt={bizName} className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="w-4 h-4 text-brand" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Merchant Store
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {bizName}
                        </span>
                      </div>
                    </div>

                    {destinationText && (
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span className="truncate max-w-xs">{destinationText}</span>
                      </div>
                    )}
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/40">
                    {order.items?.map((it) => {
                      const itemDetail = it.metadata?.item_detail;
                      const productDetail = it.metadata?.product_detail;
                      const productName =
                        getPreferredLocaleName(productDetail?.info_locales) ||
                        itemDetail?.name ||
                        'Shopping Product';
                      const itemVariantName = itemDetail?.name;
                      const itemImage = formatImageUrl(
                        itemDetail?.image_url || productDetail?.documents?.[0]?.file_url
                      );

                      return (
                        <div key={it.id} className="pt-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shrink-0 overflow-hidden p-1">
                              {itemImage ? (
                                <img
                                  src={itemImage}
                                  alt={productName}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="space-y-0.5 min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {productName}
                              </h4>
                              {itemVariantName && itemVariantName !== productName && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  Variant: {itemVariantName}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400">
                                Qty: <strong className="text-slate-700 dark:text-slate-200">{it.quantity}</strong> × {formatCurrency(it.unit_price)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                              {formatCurrency(it.total_amount || it.unit_price * it.quantity)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Card Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
                    <div className="text-[11px] text-slate-400">
                      <span>Order ID: </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                        {order.order_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Total Paid
                        </span>
                        <span className="text-sm sm:text-base font-black text-brand-600 dark:text-brand">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
