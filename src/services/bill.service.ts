import { apiClient, extractErrorMessage } from './api';
import { PaginatedResponse } from '@/types/api';
import {
  BillItem,
  GenerateBillPayload,
  UpdateBillPayload,
  GetBillsParams,
} from '@/types/bill';
import { INITIAL_BILLS } from './mockData';
import { orderService } from './order.service';
import { taxService } from './tax.service';

let billsCache = [...INITIAL_BILLS];

export const billService = {
  /**
   * Get paginated bills
   * GET /bills
   */
  async getBills(params: GetBillsParams = {}): Promise<PaginatedResponse<BillItem>> {
    try {
      const response = await apiClient.get<PaginatedResponse<BillItem>>('/bills', {
        params,
      });
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        let filtered = billsCache;
        if (params.customer_id) {
          filtered = filtered.filter(b => b.customer_id === params.customer_id);
        }
        if (params.branch_id) {
          filtered = filtered.filter(b => b.branch_id === params.branch_id);
        }
        if (params.payment_status) {
          filtered = filtered.filter(b => b.payment_status === params.payment_status);
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
   * Get bill by ID
   * GET /bills/{bill_id}
   */
  async getBillById(billId: string): Promise<BillItem> {
    try {
      const response = await apiClient.get<BillItem>(`/bills/${encodeURIComponent(billId)}`);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const found = billsCache.find(b => b.id === billId || b.bill_number === billId);
        if (found) return found;
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Generate bill from an order
   * POST /bills
   */
  async generateBill(payload: GenerateBillPayload): Promise<BillItem> {
    try {
      const response = await apiClient.post<BillItem>('/bills', payload);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const order = await orderService.getOrderById(payload.order_id);
        const activeTax = await taxService.getActiveTax();
        const taxPercentage = activeTax ? activeTax.tax_percentage : 5.0;

        const subtotal = order.subtotal || order.total_amount;
        const discount = payload.discount_amount || 0;
        const taxable = Math.max(0, subtotal - discount);
        const taxAmount = Math.round(taxable * (taxPercentage / 100) * 100) / 100;
        const finalAmount = taxable + taxAmount;

        const newBill: BillItem = {
          id: `bill-${Date.now()}`,
          bill_number: `RMS-BILL-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          order_id: order.id,
          tenant_id: order.tenant_id,
          restaurant_id: order.restaurant_id,
          restaurant_name: order.restaurant_name,
          branch_id: order.branch_id,
          branch_name: order.branch_name,
          customer_id: order.customer_id,
          customer_name: order.customer_name,
          subtotal: subtotal,
          discount_amount: discount,
          tax_percentage: taxPercentage,
          tax_amount: taxAmount,
          final_amount: finalAmount,
          payment_status: 'PENDING',
          payment_method: 'CARD',
          notes: payload.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        billsCache.unshift(newBill);
        return newBill;
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Update bill payment status or details
   * PUT /bills/{bill_id}
   */
  async updateBill(billId: string, payload: UpdateBillPayload): Promise<BillItem> {
    try {
      const response = await apiClient.put<BillItem>(`/bills/${encodeURIComponent(billId)}`, payload);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const idx = billsCache.findIndex(b => b.id === billId);
        if (idx !== -1) {
          billsCache[idx] = {
            ...billsCache[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          return billsCache[idx];
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Cancel bill
   * DELETE /bills/{bill_id}
   */
  async cancelBill(billId: string): Promise<{ message: string; bill_id: string }> {
    try {
      const response = await apiClient.delete<{ message: string; bill_id: string }>(
        `/bills/${encodeURIComponent(billId)}`
      );
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const idx = billsCache.findIndex(b => b.id === billId);
        if (idx !== -1) {
          billsCache[idx].payment_status = 'CANCELLED';
          billsCache[idx].updated_at = new Date().toISOString();
        }
        return { message: 'Bill successfully cancelled', bill_id: billId };
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};

