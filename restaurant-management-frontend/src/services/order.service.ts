import { apiClient } from "@/services/api";
import { PaginatedResponse } from "@/types/api";
import {
  OrderItemResponseModel,
  CreateOrderPayload,
  UpdateOrderPayload,
  GetOrdersParams,
  CancelOrderResponse,
} from "@/types/order";

export const orderService = {
  /**
   * Create a new order
   * POST /orders
   */
  async createOrder(payload: CreateOrderPayload): Promise<OrderItemResponseModel> {
    const response = await apiClient.post<OrderItemResponseModel>("/orders", payload);
    return response.data;
  },

  /**
   * Retrieve all authorized orders with filters and pagination
   * GET /orders
   */
  async getOrders(params: GetOrdersParams = {}): Promise<PaginatedResponse<OrderItemResponseModel>> {
    const cleanParams: Record<string, any> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    if (params.branch_id) cleanParams.branch_id = params.branch_id;
    if (params.customer_id) cleanParams.customer_id = params.customer_id;
    if (params.order_status) cleanParams.order_status = params.order_status;
    if (params.payment_status) cleanParams.payment_status = params.payment_status;
    if (params.start_date) cleanParams.start_date = params.start_date;
    if (params.end_date) cleanParams.end_date = params.end_date;

    const response = await apiClient.get<PaginatedResponse<OrderItemResponseModel>>("/orders", {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Retrieve branch orders
   * GET /orders/branch/{branch_id}
   */
  async getOrdersByBranch(
    branchId: string,
    params: { page?: number; limit?: number; order_status?: string } = {}
  ): Promise<PaginatedResponse<OrderItemResponseModel>> {
    const response = await apiClient.get<PaginatedResponse<OrderItemResponseModel>>(
      `/orders/branch/${encodeURIComponent(branchId)}`,
      {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          order_status: params.order_status,
        },
      }
    );
    return response.data;
  },

  /**
   * Get specific order details by ID
   * GET /orders/{order_id}
   */
  async getOrderById(orderId: string): Promise<OrderItemResponseModel> {
    const response = await apiClient.get<OrderItemResponseModel>(
      `/orders/${encodeURIComponent(orderId)}`
    );
    return response.data;
  },

  /**
   * Update order status, payment status, or items
   * PUT /orders/{order_id}
   */
  async updateOrder(
    orderId: string,
    payload: UpdateOrderPayload
  ): Promise<OrderItemResponseModel> {
    const response = await apiClient.put<OrderItemResponseModel>(
      `/orders/${encodeURIComponent(orderId)}`,
      payload
    );
    return response.data;
  },

  /**
   * Cancel an order
   * DELETE /orders/{order_id}
   */
  async cancelOrder(
    orderId: string,
    reason?: string
  ): Promise<CancelOrderResponse> {
    const response = await apiClient.delete<CancelOrderResponse>(
      `/orders/${encodeURIComponent(orderId)}`,
      {
        params: reason ? { cancellation_reason: reason } : undefined,
      }
    );
    return response.data;
  },
};

