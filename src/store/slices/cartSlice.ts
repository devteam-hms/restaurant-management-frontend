import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MenuItem } from '@/types/menu';

export interface CartItem {
  menu: MenuItem;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  branchId: string | null;
  totalCount: number;
  subtotal: number;
  estimatedTax: number;
  total: number;
}

const CART_STORAGE_KEY = 'rms_dining_cart';
const CART_BRANCH_KEY = 'rms_dining_branch';

function loadInitialCart(): { items: CartItem[]; branchId: string | null } {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      const storedBranch = localStorage.getItem(CART_BRANCH_KEY);
      return {
        items: stored ? JSON.parse(stored) : [],
        branchId: storedBranch || null,
      };
    } catch {
      // ignore
    }
  }
  return { items: [], branchId: null };
}

const initialData = loadInitialCart();

function calculateTotals(items: CartItem[]) {
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.menu.price * item.quantity, 0);
  const estimatedTax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + estimatedTax;
  return { totalCount, subtotal, estimatedTax, total };
}

const initialTotals = calculateTotals(initialData.items);

const initialState: CartState = {
  items: initialData.items,
  branchId: initialData.branchId,
  ...initialTotals,
};

function persistToStorage(items: CartItem[], branchId: string | null) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      if (branchId) {
        localStorage.setItem(CART_BRANCH_KEY, branchId);
      } else {
        localStorage.removeItem(CART_BRANCH_KEY);
      }
    } catch {
      // ignore
    }
  }
}

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (
      state,
      action: PayloadAction<{ menu: MenuItem; branchId: string; quantity?: number }>
    ) => {
      const { menu, branchId, quantity = 1 } = action.payload;

      // If branch changed and cart has items from another branch, reset branch
      if (state.branchId && state.branchId !== branchId && state.items.length > 0) {
        // Handled by UI or can be cleared
      }

      state.branchId = branchId;
      const idx = state.items.findIndex((i) => i.menu.id === menu.id);
      if (idx !== -1) {
        state.items[idx].quantity += quantity;
      } else {
        state.items.push({ menu, quantity });
      }

      const totals = calculateTotals(state.items);
      Object.assign(state, totals);
      persistToStorage(state.items, state.branchId);
    },

    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.menu.id !== action.payload);
      if (state.items.length === 0) {
        state.branchId = null;
      }
      const totals = calculateTotals(state.items);
      Object.assign(state, totals);
      persistToStorage(state.items, state.branchId);
    },

    updateQuantity: (state, action: PayloadAction<{ menuId: string; delta: number }>) => {
      const { menuId, delta } = action.payload;
      const idx = state.items.findIndex((i) => i.menu.id === menuId);
      if (idx !== -1) {
        const nextQty = state.items[idx].quantity + delta;
        if (nextQty <= 0) {
          state.items.splice(idx, 1);
        } else {
          state.items[idx].quantity = nextQty;
        }
      }
      if (state.items.length === 0) {
        state.branchId = null;
      }
      const totals = calculateTotals(state.items);
      Object.assign(state, totals);
      persistToStorage(state.items, state.branchId);
    },

    clearCart: (state) => {
      state.items = [];
      state.branchId = null;
      state.totalCount = 0;
      state.subtotal = 0;
      state.estimatedTax = 0;
      state.total = 0;
      persistToStorage([], null);
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
