import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { orderService } from '@/services/order.service';
import {
  OrderItemResponseModel,
  CreateOrderPayload,
  GetOrdersParams,
  UpdateOrderPayload,
  OrderStatus,
} from '@/types/order';

interface OrderState {
  items: OrderItemResponseModel[];
  selectedOrder: OrderItemResponseModel | null;
  total: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: OrderState = {
  items: [],
  selectedOrder: null,
  total: 0,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params: GetOrdersParams | undefined, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrders(params);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(orderId);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch order');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (payload: CreateOrderPayload, { rejectWithValue }) => {
    try {
      const response = await orderService.createOrder(payload);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to place order');
    }
  }
);

export const updateOrder = createAsyncThunk(
  'orders/updateOrder',
  async (
    { orderId, payload }: { orderId: string; payload: UpdateOrderPayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.updateOrder(orderId, payload);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async (
    { orderId, status }: { orderId: string; status: OrderStatus },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.updateOrder(orderId, { order_status: status });
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update order status');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (
    { orderId, reason }: { orderId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.cancelOrder(orderId, reason);
      return { orderId, reason: reason || 'Customer requested', response };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to cancel order');
    }
  }
);

export const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setSelectedOrder: (state, action: PayloadAction<OrderItemResponseModel | null>) => {
      state.selectedOrder = action.payload;
    },
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchOrders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load orders';
      })
      // fetchOrderById
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.selectedOrder = action.payload;
      })
      // createOrder
      .addCase(createOrder.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isSaving = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to create order';
      })
      // updateOrder
      .addCase(updateOrder.fulfilled, (state, action) => {
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      // updateOrderStatus
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      // cancelOrder
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const idx = state.items.findIndex((o) => o.id === action.payload.orderId);
        if (idx !== -1) {
          state.items[idx].order_status = 'CANCELLED';
          state.items[idx].cancellation_reason = action.payload.reason;
        }
        if (state.selectedOrder?.id === action.payload.orderId) {
          state.selectedOrder.order_status = 'CANCELLED';
          state.selectedOrder.cancellation_reason = action.payload.reason;
        }
      });
  },
});

export const { setSelectedOrder, clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;
