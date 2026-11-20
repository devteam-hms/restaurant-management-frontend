import { apiClient, extractErrorMessage } from './api';
import { PaginatedResponse } from '@/types/api';
import {
  BillItem,
  GenerateBillPayload,
  UpdateBillPayload,
  CancelBillPayload,
  CancelBillResponse,
  GetBillsParams,
} from '@/types/bill';
import { INITIAL_BILLS } from './mockData';

let billsCache = [...INITIAL_BILLS];

function mapBillModel(data: any): BillItem {
  const discountVal = Number(data.discount ?? data.discount_amount ?? 0);
  const taxVal = Number(data.tax ?? data.tax_amount ?? 0);
  const totalVal = Number(data.total_amount ?? data.final_amount ?? 0);
  const taxRateVal = Number(data.tax_rate ?? 0.05);

  return {
    ...data,
    discount: discountVal,
    discount_amount: discountVal,
    tax: taxVal,
    tax_amount: taxVal,
    tax_rate: taxRateVal,
    tax_percentage: Math.round(taxRateVal * 100),
    total_amount: totalVal,
    final_amount: totalVal,
    payment_method: data.payment_method || 'CASH',
    payment_status: data.payment_status || 'PENDING',
    bill_status: data.bill_status || 'ACTIVE',
  };
}

export const billService = {
  /**
   * Get paginated bills
   * GET /bills
   */
  async getBills(params: GetBillsParams = {}): Promise<PaginatedResponse<BillItem>> {
    try {
      const cleanParams: Record<string, any> = {
        page: params.page || 1,
        limit: params.limit || 50,
      };
      if (params.tenant_id) cleanParams.tenant_id = params.tenant_id;
      if (params.branch_id) cleanParams.branch_id = params.branch_id;
      if (params.customer_id) cleanParams.customer_id = params.customer_id;
      if (params.order_id) cleanParams.order_id = params.order_id;
      if (params.payment_status) cleanParams.payment_status = params.payment_status;
      if (params.bill_status) cleanParams.bill_status = params.bill_status;
      if (params.start_date) cleanParams.start_date = params.start_date;
      if (params.end_date) cleanParams.end_date = params.end_date;

      const response = await apiClient.get<PaginatedResponse<any>>('/bills', {
        params: cleanParams,
      });

      const mapped = (response.data.data || []).map(mapBillModel);

      const totalCount =
        (response.data as any).pagination?.total_records ??
        response.data.total ??
        mapped.length;

      return {
        ...response.data,
        data: mapped,
        total: totalCount,
      };
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
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
          data: filtered.map(mapBillModel),
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
      const response = await apiClient.get<any>(`/bills/${encodeURIComponent(billId)}`);
      return mapBillModel(response.data);
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const found = billsCache.find(b => b.id === billId || b.bill_number === billId);
        if (found) return mapBillModel(found);
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Get bill by Order ID
   * GET /bills/order/{order_id}
   */
  async getBillByOrderId(orderId: string): Promise<BillItem> {
    try {
      const response = await apiClient.get<any>(`/bills/order/${encodeURIComponent(orderId)}`);
      return mapBillModel(response.data);
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const found = billsCache.find(b => b.order_id === orderId);
        if (found) return mapBillModel(found);
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
      const response = await apiClient.post<any>('/bills', {
        order_id: payload.order_id,
        discount: Number(payload.discount ?? payload.discount_amount ?? 0),
        payment_method: payload.payment_method || 'CASH',
      });
      return mapBillModel(response.data);
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const discount = Number(payload.discount ?? payload.discount_amount ?? 0);
        const newBill: BillItem = {
          id: `bill-${Date.now()}`,
          bill_number: `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          order_id: payload.order_id,
          tenant_id: 'tenant-rms-001',
          restaurant_id: 'rest-001',
          restaurant_name: 'The Bengal Table',
          branch_id: 'branch-001',
          branch_name: 'Kolkata — Park Street Flagship',
          customer_id: 'cust-001',
          customer_name: 'Aarav Sharma',
          subtotal: 1200,
          discount: discount,
          discount_amount: discount,
          tax_rate: 0.05,
          tax: 60,
          tax_percentage: 5,
          tax_amount: 60,
          total_amount: 1260 - discount,
          final_amount: 1260 - discount,
          payment_status: 'PAID',
          payment_method: payload.payment_method || 'CASH',
          bill_status: 'ACTIVE',
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
   * Update bill details (discount, payment_method, payment_status)
   * PUT /bills/{bill_id}
   */
  async updateBill(billId: string, payload: UpdateBillPayload): Promise<BillItem> {
    try {
      const response = await apiClient.put<any>(`/bills/${encodeURIComponent(billId)}`, {
        discount: payload.discount,
        payment_method: payload.payment_method,
        payment_status: payload.payment_status,
      });
      return mapBillModel(response.data);
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const idx = billsCache.findIndex(b => b.id === billId);
        if (idx !== -1) {
          billsCache[idx] = {
            ...billsCache[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          return mapBillModel(billsCache[idx]);
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Cancel bill via DELETE /bills/{bill_id}
   */
  async cancelBill(billId: string, payload?: CancelBillPayload): Promise<CancelBillResponse> {
    try {
      const response = await apiClient.delete<CancelBillResponse>(
        `/bills/${encodeURIComponent(billId)}`,
        {
          data: payload,
        }
      );
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const idx = billsCache.findIndex(b => b.id === billId);
        if (idx !== -1) {
          billsCache[idx].bill_status = 'CANCELLED';
        }
        return {
          message: 'Bill cancelled successfully',
          bill_id: billId,
          bill_status: 'CANCELLED',
        };
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};
