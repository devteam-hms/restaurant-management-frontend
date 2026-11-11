export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderItem {
  menu_id: string;
  menu_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderItemPayload {
  menu_id: string;
  quantity: number;
}

export interface CreateOrderPayload {
  branch_id: string;
  items: OrderItemPayload[];
}

export interface UpdateOrderPayload {
  items?: OrderItemPayload[];
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
  cancellation_reason?: string;
}

export interface OrderItemResponseModel {
  id: string;
  tenant_id: string;
  restaurant_id: string;
  branch_id: string;
  customer_id: string;
  items: OrderItem[];
  total_amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  branch_id?: string;
  customer_id?: string;
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
  start_date?: string;
  end_date?: string;
}

export interface CancelOrderResponse {
  message: string;
  order_id: string;
  order_status: OrderStatus;
}

