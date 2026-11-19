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
  image?: string;
}

export interface OrderItemPayload {
  menu_id: string;
  quantity: number;
}

export interface CreateOrderPayload {
  branch_id: string;
  items: OrderItemPayload[];
  special_instructions?: string;
  table_number?: string;
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
  restaurant_name?: string;
  branch_id: string;
  branch_name?: string;
  customer_id: string;
  customer_name?: string;
  items: OrderItem[];
  subtotal?: number;
  tax_amount?: number;
  total_amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  table_number?: string;
  special_instructions?: string;
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

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];


