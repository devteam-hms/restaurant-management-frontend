import {
  TaxConfigItem,
  CreateTaxConfigPayload,
  UpdateTaxConfigPayload,
} from '@/types/tax';
import { INITIAL_TAX_CONFIGS } from './mockData';

const TAX_STORAGE_KEY = 'rms_tax_configs';

function getStoredTaxConfigs(): TaxConfigItem[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(TAX_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read tax configs from localStorage', e);
    }
  }
  return [...INITIAL_TAX_CONFIGS];
}

function saveStoredTaxConfigs(configs: TaxConfigItem[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TAX_STORAGE_KEY, JSON.stringify(configs));
    } catch (e) {
      console.warn('Could not save tax configs to localStorage', e);
    }
  }
}

export const taxService = {
  /**
   * Get all tax configurations (local storage backed, aligns with backend 5% tax engine)
   */
  async getTaxConfigs(): Promise<TaxConfigItem[]> {
    return getStoredTaxConfigs();
  },

  /**
   * Get currently active tax configuration
   */
  async getActiveTax(): Promise<TaxConfigItem | null> {
    const list = getStoredTaxConfigs();
    return list.find(t => t.is_active) || list[0] || null;
  },

  /**
   * Create new tax configuration
   */
  async createTaxConfig(payload: CreateTaxConfigPayload): Promise<TaxConfigItem> {
    const current = getStoredTaxConfigs();
    if (payload.is_active) {
      current.forEach(t => (t.is_active = false));
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
    current.unshift(newTax);
    saveStoredTaxConfigs(current);
    return newTax;
  },

  /**
   * Update tax configuration
   */
  async updateTaxConfig(id: string, payload: UpdateTaxConfigPayload): Promise<TaxConfigItem> {
    const current = getStoredTaxConfigs();
    const idx = current.findIndex(t => t.id === id);
    if (idx !== -1) {
      current[idx] = {
        ...current[idx],
        ...payload,
        updated_at: new Date().toISOString(),
      };
      saveStoredTaxConfigs(current);
      return current[idx];
    }
    throw new Error('Tax configuration not found');
  },

  /**
   * Activate a specific tax configuration (deactivates others)
   */
  async activateTaxConfig(id: string): Promise<TaxConfigItem> {
    const current = getStoredTaxConfigs();
    current.forEach(t => {
      t.is_active = t.id === id;
      if (t.is_active) {
        t.updated_at = new Date().toISOString();
      }
    });
    saveStoredTaxConfigs(current);
    const activated = current.find(t => t.id === id);
    if (activated) return activated;
    throw new Error('Tax configuration not found');
  },

  /**
   * Delete tax configuration
   */
  async deleteTaxConfig(id: string): Promise<{ message: string }> {
    const current = getStoredTaxConfigs().filter(t => t.id !== id);
    saveStoredTaxConfigs(current);
    return { message: 'Tax configuration removed successfully.' };
  },
};
