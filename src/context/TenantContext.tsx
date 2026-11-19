import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TenantItem, TenantUpdatePayload } from '@/types/tenant';
import { tenantService } from '@/services/tenant.service';
import { useAuth } from './AuthContext';
import { TokenStorage } from '@/lib/token-storage';
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
  const activeTenantId = tenant?.tenant_id || user?.tenant_id || TokenStorage.getCurrentTenantId() || null;

  const loadTenantProfile = useCallback(
    async (targetTenantId?: string | null): Promise<TenantItem | null> => {
      if (!isAuthenticated) return null;

      const hasAdminRole = user?.roles?.some((r) =>
        ['OWNER', 'MANAGER', 'STAFF', 'TENANT_ADMIN', 'ADMIN'].includes(r.toUpperCase())
      );

      if (!hasAdminRole) {
        setTenant(null);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const listRes = await tenantService.getTenants({ limit: 50 });
        if (listRes.data && listRes.data.length > 0) {
          const savedId = targetTenantId || user?.tenant_id || TokenStorage.getCurrentTenantId();
          const matched = (savedId && listRes.data.find(t => t.tenant_id === savedId)) || listRes.data[0];

          setTenant(matched);
          TokenStorage.setCurrentTenantId(matched.tenant_id);

          if (user && (user.tenant_id !== matched.tenant_id || user.tenant_name !== matched.tenant_name)) {
            updateCurrentUserProfile({
              tenant_id: matched.tenant_id,
              tenant_name: matched.tenant_name,
            });
          }
          return matched;
        }

        // If no tenants found from backend, try getTenantById if ID is known
        const fallbackId = targetTenantId || user?.tenant_id || TokenStorage.getCurrentTenantId();
        if (fallbackId) {
          const single = await tenantService.getTenantById(fallbackId);
          setTenant(single);
          return single;
        }

        setTenant(null);
        return null;
      } catch (err: any) {
        const msg = extractErrorMessage(err, 'Failed to retrieve tenant organization details');
        setError(msg);
        console.error('Error loading tenant profile:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, isAuthenticated, updateCurrentUserProfile]
  );

  // Sync tenant when user identity or session changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTenant(null);
      setError(null);
      setIsLoading(false);
      tenantService.clearAllTenantData();
      return;
    }

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

  const handleUpdateTenant = useCallback(
    async (payload: TenantUpdatePayload): Promise<TenantItem> => {
      const targetId = activeTenantId;
      if (!targetId) {
        throw new Error('No active tenant organization identity found to update');
      }

      setIsLoading(true);
      try {
        const updated = await tenantService.updateTenant(targetId, payload);
        setTenant(updated);
        updateCurrentUserProfile({ tenant_name: updated.tenant_name });
        return updated;
      } catch (err: any) {
        const msg = extractErrorMessage(err, 'Failed to save organization modifications');
        toast.error('Update Failed', msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [activeTenantId, updateCurrentUserProfile]
  );

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantId: activeTenantId,
        isLoading,
        error,
        refreshTenant,
        updateTenant: handleUpdateTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextValue => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be consumed within a <TenantProvider>');
  }
  return context;
};
