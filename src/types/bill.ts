export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "ONLINE";
export type BillStatus = "GENERATED" | "ACTIVE" | "PAID" | "CANCELLED";

export interface BillItemDetail {
  menu_id: string;
  menu_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface BillItem {
  id: string;
  bill_number: string;
  order_id: string;
  tenant_id: string;
  restaurant_id: string;
  restaurant_name?: string;
  branch_id: string;
  branch_name?: string;
  customer_id: string;
  customer_name?: string;
  items?: BillItemDetail[];
  subtotal: number;
  discount?: number;
  discount_amount: number; // Compatibility alias
  tax_rate?: number;
  tax?: number;
  tax_percentage: number; // Compatibility alias (tax_rate * 100)
  tax_amount: number; // Compatibility alias
  total_amount?: number;
  final_amount: number; // Compatibility alias
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  bill_status?: BillStatus;
  cancellation_reason?: string | null;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateBillPayload {
  order_id: string;
  discount?: number;
  discount_amount?: number; // Accept either
  payment_method?: PaymentMethod;
  notes?: string;
}

export interface UpdateBillPayload {
  discount?: number;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  transaction_id?: string;
  notes?: string;
}

export interface CancelBillPayload {
  cancellation_reason?: string;
}

export interface CancelBillResponse {
  message: string;
  bill_id: string;
  bill_status: BillStatus;
  cancellation_reason?: string | null;
}

export interface GetBillsParams {
  page?: number;
  limit?: number;
  tenant_id?: string;
  branch_id?: string;
  customer_id?: string;
  order_id?: string;
  payment_status?: string;
  bill_status?: string;
  start_date?: string;
  end_date?: string;
}
