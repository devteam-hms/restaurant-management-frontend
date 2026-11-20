import { apiClient, extractErrorMessage } from './api';
import { PaginatedResponse } from '@/types/api';
import {
  OrderItemResponseModel,
  CreateOrderPayload,
  UpdateOrderPayload,
  GetOrdersParams,
  CancelOrderResponse,
} from '@/types/order';
import { INITIAL_ORDERS, INITIAL_MENUS } from './mockData';

let ordersCache = [...INITIAL_ORDERS];

export const orderService = {
  /**
   * Create a new order
   * POST /orders
   */
  async createOrder(payload: CreateOrderPayload): Promise<OrderItemResponseModel> {
    try {
      const response = await apiClient.post<OrderItemResponseModel>('/orders', {
        branch_id: payload.branch_id,
        items: payload.items.map(item => ({
          menu_id: item.menu_id,
          quantity: item.quantity,
        })),
      });

      const orderData = response.data;
      return {
        ...orderData,
        table_number: payload.table_number || orderData.table_number || 'Table 04',
        special_instructions: payload.special_instructions || orderData.special_instructions,
        subtotal: orderData.items?.reduce((acc, cur) => acc + (cur.subtotal || cur.unit_price * cur.quantity), 0) || orderData.total_amount,
      };
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const orderItems = payload.items.map(item => {
          const menuItem = INITIAL_MENUS.find(m => m.id === item.menu_id);
          const unit_price = menuItem?.price || 120.0;
          return {
            menu_id: item.menu_id,
            menu_name: menuItem?.menu_name || 'Chef Specialty Selection',
            quantity: item.quantity,
            unit_price: unit_price,
            subtotal: unit_price * item.quantity,
            image: menuItem?.image,
          };
        });

        const subtotal = orderItems.reduce((acc, cur) => acc + cur.subtotal, 0);
        const tax_amount = Math.round(subtotal * 0.05 * 100) / 100;
        const total_amount = subtotal + tax_amount;

        const newOrder: OrderItemResponseModel = {
          id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
          tenant_id: 'tenant-rms-001',
          restaurant_id: 'rest-001',
          restaurant_name: 'The Bengal Table',
          branch_id: payload.branch_id,
          branch_name: 'Kolkata — Park Street Flagship',
          customer_id: 'cust-001',
          customer_name: 'Aarav Sharma',
          items: orderItems,
          subtotal: subtotal,
          tax_amount: tax_amount,
          total_amount: total_amount,
          order_status: 'PLACED',
          payment_status: 'PENDING',
          table_number: payload.table_number || 'Table 04',
          special_instructions: payload.special_instructions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        ordersCache.unshift(newOrder);
        return newOrder;
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Retrieve all authorized orders with filters and pagination
   * GET /orders
   */
  async getOrders(params: GetOrdersParams = {}): Promise<PaginatedResponse<OrderItemResponseModel>> {
    try {
      const cleanParams: Record<string, any> = {
        page: params.page || 1,
        limit: params.limit || 50,
      };
      if (params.branch_id) cleanParams.branch_id = params.branch_id;
      if (params.customer_id) cleanParams.customer_id = params.customer_id;
      if (params.order_status) cleanParams.order_status = params.order_status;
      if (params.payment_status) cleanParams.payment_status = params.payment_status;
      if (params.start_date) cleanParams.start_date = params.start_date;
      if (params.end_date) cleanParams.end_date = params.end_date;

      const response = await apiClient.get<PaginatedResponse<OrderItemResponseModel>>('/orders', {
        params: cleanParams,
      });

      const hydrated = (response.data.data || []).map((o) => ({
        ...o,
        subtotal: o.items?.reduce((acc, cur) => acc + (cur.subtotal || cur.unit_price * cur.quantity), 0) || o.total_amount,
      }));

      const totalCount =
        (response.data as any).pagination?.total_records ??
        response.data.total ??
        hydrated.length;

      return {
        ...response.data,
        data: hydrated,
        total: totalCount,
      };
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        let filtered = ordersCache;
        if (params.branch_id) {
          filtered = filtered.filter(o => o.branch_id === params.branch_id);
        }
        if (params.customer_id) {
          filtered = filtered.filter(o => o.customer_id === params.customer_id);
        }
        if (params.order_status) {
          filtered = filtered.filter(o => o.order_status === params.order_status);
        }
        return {
          data: filtered,
          total: filtered.length,
          page: params.page || 1,
          limit: params.limit || 10,
          total_pages: Math.ceil(filtered.length / (params.limit || 10)) || 1,
        };
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Retrieve orders for a specific branch
   * GET /orders/branch/{branch_id}
   */
  async getOrdersByBranch(
    branchId: string,
    params: { page?: number; limit?: number; order_status?: string } = {}
  ): Promise<PaginatedResponse<OrderItemResponseModel>> {
    try {
      const response = await apiClient.get<PaginatedResponse<OrderItemResponseModel>>(
        `/orders/branch/${encodeURIComponent(branchId)}`,
        {
          params: {
            page: params.page || 1,
            limit: params.limit || 50,
            ...(params.order_status ? { order_status: params.order_status } : {}),
          },
        }
      );
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        return this.getOrders({ branch_id: branchId });
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Get single order by ID
   * GET /orders/{order_id}
   */
  async getOrderById(orderId: string): Promise<OrderItemResponseModel> {
    try {
      const response = await apiClient.get<OrderItemResponseModel>(`/orders/${encodeURIComponent(orderId)}`);
      const o = response.data;
      return {
        ...o,
        subtotal: o.items?.reduce((acc, cur) => acc + (cur.subtotal || cur.unit_price * cur.quantity), 0) || o.total_amount,
      };
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const found = ordersCache.find(o => o.id === orderId);
        if (found) return found;
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Update order status or lifecycle state
   * PUT /orders/{order_id}
   */
  async updateOrder(orderId: string, payload: UpdateOrderPayload): Promise<OrderItemResponseModel> {
    try {
      const response = await apiClient.put<OrderItemResponseModel>(
        `/orders/${encodeURIComponent(orderId)}`,
        {
          order_status: payload.order_status,
          payment_status: payload.payment_status,
          items: payload.items,
          cancellation_reason: payload.cancellation_reason,
        }
      );
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const idx = ordersCache.findIndex(o => o.id === orderId);
        if (idx !== -1) {
          ordersCache[idx] = {
            ...ordersCache[idx],
            order_status: payload.order_status || ordersCache[idx].order_status,
            payment_status: payload.payment_status || ordersCache[idx].payment_status,
            updated_at: new Date().toISOString(),
          };
          return ordersCache[idx];
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Soft cancel order via DELETE /orders/{order_id}
   */
  async cancelOrder(orderId: string, cancellationReason?: string): Promise<CancelOrderResponse> {
    try {
      const response = await apiClient.delete<CancelOrderResponse>(
        `/orders/${encodeURIComponent(orderId)}`,
        {
          params: cancellationReason ? { cancellation_reason: cancellationReason } : undefined,
        }
      );
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const idx = ordersCache.findIndex(o => o.id === orderId);
        if (idx !== -1) {
          ordersCache[idx].order_status = 'CANCELLED';
          ordersCache[idx].cancellation_reason = cancellationReason || 'Customer requested';
        }
        return {
          message: 'Order cancelled successfully',
          order_id: orderId,
          order_status: 'CANCELLED',
        };
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};
