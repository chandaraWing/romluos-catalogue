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
    rider_note: string;
    delivery_option_id: string;
    address: string;
    logo_path: string | null;
    subtitle: string | null;
    courier_type: string;
    delivery_fee: number;
    latitude: number | null;
    longitude: number | null;
    delivery_address_id: string;
    scheduled_delivery_date: string | null;
  };
  scheduled_delivery_date: string;
  items: ShoppingOrderItem[];
}

export interface CreateShoppingOrderPayload {
  delivery: {
    rider_note: string;
    delivery_option_id: string;
    address: string;
    logo_path: string | null;
    subtitle: string | null;
    courier_type: string;
    delivery_fee: number;
    latitude: number | null;
    longitude: number | null;
    delivery_address_id: string;
    scheduled_delivery_date: string | null;
  };
  payment: {
    payment_card_id: string;
    is_using_cod: boolean;
    device_payment: string;
    payment_method: string;
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
    const bId = item.branchId || options?.branchId || '47861';
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
        const itemId = i.variantId || i.id || i.productId;

        return {
          note: null,
          quantity: i.quantity,
          item_id: String(itemId),
          total_amount: totalAmount,
          product_id: String(i.productId),
          currency: i.currency || 'USD',
          cart_item_id: i.id || `buy-now-item-${itemId}`,
          unit_price: unitPrice,
          modifiers: [],
          promotion: null,
        };
      });

      const subtotal = orderItems.reduce((sum, item) => sum + item.total_amount, 0);

      return {
        service_type: 'ST_SHOPPING',
        business_id: options?.companyId || '47860',
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
          rider_note: options?.riderNote || '',
          delivery_option_id: '',
          address: options?.deliveryAddress || '',
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
      rider_note: options?.riderNote || '',
      delivery_option_id: '',
      address: options?.deliveryAddress || '',
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

export async function createShoppingOrder(
  payload: CreateShoppingOrderPayload,
  token?: string
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }
  return api.post('/api/orders/shopping', payload, { headers });
}
