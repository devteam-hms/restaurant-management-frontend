import { apiClient, extractErrorMessage, API_BASE_URL } from './api';
import { PaginatedResponse } from '@/types/api';
import {
  BranchItem,
  BranchQRDetails,
  BranchQRResponse,
  BranchResponse,
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@/types/branch';
import { INITIAL_BRANCHES } from './mockData';

let branchesCache = [...INITIAL_BRANCHES];

const BRANCH_PHONE_STORAGE_KEY = 'rms_branch_phones';
const BRANCH_QR_STORAGE_KEY_PREFIX = 'rms_branch_qr_';
const inMemoryPhoneCache: Record<string, string> = {};

export function getStoredBranchQR(branchId: string): BranchQRDetails | null {
  if (!branchId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${BRANCH_QR_STORAGE_KEY_PREFIX}${branchId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredBranchQR(branchId: string, details: BranchQRDetails): void {
  if (!branchId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${BRANCH_QR_STORAGE_KEY_PREFIX}${branchId}`, JSON.stringify(details));
  } catch {}
}

export function getStoredPhones(): Record<string, string> {
  const result: Record<string, string> = { ...inMemoryPhoneCache };
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(BRANCH_PHONE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          Object.assign(result, parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read branch phones from localStorage:', e);
    }
  }
  return result;
}

export function saveBranchPhone(branchId: string, phone: string): void {
  if (!branchId || !phone) return;
  const cleaned = phone.trim();
  inMemoryPhoneCache[branchId] = cleaned;
  if (typeof window !== 'undefined') {
    try {
      const phones = getStoredPhones();
      phones[branchId] = cleaned;
      localStorage.setItem(BRANCH_PHONE_STORAGE_KEY, JSON.stringify(phones));
    } catch (e) {
      console.warn('Could not save branch phone to localStorage:', e);
    }
  }
}

export function removeBranchPhone(branchId: string): void {
  if (!branchId) return;
  delete inMemoryPhoneCache[branchId];
  if (typeof window !== 'undefined') {
    try {
      const phones = getStoredPhones();
      delete phones[branchId];
      localStorage.setItem(BRANCH_PHONE_STORAGE_KEY, JSON.stringify(phones));
    } catch (e) {
      console.warn('Could not remove branch phone from localStorage:', e);
    }
  }
}

export function getStoredBranchPhone(branchId: string): string | undefined {
  if (!branchId) return undefined;
  if (inMemoryPhoneCache[branchId]) return inMemoryPhoneCache[branchId];
  const phones = getStoredPhones();
  return phones[branchId];
}

export const branchService = {
  /**
   * Retrieve paginated branches, optionally filtered by restaurant_id or tenant_id
   * GET /branches
   */
  async getBranches(params?: {
    page?: number;
    limit?: number;
    restaurant_id?: string;
    tenant_id?: string;
  }): Promise<PaginatedResponse<BranchItem>> {
    try {
      const response = await apiClient.get<PaginatedResponse<BranchItem>>(
        '/branches',
        {
          params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 50,
            ...(params?.restaurant_id
              ? { restaurant_id: params.restaurant_id }
              : {}),
            ...(params?.tenant_id ? { tenant_id: params.tenant_id } : {}),
          },
        }
      );

      const stored = getStoredPhones();
      const hydratedData = (response.data.data || []).map((b) => {
        const phone = b.phone || stored[b.branch_id] || '';
        if (phone && !stored[b.branch_id]) {
          saveBranchPhone(b.branch_id, phone);
        }
        return {
          ...b,
          phone: phone || undefined,
          opening_hours: b.opening_hours || '12:00 – 23:30 (Daily)',
          capacity: b.capacity || 75,
        };
      });

      const totalCount =
        (response.data as any).pagination?.total_records ??
        response.data.total ??
        hydratedData.length;

      return {
        ...response.data,
        data: hydratedData,
        total: totalCount,
      };
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        let filtered = branchesCache;
        if (params?.restaurant_id) {
          filtered = filtered.filter(b => b.restaurant_id === params.restaurant_id);
        }
        return {
          data: filtered,
          total: filtered.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          total_pages: Math.ceil(filtered.length / (params?.limit ?? 10)) || 1,
        };
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * On-demand fetch of branch phone from backend by calling PUT /branches/{branch_id}
   * with empty body (preserves all MongoDB fields and returns full BranchResponse with phone).
   */
  async fetchBranchPhone(branchId: string): Promise<string | null> {
    if (!branchId) return null;
    const cached = getStoredBranchPhone(branchId);
    if (cached) return cached;

    try {
      const response = await apiClient.put<BranchResponse>(
        `/branches/${encodeURIComponent(branchId)}`,
        {}
      );
      if (response.data?.phone) {
        saveBranchPhone(branchId, response.data.phone);
        return response.data.phone;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Create a new branch under a restaurant
   * POST /branches
   */
  async createBranch(payload: CreateBranchPayload): Promise<BranchResponse> {
    try {
      const response = await apiClient.post<BranchResponse>('/branches', {
        restaurant_id: payload.restaurant_id,
        branch_name: payload.branch_name,
        address: payload.address,
        city: payload.city,
        state: payload.state,
        email: payload.email,
        phone: payload.phone,
      });
      const data = response.data;
      const branchId = data.id || (data as any).branch_id;
      const phone = data.phone || payload.phone;
      if (branchId && phone) {
        saveBranchPhone(branchId, phone);
      }
      return data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const newBranch: BranchItem = {
          branch_id: `branch-${Date.now()}`,
          restaurant_id: payload.restaurant_id,
          branch_name: payload.branch_name,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          email: payload.email,
          phone: payload.phone,
          opening_hours: payload.opening_hours || '18:00 – 23:30',
          capacity: payload.capacity || 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        branchesCache.unshift(newBranch);
        saveBranchPhone(newBranch.branch_id, payload.phone);
        return {
          id: newBranch.branch_id,
          restaurant_id: newBranch.restaurant_id,
          branch_name: newBranch.branch_name,
          address: newBranch.address,
          city: newBranch.city,
          state: newBranch.state,
          email: newBranch.email,
          phone: newBranch.phone || '',
          created_at: newBranch.created_at,
          updated_at: newBranch.updated_at,
        };
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Update branch details
   * PUT /branches/{branch_id}
   */
  async updateBranch(
    branchId: string,
    payload: UpdateBranchPayload
  ): Promise<BranchResponse> {
    try {
      const response = await apiClient.put<BranchResponse>(
        `/branches/${encodeURIComponent(branchId)}`,
        {
          branch_name: payload.branch_name,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          email: payload.email,
          phone: payload.phone,
        }
      );
      const data = response.data;
      const phone = data.phone || payload.phone;
      if (branchId && phone) {
        saveBranchPhone(branchId, phone);
      }
      return data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const idx = branchesCache.findIndex(b => b.branch_id === branchId);
        if (idx !== -1) {
          branchesCache[idx] = {
            ...branchesCache[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          if (payload.phone) saveBranchPhone(branchId, payload.phone);
          return {
            id: branchesCache[idx].branch_id,
            restaurant_id: branchesCache[idx].restaurant_id,
            branch_name: branchesCache[idx].branch_name,
            address: branchesCache[idx].address,
            city: branchesCache[idx].city,
            state: branchesCache[idx].state,
            email: branchesCache[idx].email,
            phone: branchesCache[idx].phone || '',
            created_at: branchesCache[idx].created_at,
            updated_at: branchesCache[idx].updated_at,
          };
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Delete branch
   * DELETE /branches/{branch_id}
   */
  async deleteBranch(branchId: string): Promise<{ message: string; branch_id: string }> {
    try {
      const response = await apiClient.delete<{
        message: string;
        branch_id: string;
      }>(`/branches/${encodeURIComponent(branchId)}`);
      removeBranchPhone(branchId);
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        branchesCache = branchesCache.filter(b => b.branch_id !== branchId);
        removeBranchPhone(branchId);
        return { message: 'Branch deleted', branch_id: branchId };
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Retrieve branch QR code details
   * GET /branches/{branch_id}/qr
   */
  async getBranchQR(branchId: string): Promise<BranchQRResponse> {
    const isMockBranch = branchId.startsWith('branch-') || branchId.startsWith('mock-');
    const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';

    try {
      if (!isMockBranch) {
        const response = await apiClient.get<BranchQRResponse>(
          `/branches/${encodeURIComponent(branchId)}/qr`
        );
        return response.data;
      }
    } catch (err: any) {
      if (!enableMock && !isMockBranch) {
        throw new Error(extractErrorMessage(err));
      }
    }

    if (enableMock || isMockBranch) {
      const stored = getStoredBranchQR(branchId);
      if (stored) {
        return { success: true, data: stored };
      }
      const branchMatch = branchesCache.find((b) => b.branch_id === branchId);
      return {
        success: true,
        data: {
          branch_id: branchId,
          branch_name: branchMatch?.branch_name || 'Branch',
          public_menu_code: null,
          menu_url: null,
          qr_status: 'not_generated',
          qr_generated_at: null,
          qr_preview_url: null,
        },
      };
    }

    throw new Error('Branch QR not found');
  },

  /**
   * Generate or retrieve branch QR code
   * POST /branches/{branch_id}/qr
   */
  async generateBranchQR(
    branchId: string,
    regenerate: boolean = false
  ): Promise<BranchQRResponse> {
    const isMockBranch = branchId.startsWith('branch-') || branchId.startsWith('mock-');
    const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';

    try {
      if (!isMockBranch) {
        const response = await apiClient.post<BranchQRResponse>(
          `/branches/${encodeURIComponent(branchId)}/qr`,
          null,
          {
            params: { regenerate },
          }
        );
        return response.data;
      }
    } catch (err: any) {
      if (!enableMock && !isMockBranch) {
        throw new Error(extractErrorMessage(err));
      }
    }

    if (enableMock || isMockBranch) {
      const existing = getStoredBranchQR(branchId);
      if (existing?.public_menu_code && !regenerate) {
        return {
          success: true,
          message: 'Branch QR code retrieved successfully',
          data: existing,
        };
      }

      const branchMatch = branchesCache.find((b) => b.branch_id === branchId);
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const code = `br_${randomSuffix}`;
      const customerBaseUrl = 'http://localhost:5173';
      const menuUrl = `${customerBaseUrl}/menu/${code}`;
      const previewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`;

      const newQrData: BranchQRDetails = {
        branch_id: branchId,
        branch_name: branchMatch?.branch_name || 'Branch',
        public_menu_code: code,
        menu_url: menuUrl,
        qr_status: 'active',
        qr_generated_at: new Date().toISOString(),
        qr_preview_url: previewUrl,
      };

      saveStoredBranchQR(branchId, newQrData);

      return {
        success: true,
        message: regenerate
          ? 'New QR code generated successfully'
          : 'Branch QR code generated successfully',
        data: newQrData,
      };
    }

    throw new Error('Failed to generate branch QR code');
  },

  /**
   * Download branch QR code as a PNG file
   * GET /branches/{branch_id}/qr/download
   */
  async downloadBranchQR(branchId: string, branchName: string): Promise<void> {
    const isMockBranch = branchId.startsWith('branch-') || branchId.startsWith('mock-');
    const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';

    try {
      if (!isMockBranch) {
        const response = await apiClient.get(
          `/branches/${encodeURIComponent(branchId)}/qr/download`,
          {
            responseType: 'blob',
          }
        );

        const blob = new Blob([response.data], { type: 'image/png' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const cleanName = branchName.replace(/[^a-zA-Z0-9_\-]/g, '_');
        link.download = `qr_${cleanName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch (err: any) {
      if (!enableMock && !isMockBranch) {
        throw new Error(extractErrorMessage(err));
      }
    }

    if (enableMock || isMockBranch) {
      const stored = getStoredBranchQR(branchId);
      const menuUrl = stored?.menu_url || `http://localhost:5173/menu/br_${branchId}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(menuUrl)}`;
      try {
        const res = await fetch(qrApiUrl);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const cleanName = branchName.replace(/[^a-zA-Z0-9_\-]/g, '_');
        link.download = `qr_${cleanName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      } catch {
        window.open(qrApiUrl, '_blank');
        return;
      }
    }
  },

  /**
   * Get direct preview URL for the QR code image
   */
  getBranchQRImageUrl(branchId: string): string {
    const stored = getStoredBranchQR(branchId);
    if (stored?.qr_preview_url) {
      return stored.qr_preview_url;
    }
    return `${API_BASE_URL}/branches/${encodeURIComponent(branchId)}/qr/preview`;
  },
};
