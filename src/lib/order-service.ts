import { api } from '@/lib/api';
import { CartItem } from '@/lib/cart-context';

export interface ShoppingOrderItem {
  note: string | null;
  quantity: number;
  item_id: string;
  total_amount: number;
  product_id: string;
  currency: string;
  cart_item_id: string;
  unit_price: number;
  modifiers: any[];
  promotion: any | null;
}

export interface ShoppingOrderGroup {
  service_type: string;
  business_id: string;
  branch_id: string;
  currency: string;
  exchange_rate: number;
  discount_amount: number;
  region_id: string;
  remark: string;
  platform: string;
  eta: string;
  total_amount: number;
  subtotal: number;
  unavailable_option: string;
  delivery: {
    delivery_option_id: string;
    address: string;
    logo_path?: string | null;
    title?: string | null;
    subtitle?: string | null;
    courier_type: string;
    delivery_fee: number;
    latitude: number | null;
    longitude: number | null;
    delivery_address_id: string;
    scheduled_delivery_date: string | null;
    rider_note?: string;
    ordering_type?: string;
  };
  scheduled_delivery_date: string;
  items: ShoppingOrderItem[];
}

export interface CreateShoppingOrderPayload {
  delivery: {
    delivery_option_id: string;
    address: string;
    logo_path?: string | null;
    title?: string | null;
    subtitle?: string | null;
    courier_type: string;
    delivery_fee: number;
    latitude: number | null;
    longitude: number | null;
    delivery_address_id: string;
    scheduled_delivery_date: string | null;
    rider_note?: string;
    ordering_type?: string;
  };
  payment?: {
    payment_card_id?: string;
    is_using_cod?: boolean;
    device_payment?: string;
    payment_method?: string;
  };
  orders: ShoppingOrderGroup[];
}

export function buildShoppingOrderPayload(
  items: CartItem[],
  options?: {
    companyId?: string;
    branchId?: string;
    paymentCardId?: string;
    paymentMethod?: string;
    regionId?: string;
    riderNote?: string;
    deliveryAddress?: string;
  }
): CreateShoppingOrderPayload {
  const branchGroups = new Map<string, CartItem[]>();

  items.forEach((item) => {
    const bId = item.branchId || options?.branchId || '';
    if (!branchGroups.has(bId)) {
      branchGroups.set(bId, []);
    }
    branchGroups.get(bId)!.push(item);
  });

  const orders: ShoppingOrderGroup[] = Array.from(branchGroups.entries()).map(
    ([branchId, groupItems]) => {
      const orderItems: ShoppingOrderItem[] = groupItems.map((i) => {
        const unitPrice = Number(i.unitPrice || 0);
        const totalAmount = unitPrice * i.quantity;
        const variantId = i.variantId || i.productId;
        const itemId = String(variantId);

        return {
          note: null,
          quantity: i.quantity,
          item_id: itemId,
          total_amount: totalAmount,
          product_id: String(i.productId),
          currency: i.currency || 'USD',
          cart_item_id: `buy-now-item-${itemId}`,
          unit_price: unitPrice,
          modifiers: [],
          promotion: null,
        };
      });

      const subtotal = orderItems.reduce((sum, item) => sum + item.total_amount, 0);

      return {
        service_type: 'ST_SHOPPING',
        business_id: options?.companyId || '',
        branch_id: branchId,
        currency: 'USD',
        exchange_rate: 4000,
        discount_amount: 0,
        region_id: options?.regionId || 'RCO-260400000016214',
        remark: '',
        platform: 'UNIFIED',
        eta: '',
        total_amount: subtotal,
        subtotal: subtotal,
        unavailable_option: 'CANCEL_THE_ENTIRE_ORDER',
        delivery: {
          rider_note: '',
          delivery_option_id: '',
          address: '',
          logo_path: null,
          subtitle: null,
          courier_type: '',
          delivery_fee: 0,
          latitude: null,
          longitude: null,
          delivery_address_id: '',
          scheduled_delivery_date: null,
        },
        scheduled_delivery_date: '',
        items: orderItems,
      };
    }
  );

  return {
    delivery: {
      rider_note: '',
      delivery_option_id: '',
      address: '',
      logo_path: null,
      subtitle: null,
      courier_type: '',
      delivery_fee: 0,
      latitude: null,
      longitude: null,
      delivery_address_id: '',
      scheduled_delivery_date: null,
    },
    payment: {
      payment_card_id: options?.paymentCardId || 'POP-262737310663101',
      is_using_cod: false,
      device_payment: '',
      payment_method: options?.paymentMethod || 'RML',
    },
    orders,
  };
}

export const DEFAULT_DEVICE_ID = 'Wm3_CSP1A.210812.016';

export const DEFAULT_INITIAL_DELIVERY = {
  rider_note: '',
  delivery_option_id: '',
  address: '',
  logo_path: null,
  subtitle: null,
  courier_type: '',
  delivery_fee: 0,
  latitude: null,
  longitude: null,
  delivery_address_id: '',
  scheduled_delivery_date: null,
};

export const DEFAULT_MOCK_DELIVERY = {
  address: 'Wing Bank',
  latitude: 11.541713,
  longitude: 104.922465,
  delivery_address_id: 'ADD-262750000475391',
  delivery_fee: 0,
  rider_note: '',
  logo_path: null,
  subtitle: null,
  scheduled_delivery_date: null,
  delivery_option_id: 'DOP-622749334039948',
  courier_type: 'instant_delivery',
};

export const DEFAULT_MOCK_PAYMENT = {
  payment_card_id: 'POP-262737310663101',
  is_using_cod: false,
  device_payment: '',
  payment_method: 'RML',
};

export interface UpdateShoppingOrderPayload {
  order_id: string;
  delivery?: {
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    delivery_address_id?: string;
    delivery_fee?: number;
    rider_note?: string;
    logo_path?: string | null;
    subtitle?: string | null;
    scheduled_delivery_date?: string | null;
    delivery_option_id?: string;
    courier_type?: string;
  };
  payment?: {
    payment_card_id?: string;
    is_using_cod?: boolean;
    device_payment?: string;
    payment_method?: string;
  };
}

export async function createShoppingOrder(
  payload: CreateShoppingOrderPayload,
  token?: string
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'device-id': DEFAULT_DEVICE_ID,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }
  return api.post('/api/orders/shopping', payload, { headers });
}

export async function updateShoppingOrder(
  orderId: string,
  payload?: Partial<UpdateShoppingOrderPayload>,
  token?: string
): Promise<any> {
  const finalPayload: UpdateShoppingOrderPayload = {
    order_id: orderId,
    delivery: {
      ...DEFAULT_MOCK_DELIVERY,
      ...(payload?.delivery || {}),
    },
    payment: {
      ...DEFAULT_MOCK_PAYMENT,
      ...(payload?.payment || {}),
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'device-id': DEFAULT_DEVICE_ID,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  return api.post(`/api/orders/shopping/${encodeURIComponent(orderId)}/update`, finalPayload, { headers });
}

export const DEFAULT_CHECKOUT_METADATA = {
  metadata: {
    delivery_option: {
      delivery_fee: 0,
      delivery_option_id: 'DOP-622749334039948',
    },
    payment_option: {
      id: 'POP-262737310663101',
      title: {
        km: 'បង់រំលោះជាមួយ ធនាគារវីង',
        en: 'Romluos by Wingbank',
        zh: 'Wingbank 分期付款',
      },
      subtitle: {
        km: 'បង់រំលោះងាយៗប្រចាំខែ',
        en: 'Pay in easy monthly installments',
        zh: '轻松每月分期付款',
      },
      logo_path: 'raw/partner/USR-24283000000000001/profile/RES-262730003487451.png',
    },
  },
};

export async function checkoutShoppingOrder(
  orderId: string,
  payload?: any,
  token?: string
): Promise<any> {
  const finalPayload = payload || DEFAULT_CHECKOUT_METADATA;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'device-id': DEFAULT_DEVICE_ID,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  return api.post(
    `/api/orders/shopping/${encodeURIComponent(orderId)}/checkout`,
    finalPayload,
    { headers }
  );
}

