import { apiClient, extractErrorMessage } from './api';
import {
  TaxConfigItem,
  CreateTaxConfigPayload,
  UpdateTaxConfigPayload,
} from '@/types/tax';
import { INITIAL_TAX_CONFIGS } from './mockData';

let taxConfigsCache = [...INITIAL_TAX_CONFIGS];

export const taxService = {
  /**
   * Get all tax configurations
   * GET /tax-configs (or /taxes)
   */
  async getTaxConfigs(): Promise<TaxConfigItem[]> {
    try {
      const response = await apiClient.get<TaxConfigItem[]>('/tax-configs');
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        return taxConfigsCache;
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Get currently active tax configuration
   */
  async getActiveTax(): Promise<TaxConfigItem | null> {
    try {
      const list = await this.getTaxConfigs();
      return list.find(t => t.is_active) || list[0] || null;
    } catch {
      return taxConfigsCache.find(t => t.is_active) || null;
    }
  },

  /**
   * Create new tax configuration
   * POST /tax-configs
   */
  async createTaxConfig(payload: CreateTaxConfigPayload): Promise<TaxConfigItem> {
    try {
      const response = await apiClient.post<TaxConfigItem>('/tax-configs', payload);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        if (payload.is_active) {
          taxConfigsCache.forEach(t => (t.is_active = false));
        }
        const newTax: TaxConfigItem = {
          id: `tax-${Date.now()}`,
          name: payload.name,
          tax_percentage: payload.tax_percentage,
          description: payload.description,
          is_active: payload.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        taxConfigsCache.unshift(newTax);
        return newTax;
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Update tax configuration
   * PUT /tax-configs/{id}
   */
  async updateTaxConfig(id: string, payload: UpdateTaxConfigPayload): Promise<TaxConfigItem> {
    try {
      const response = await apiClient.put<TaxConfigItem>(`/tax-configs/${encodeURIComponent(id)}`, payload);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const idx = taxConfigsCache.findIndex(t => t.id === id);
        if (idx !== -1) {
          taxConfigsCache[idx] = {
            ...taxConfigsCache[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          return taxConfigsCache[idx];
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Activate a specific tax configuration (deactivates others)
   * POST /tax-configs/{id}/activate
   */
  async activateTaxConfig(id: string): Promise<TaxConfigItem> {
    try {
      const response = await apiClient.post<TaxConfigItem>(`/tax-configs/${encodeURIComponent(id)}/activate`);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        taxConfigsCache.forEach(t => {
          t.is_active = t.id === id;
          t.updated_at = new Date().toISOString();
        });
        const active = taxConfigsCache.find(t => t.id === id);
        if (active) return active;
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};

