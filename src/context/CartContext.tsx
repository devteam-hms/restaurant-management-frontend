import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MenuItem } from '@/types/menu';
import { useToast } from './ToastContext';

export interface CartItem {
  menu: MenuItem;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  branchId: string | null;
  addItem: (menu: MenuItem, branchId: string, quantity?: number) => void;
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  estimatedTax: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = 'rms_dining_cart';
const CART_BRANCH_KEY = 'rms_dining_branch';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const { success, warning } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      const storedBranch = localStorage.getItem(CART_BRANCH_KEY);
      if (stored) setItems(JSON.parse(stored));
      if (storedBranch) setBranchId(storedBranch);
    } catch (e) {
      console.error('Failed to load cart', e);
    }
  }, []);

  const persistCart = (newItems: CartItem[], newBranch: string | null) => {
    setItems(newItems);
    setBranchId(newBranch);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    if (newBranch) {
      localStorage.setItem(CART_BRANCH_KEY, newBranch);
    } else {
      localStorage.removeItem(CART_BRANCH_KEY);
    }
  };

  const addItem = useCallback(
    (menu: MenuItem, newBranchId: string, quantity = 1) => {
      if (branchId && branchId !== newBranchId && items.length > 0) {
        warning(
          'Different Restaurant Location',
          'Your cart currently contains selections from another branch. Clear your current order to switch locations.'
        );
        return;
      }

      const existingIdx = items.findIndex((i) => i.menu.id === menu.id);
      let updated: CartItem[];

      if (existingIdx !== -1) {
        updated = items.map((i, idx) =>
          idx === existingIdx ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        updated = [...items, { menu, quantity }];
      }

      persistCart(updated, newBranchId);
      success('Course Added to Selection', `${menu.menu_name} (x${quantity})`);
    },
    [branchId, items, success, warning]
  );

  const updateQuantity = useCallback(
    (menuId: string, delta: number) => {
      const updated = items
        .map((item) => {
          if (item.menu.id === menuId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);

      const nextBranch = updated.length === 0 ? null : branchId;
      persistCart(updated, nextBranch);
    },
    [branchId, items]
  );

  const removeItem = useCallback(
    (menuId: string) => {
      const updated = items.filter((i) => i.menu.id !== menuId);
      const nextBranch = updated.length === 0 ? null : branchId;
      persistCart(updated, nextBranch);
    },
    [branchId, items]
  );

  const clearCart = useCallback(() => {
    persistCart([], null);
  }, []);

  const totalCount = items.reduce((acc, cur) => acc + cur.quantity, 0);
  const subtotal = items.reduce((acc, cur) => acc + cur.menu.price * cur.quantity, 0);
  const estimatedTax = Math.round(subtotal * 0.125 * 100) / 100;
  const total = subtotal + estimatedTax;

  return (
    <CartContext.Provider
      value={{
        items,
        branchId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        estimatedTax,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

