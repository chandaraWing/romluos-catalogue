'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { CartStore, CartItemProps } from '@/types';

export type { CartStore, CartItemProps };

export interface CartItemOption {
  groupName: string;
  choiceLabel: string;
  additionalPrice: number;
}

export interface CartItem {
  id?: string;
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  image?: string;
  basePrice?: number;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  branchId: string;
  branchName: string;
  selectedOptions?: CartItemOption[];
  specifications?: Record<string, any>;
  discount?: { amount: number; type: string };
  promotionId?: string;
  promotionPrice?: number;
  promotionType?: string;
  currency?: string;
}

export function formatCartToStores(
  items: CartItem[],
  options?: {
    selectedIds?: Set<string> | string[];
    onSelect?: (itemId: string, checked: boolean) => void;
    onQuantityChange?: (itemId: string, qty: number) => void;
    onDelete?: (itemId: string) => void;
    onEditVariant?: (itemId: string) => void;
  }
): CartStore[] {
  const selectedSet = options?.selectedIds
    ? options.selectedIds instanceof Set
      ? options.selectedIds
      : new Set(options.selectedIds)
    : null;

  const branchMap = new Map<string, { branchName: string; items: CartItemProps[] }>();

  items.forEach((item) => {
    const branchId = item.branchId || 'default-branch';
    const itemId = item.id || item.productId;

    const attributesMap: Record<string, string | undefined> = {};
    const variantAttributesList: { key: string; value: string }[] = [];

    if (item.selectedOptions && item.selectedOptions.length > 0) {
      item.selectedOptions.forEach((opt) => {
        const key = opt.groupName.toLowerCase();
        attributesMap[key] = opt.choiceLabel;
        variantAttributesList.push({ key: opt.groupName, value: opt.choiceLabel });
      });
    }

    const cartItemProp: CartItemProps = {
      id: itemId,
      productId: item.productId,
      itemId: itemId,
      name: item.name,
      price: Number(item.unitPrice),
      originalPrice: item.basePrice !== undefined ? Number(item.basePrice) : Number(item.unitPrice),
      branchId: branchId,
      discount: item.discount,
      image: item.image || '',
      attributes: attributesMap,
      quantity: item.quantity,
      selected: selectedSet ? selectedSet.has(itemId) : true,
      onSelect: (checked: boolean) => options?.onSelect?.(itemId, checked),
      onQuantityChange: (newQuantity: number) => options?.onQuantityChange?.(itemId, newQuantity),
      onDelete: () => options?.onDelete?.(itemId),
      onEditVariant: () => options?.onEditVariant?.(itemId),
      stock: item.availableStock,
      isAvailable: (item.availableStock ?? 10) > 0,
      isUnavailable: (item.availableStock ?? 10) <= 0,
      isAllowBackOrder: false,
      readonly: false,
      hideCheckboxes: false,
      promotionId: item.promotionId,
      promotionPrice: item.promotionPrice,
      promotionType: item.promotionType,
      currency: item.currency || 'USD',
      variantAttributes: variantAttributesList.length > 0 ? variantAttributesList : undefined,
      variantId: item.variantId,
      hasVariantAttributes: variantAttributesList.length > 0,
    };

    if (!branchMap.has(branchId)) {
      branchMap.set(branchId, {
        branchName: item.branchName || 'Showroom Branch',
        items: [],
      });
    }

    branchMap.get(branchId)!.items.push(cartItemProp);
  });

  return Array.from(branchMap.entries()).map(([branchId, data]) => ({
    storeId: branchId,
    isOversea: false,
    items: data.items,
    branchAddress: {},
    branch: {
      id: branchId,
      name: data.branchName,
      address: {},
    },
  }));
}

interface CartContextValue {
  items: CartItem[];
  cartStores: CartStore[];
  getCartStores: (selectedIds?: Set<string> | string[]) => CartStore[];
  addItem: (item: CartItem) => void;
  removeItem: (itemIdOrProductId: string) => void;
  updateQuantity: (itemIdOrProductId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  downPaymentRate: number;
  setDownPaymentRate: (rate: number) => void;
  downPaymentAmount: number;
  estimatedMonthly: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  cartStores: [],
  getCartStores: () => [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalAmount: 0,
  downPaymentRate: 0.1,
  setDownPaymentRate: () => {},
  downPaymentAmount: 0,
  estimatedMonthly: 0,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [downPaymentRate, setDownPaymentRate] = useState<number>(0.1); // Default 10%

  useEffect(() => {
    const saved = localStorage.getItem('romluos_branch_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        setItems([]);
      }
    }
  }, []);

  const saveItems = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('romluos_branch_cart', JSON.stringify(newItems));
  };

  const getItemKey = (item: CartItem): string => {
    if (item.id) return item.id;
    const optionsKey =
      item.selectedOptions && item.selectedOptions.length > 0
        ? item.selectedOptions.map((o) => `${o.groupName}:${o.choiceLabel}`).sort().join('|')
        : item.variantId
        ? `var_${item.variantId}`
        : '';
    return optionsKey ? `${item.productId}_${optionsKey}` : item.productId;
  };

  const addItem = (newItem: CartItem) => {
    const key = getItemKey(newItem);
    const itemToInsert = { ...newItem, id: key };
    const existingIndex = items.findIndex((i) => (i.id || getItemKey(i)) === key);

    if (existingIndex > -1) {
      const updated = [...items];
      const maxAllowed = Math.min(
        updated[existingIndex].availableStock || 999,
        updated[existingIndex].quantity + (newItem.quantity || 1)
      );
      updated[existingIndex].quantity = maxAllowed;
      saveItems(updated);
    } else {
      saveItems([...items, itemToInsert]);
    }
  };

  const removeItem = useCallback((targetId: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => (i.id ? i.id !== targetId : i.productId !== targetId));
      localStorage.setItem('romluos_branch_cart', JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  const updateQuantity = useCallback((targetId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(targetId);
      return;
    }
    setItems((prev) => {
      const updated = prev.map((i) => {
        const isMatch = i.id ? i.id === targetId : i.productId === targetId;
        if (isMatch) {
          return { ...i, quantity: Math.min(i.availableStock || 999, quantity) };
        }
        return i;
      });
      localStorage.setItem('romluos_branch_cart', JSON.stringify(updated));
      return updated;
    });
  }, [removeItem]);

  const clearCart = () => {
    saveItems([]);
  };

  const getCartStores = useCallback(
    (selectedIds?: Set<string> | string[]): CartStore[] => {
      return formatCartToStores(items, {
        selectedIds,
        onQuantityChange: (id, q) => updateQuantity(id, q),
        onDelete: (id) => removeItem(id),
      });
    },
    [items, updateQuantity, removeItem]
  );

  const cartStores = useMemo(() => {
    return getCartStores();
  }, [getCartStores]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0);
  const downPaymentAmount = Math.round(totalAmount * downPaymentRate * 100) / 100;
  const loanPrincipal = totalAmount - downPaymentAmount;
  // 24-month loan estimate with 5.2% annual rate
  const estimatedMonthly = totalAmount > 0 ? Math.round(((loanPrincipal * 1.052) / 24) * 100) / 100 : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        cartStores,
        getCartStores,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        downPaymentRate,
        setDownPaymentRate,
        downPaymentAmount,
        estimatedMonthly,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
