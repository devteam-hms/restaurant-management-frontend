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
  subtotal: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  final_amount: number;
  payment_status: "PENDING" | "PAID" | "REFUNDED" | "CANCELLED";
  payment_method?: "CARD" | "CASH" | "UPI" | "ONLINE";
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateBillPayload {
  order_id: string;
  discount_amount?: number;
  notes?: string;
}

export interface UpdateBillPayload {
  payment_status?: "PENDING" | "PAID" | "REFUNDED" | "CANCELLED";
  payment_method?: "CARD" | "CASH" | "UPI" | "ONLINE";
  transaction_id?: string;
  notes?: string;
}

export interface GetBillsParams {
  page?: number;
  limit?: number;
  branch_id?: string;
  customer_id?: string;
  order_id?: string;
  payment_status?: string;
}

