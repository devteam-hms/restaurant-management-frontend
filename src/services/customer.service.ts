import { apiClient, extractErrorMessage } from './api';
import { CustomerProfile, CustomerProfileResponse, UpdateCustomerProfilePayload } from '@/types/customer';
import { TokenStorage } from '@/lib/token-storage';
import { INITIAL_CUSTOMERS } from './mockData';

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function resolveAvatarUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  // Revoked/expired blob URLs from previous sessions must be discarded
  if (trimmed.startsWith('blob:')) return '';
  // If backend returns a relative upload path like /uploads/profiles/...
  if (trimmed.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const serverHost = apiBase.replace(/\/api\/v1\/?$/, '');
    return `${serverHost}${trimmed}`;
  }
  return trimmed;
}

let customersCache = [...INITIAL_CUSTOMERS];

export const customerService = {
  /**
   * Get registered customers for Tenant Admin by querying backend GET /users?role=CUSTOMER
   */
  async getCustomers(): Promise<CustomerProfile[]> {
    try {
      const response = await apiClient.get<any>('/users', {
        params: { role: 'CUSTOMER', limit: 100 },
      });
      const items = response.data?.data || [];
      return items.map((u: any, idx: number) => {
        const computedName =
          `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
          u.name ||
          (u.email ? u.email.split('@')[0] : 'Guest');

        return {
          id: u.user_id || u.id || `cust-${idx}`,
          customer_id: u.user_id || u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          name: computedName,
          email: u.email,
          phone: u.phone || undefined,
          avatar: u.profile_picture || undefined,
          status: u.status || 'ACTIVE',
          role: u.role || 'CUSTOMER',
          branch_id: u.branch_id || undefined,
          loyalty_tier: 'Registered Guest',
          total_orders: 0,
          total_spent: 0,
          member_since: u.created_at,
          created_at: u.created_at,
        };
      });
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        return customersCache;
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Get authenticated customer's own profile via GET /customers/me/profile
   */
  async getProfile(_fallbackId: string = 'cust-001'): Promise<CustomerProfile> {
    const currentUser = TokenStorage.getUser();
    const userId = currentUser?.id || _fallbackId;
    const rawStored =
      typeof window !== 'undefined' ? localStorage.getItem(`rms_avatar_${userId}`) : null;
    const storedAvatar = resolveAvatarUrl(rawStored) || resolveAvatarUrl(currentUser?.avatar) || '';

    try {
      const response = await apiClient.get<CustomerProfileResponse>('/customers/me/profile');
      const d = response.data.data;
      const remotePicture = resolveAvatarUrl(d.profile_picture);
      const avatarUrl = remotePicture || storedAvatar || '';
      if (typeof window !== 'undefined' && avatarUrl) {
        localStorage.setItem(`rms_avatar_${userId}`, avatarUrl);
      }
      return {
        id: d.customer_id,
        customer_id: d.customer_id,
        first_name: d.first_name,
        last_name: d.last_name,
        name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.email,
        email: d.email,
        phone: d.phone || '',
        avatar: avatarUrl,
        loyalty_tier: 'Platinum Club',
        member_since: d.created_at,
        created_at: d.created_at,
      };
    } catch (err: any) {
      // If 403 (account lacks CUSTOMER role in Keycloak) or 404, fallback cleanly to authenticated user session
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        if (currentUser) {
          return {
            id: currentUser.id || 'cust-me',
            customer_id: currentUser.id || 'cust-me',
            name: currentUser.name || currentUser.username || 'Valued Guest',
            email: currentUser.email || '',
            phone: '',
            avatar: storedAvatar,
            loyalty_tier: 'RMS Privilege Member',
            created_at: new Date().toISOString(),
          };
        }
      }
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const found = customersCache.find((c) => c.id === _fallbackId);
        return found || customersCache[0];
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Update personal profile details via PUT /customers/me/profile
   */
  async updateProfile(_customerId: string, payload: UpdateCustomerProfilePayload): Promise<CustomerProfile> {
    const currentUser = TokenStorage.getUser();
    const userId = currentUser?.id || _customerId;
    let firstName = payload.first_name;
    let lastName = payload.last_name;

    if (!firstName && payload.name) {
      const parts = payload.name.trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || undefined;
    }

    try {
      const response = await apiClient.put<CustomerProfileResponse>('/customers/me/profile', {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: payload.phone || undefined,
      });

      const d = response.data.data;
      const storedAvatar =
        (typeof window !== 'undefined' && localStorage.getItem(`rms_avatar_${userId}`)) ||
        d.profile_picture ||
        '';

      return {
        id: d.customer_id,
        customer_id: d.customer_id,
        first_name: d.first_name,
        last_name: d.last_name,
        name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.email,
        email: d.email,
        phone: d.phone || '',
        avatar: storedAvatar,
        loyalty_tier: 'Platinum Club',
        member_since: d.created_at,
        created_at: d.created_at,
      };
    } catch (err: any) {
      // If 403 (e.g. account lacks CUSTOMER role in Keycloak) or 404, gracefully preserve updated details in local session
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        if (currentUser) {
          const updatedName = payload.name || `${firstName || ''} ${lastName || ''}`.trim() || currentUser.name || 'Valued Guest';
          TokenStorage.setUser({ ...currentUser, name: updatedName });
          const storedAvatar =
            (typeof window !== 'undefined' && localStorage.getItem(`rms_avatar_${userId}`)) ||
            currentUser.avatar ||
            '';
          return {
            id: currentUser.id || 'cust-me',
            customer_id: currentUser.id || 'cust-me',
            name: updatedName,
            email: currentUser.email || '',
            phone: payload.phone || '',
            avatar: storedAvatar,
            loyalty_tier: 'RMS Privilege Member',
            created_at: new Date().toISOString(),
          };
        }
      }
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const idx = customersCache.findIndex(c => c.id === _customerId);
        if (idx !== -1) {
          customersCache[idx] = {
            ...customersCache[idx],
            ...payload,
          };
          return customersCache[idx];
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Upload / change profile picture via PUT /customers/me/profile/picture
   */
  async uploadAvatar(_customerId: string, fileOrUrl: File | string): Promise<CustomerProfile> {
    const currentUser = TokenStorage.getUser();
    const userId = currentUser?.id || _customerId;

    // 1. If selecting a curated preset portrait URL or pasting direct image link
    if (typeof fileOrUrl === 'string') {
      const resolved = resolveAvatarUrl(fileOrUrl);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`rms_avatar_${userId}`, resolved);
      }
      if (currentUser) {
        TokenStorage.setUser({ ...currentUser, avatar: resolved });
      }
      return {
        id: userId,
        customer_id: userId,
        name: currentUser?.name || 'Valued Guest',
        email: currentUser?.email || '',
        avatar: resolved,
      };
    }

    // 2. If uploading an image file from device:
    // First convert to permanent Base64 Data URL so it can persist in browser localStorage
    const base64Data = await fileToBase64(fileOrUrl);

    try {
      const formData = new FormData();
      formData.append('file', fileOrUrl);
      const response = await apiClient.put<any>('/customers/me/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const d = response.data?.data || response.data;
      const rawPicture = response.data?.profile_picture || d?.profile_picture;
      const avatarUrl = resolveAvatarUrl(rawPicture) || base64Data;

      if (typeof window !== 'undefined' && avatarUrl) {
        localStorage.setItem(`rms_avatar_${userId}`, avatarUrl);
      }
      if (currentUser && avatarUrl) {
        TokenStorage.setUser({ ...currentUser, avatar: avatarUrl });
      }
      return {
        id: d?.customer_id || userId,
        customer_id: d?.customer_id || userId,
        name: `${d?.first_name || ''} ${d?.last_name || ''}`.trim() || currentUser?.name || 'Valued Guest',
        email: d?.email || currentUser?.email || '',
        avatar: avatarUrl,
      };
    } catch (err: any) {
      // Gracefully store persistent base64Data in local storage across reloads
      if (typeof window !== 'undefined') {
        localStorage.setItem(`rms_avatar_${userId}`, base64Data);
      }
      if (currentUser) {
        TokenStorage.setUser({ ...currentUser, avatar: base64Data });
      }
      return {
        id: userId,
        customer_id: userId,
        name: currentUser?.name || 'Valued Guest',
        email: currentUser?.email || '',
        avatar: base64Data,
      };
    }
  },

  /**
   * Remove profile picture via DELETE /customers/me/profile/picture
   */
  async removeAvatar(_customerId: string): Promise<CustomerProfile> {
    const currentUser = TokenStorage.getUser();
    const userId = currentUser?.id || _customerId;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(`rms_avatar_${userId}`);
    }
    if (currentUser) {
      const updated = { ...currentUser };
      delete updated.avatar;
      TokenStorage.setUser(updated);
    }

    try {
      await apiClient.delete('/customers/me/profile/picture');
    } catch {
      // Ignore 403/404 on backend delete
    }

    return {
      id: userId,
      customer_id: userId,
      name: currentUser?.name || 'Valued Guest',
      email: currentUser?.email || '',
      avatar: '',
    };
  },

  /**
   * Invite customer, staff, or manager via POST /tenants/{tenant_id}/invitations
   */
  async inviteUser(
    tenantId: string,
    payload: {
      email: string;
      full_name: string;
      role: string;
      restaurant_id?: string;
      branch_id?: string;
    }
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        `/tenants/${encodeURIComponent(tenantId)}/invitations`,
        {
          email: payload.email.trim(),
          full_name: payload.full_name.trim(),
          role: payload.role.toUpperCase(),
          restaurant_id: payload.restaurant_id || undefined,
          branch_id: payload.branch_id || undefined,
        }
      );
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        return {
          message: `Invitation dispatched to ${payload.email} for ${payload.full_name} with role ${payload.role}.`,
        };
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};
