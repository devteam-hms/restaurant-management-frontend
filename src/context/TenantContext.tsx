import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TenantItem, TenantUpdatePayload } from '@/types/tenant';
import { tenantService } from '@/services/tenant.service';
import { useAuth } from './AuthContext';
import { toast } from '@/utils/toast';
import { extractErrorMessage } from '@/utils/apiError';

interface TenantContextValue {
  tenant: TenantItem | null;
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;
  refreshTenant: () => Promise<TenantItem | null>;
  updateTenant: (payload: TenantUpdatePayload) => Promise<TenantItem>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, updateCurrentUserProfile } = useAuth();
  const [tenant, setTenant] = useState<TenantItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active resolved tenant ID
  const activeTenantId = user?.tenant_id || tenant?.tenant_id || null;

  const loadTenantProfile = useCallback(
    async (targetTenantId?: string | null): Promise<TenantItem | null> => {
      const tid = targetTenantId || user?.tenant_id;

      if (!tid) {
        // If user is admin but has no direct tenant_id in token, attempt to query /tenants
        const hasAdminRole = user?.roles?.some((r) =>
          ['OWNER', 'MANAGER', 'TENANT_ADMIN', 'ADMIN'].includes(r.toUpperCase())
        );

        if (hasAdminRole && isAuthenticated) {
          try {
            setIsLoading(true);
            const listRes = await tenantService.getTenants({ limit: 1 });
            if (listRes.data && listRes.data.length > 0) {
              const resolved = listRes.data[0];
              setTenant(resolved);
              setError(null);
              updateCurrentUserProfile({
                tenant_id: resolved.tenant_id,
                tenant_name: resolved.tenant_name,
              });
              return resolved;
            }
          } catch (e: any) {
            console.warn('Failed to load tenants list for user:', e);
          } finally {
            setIsLoading(false);
          }
        }
        setTenant(null);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetched = await tenantService.getTenantById(tid);
        setTenant(fetched);
        if (user && user.tenant_name !== fetched.tenant_name) {
          updateCurrentUserProfile({ tenant_name: fetched.tenant_name });
        }
        return fetched;
      } catch (err: any) {
        const msg = extractErrorMessage(err, 'Failed to retrieve tenant organization details');
        setError(msg);
        console.error('Error loading tenant profile:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.tenant_id, user?.roles, isAuthenticated, updateCurrentUserProfile]
  );

  // Sync tenant when user identity or session changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clear tenant on logout or unauthenticated state
      setTenant(null);
      setError(null);
      setIsLoading(false);
      tenantService.clearAllTenantData();
      return;
    }

    // Only load tenant for admin/owner portal sessions
    const isStaffOrAdmin = user.roles.some((r) =>
      ['OWNER', 'MANAGER', 'STAFF', 'TENANT_ADMIN', 'ADMIN'].includes(r.toUpperCase())
    );

    if (isStaffOrAdmin) {
      loadTenantProfile(user.tenant_id);
    } else {
      setTenant(null);
    }
  }, [isAuthenticated, user?.id, user?.tenant_id, loadTenantProfile]);

  const refreshTenant = useCallback(async (): Promise<TenantItem | null> => {
    return loadTenantProfile(activeTenantId);
  }, [loadTenantProfile, activeTenantId]);

  const updateTenant = useCallback(
    async (payload: TenantUpdatePayload): Promise<TenantItem> => {
      if (!activeTenantId) {
        throw new Error('No active tenant associated with this session to update.');
      }

      const updated = await tenantService.updateTenant(activeTenantId, payload);
      setTenant(updated);

      // Keep user context in sync
      if (payload.tenant_name && payload.tenant_name !== user?.tenant_name) {
        updateCurrentUserProfile({ tenant_name: updated.tenant_name });
      }

      return updated;
    },
    [activeTenantId, user?.tenant_name, updateCurrentUserProfile]
  );

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantId: activeTenantId,
        isLoading,
        error,
        refreshTenant,
        updateTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

