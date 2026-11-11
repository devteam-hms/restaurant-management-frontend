"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { tenantService } from "@/services/tenant.service";
import { restaurantService } from "@/services/restaurant.service";
import { TokenStorage } from "@/lib/token-storage";
import { AuthUser, LoginPayload } from "@/types/auth";
import { TenantItem, TenantSignupPayload } from "@/types/tenant";
import { RestaurantItem } from "@/types/restaurant";
import { PermissionEnum } from "@/types/permissions";
import {
  hasPermission as checkPermission,
  isOwner as checkIsOwner,
  isManager as checkIsManager,
  isStaff as checkIsStaff,
  canCreateRestaurant as checkCanCreateRestaurant,
  canUpdateRestaurant as checkCanUpdateRestaurant,
  canDeleteRestaurant as checkCanDeleteRestaurant,
  canCreateBranch as checkCanCreateBranch,
  canUpdateBranch as checkCanUpdateBranch,
  canDeleteBranch as checkCanDeleteBranch,
  canUpdateTenant as checkCanUpdateTenant,
  canDeleteTenant as checkCanDeleteTenant,
  canInviteUsers as checkCanInviteUsers,
  canViewMenu as checkCanViewMenu,
  canCreateMenu as checkCanCreateMenu,
  canUpdateMenu as checkCanUpdateMenu,
  canDeleteMenu as checkCanDeleteMenu,
  canViewOrders as checkCanViewOrders,
  canCreateOrder as checkCanCreateOrder,
  canUpdateOrderStatus as checkCanUpdateOrderStatus,
  canUpdatePaymentStatus as checkCanUpdatePaymentStatus,
  canCancelOrder as checkCanCancelOrder,
} from "@/lib/permissions";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";

interface AuthContextType {
  user: AuthUser | null;
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  currentTenant: TenantItem | null;
  currentRestaurant: RestaurantItem | null;
  login: (payload: LoginPayload) => Promise<void>;
  registerAndLogin: (payload: TenantSignupPayload) => Promise<{ tenant_id: string }>;
  logout: () => void;
  setCurrentTenant: (tenant: TenantItem | null) => void;
  setCurrentRestaurant: (restaurant: RestaurantItem | null) => void;
  refreshCurrentTenant: () => Promise<TenantItem | null>;
  // Role & permission helpers
  hasPermission: (permission: PermissionEnum) => boolean;
  isOwner: boolean;
  isManager: boolean;
  isStaff: boolean;
  canCreateRestaurant: boolean;
  canUpdateRestaurant: boolean;
  canDeleteRestaurant: boolean;
  canCreateBranch: boolean;
  canUpdateBranch: boolean;
  canDeleteBranch: boolean;
  canUpdateTenant: boolean;
  canDeleteTenant: boolean;
  canInviteUsers: boolean;
  canViewMenu: boolean;
  canCreateMenu: boolean;
  canUpdateMenu: boolean;
  canDeleteMenu: boolean;
  canViewOrders: boolean;
  canCreateOrder: boolean;
  canUpdateOrderStatus: boolean;
  canUpdatePaymentStatus: boolean;
  canCancelOrder: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTenant, setCurrentTenantState] = useState<TenantItem | null>(null);
  const [currentRestaurant, setCurrentRestaurantState] =
    useState<RestaurantItem | null>(null);

  // Initialize auth state from storage on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const token = TokenStorage.getAccessToken();
        const storedUser = TokenStorage.getUser();

        if (token && storedUser) {
          setUser(storedUser);

          // Fetch tenants to restore active tenant
          try {
            const tenantRes = await tenantService.getTenants(1, 10);
            if (tenantRes.data.length > 0) {
              const savedTenantId = TokenStorage.getCurrentTenantId();
              const matchedTenant =
                tenantRes.data.find((t) => t.tenant_id === savedTenantId) ||
                tenantRes.data[0];
              setCurrentTenantState(matchedTenant);
              TokenStorage.setCurrentTenantId(matchedTenant.tenant_id);

              // Restore active restaurant if available
              const savedRestId = TokenStorage.getCurrentRestaurantId();
              if (savedRestId) {
                try {
                  const restRes = await restaurantService.getRestaurants({
                    page: 1,
                    limit: 50,
                    tenant_id: matchedTenant.tenant_id,
                  });
                  const matchedRest = restRes.data.find(
                    (r) => r.restaurant_id === savedRestId
                  );
                  if (matchedRest) {
                    setCurrentRestaurantState(matchedRest);
                  }
                } catch {
                  // Not fatal
                }
              }
            }
          } catch (err) {
            // If getTenants fails with 401, token might be invalid
            console.error("Failed to fetch initial tenants:", err);
          }
        }
      } catch (err) {
        console.error("Failed to initialize auth state", err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const setCurrentTenant = useCallback((tenant: TenantItem | null) => {
    setCurrentTenantState(tenant);
    TokenStorage.setCurrentTenantId(tenant?.tenant_id || null);
    // When switching tenant, clear current selected restaurant
    setCurrentRestaurantState(null);
    TokenStorage.setCurrentRestaurantId(null);
  }, []);

  const setCurrentRestaurant = useCallback((restaurant: RestaurantItem | null) => {
    setCurrentRestaurantState(restaurant);
    TokenStorage.setCurrentRestaurantId(restaurant?.restaurant_id || null);
  }, []);

  const refreshCurrentTenant = useCallback(async (): Promise<TenantItem | null> => {
    try {
      const res = await tenantService.getTenants(1, 10);
      if (res.data.length > 0) {
        const savedTenantId = TokenStorage.getCurrentTenantId();
        const matched =
          res.data.find((t) => t.tenant_id === savedTenantId) || res.data[0];
        setCurrentTenantState(matched);
        TokenStorage.setCurrentTenantId(matched.tenant_id);
        return matched;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      try {
        const data = await authService.login(payload);
        if (data.user) {
          setUser(data.user);
        } else {
          // Fallback user structure if not directly provided
          const fallbackUser: AuthUser = {
            id: null,
            keycloak_id: "",
            email: payload.email || null,
            username: payload.username || null,
            roles: ["OWNER"],
          };
          setUser(fallbackUser);
          TokenStorage.setUser(fallbackUser);
        }

        // Fetch tenant details immediately after login
        try {
          const tenantRes = await tenantService.getTenants(1, 10);
          if (tenantRes.data.length > 0) {
            const firstTenant = tenantRes.data[0];
            setCurrentTenantState(firstTenant);
            TokenStorage.setCurrentTenantId(firstTenant.tenant_id);
          }
        } catch {
          // Non-fatal if initial tenant list is empty or delayed
        }

        toast.success("Welcome back! Authentication successful.", "Signed In");
        router.push("/dashboard");
      } catch (err: any) {
        const msg = extractErrorMessage(err);
        toast.error(msg, "Login Failed");
        throw err;
      }
    },
    [router, toast]
  );

  /**
   * Complete Registration Workflow:
   * 1. POST /tenants/signup -> TenantSignupResponse { tenant_id, user_id }
   * 2. Automatically login using the same credentials: POST /auth/login
   * 3. Set tokens, state, and redirect to restaurant onboarding page!
   */
  const registerAndLogin = useCallback(
    async (payload: TenantSignupPayload) => {
      try {
        // Step 1: Register Tenant and Initial Owner
        const signupRes = await tenantService.signup(payload);
        toast.success(
          "Tenant and account created! Logging in...",
          "Registration Successful"
        );

        // Step 2: Auto-login with Keycloak credentials
        const loginData = await authService.login({
          email: payload.owner.email,
          password: payload.owner.password,
        });

        if (loginData.user) {
          setUser(loginData.user);
        }

        // Save new tenant ID
        TokenStorage.setCurrentTenantId(signupRes.tenant_id);

        // Try to fetch newly created tenant details
        try {
          const tenantsList = await tenantService.getTenants(1, 10);
          const created = tenantsList.data.find(
            (t) => t.tenant_id === signupRes.tenant_id
          );
          if (created) {
            setCurrentTenantState(created);
          } else {
            setCurrentTenantState({
              tenant_id: signupRes.tenant_id,
              tenant_name: payload.tenant_name,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } catch {
          setCurrentTenantState({
            tenant_id: signupRes.tenant_id,
            tenant_name: payload.tenant_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        toast.success(
          "Welcome to your new restaurant management workspace!",
          "Setup Complete"
        );

        // Redirect directly to restaurants onboarding page
        router.push("/restaurants");
        return { tenant_id: signupRes.tenant_id };
      } catch (err: any) {
        const msg = extractErrorMessage(err);
        toast.error(msg, "Registration Failed");
        throw err;
      }
    },
    [router, toast]
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setCurrentTenantState(null);
    setCurrentRestaurantState(null);
    toast.info("You have been signed out.", "Session Ended");
    router.push("/login");
  }, [router, toast]);

  // Derive roles: if user has a tenant and roles doesn't explicitly restrict (e.g. MANAGER/STAFF),
  // ensure OWNER is granted so tenant creators have full management access
  const roles = useMemo(() => {
    const list = [...(user?.roles || [])];
    const isRestrictedRole = list.some((r) =>
      ["MANAGER", "STAFF", "CUSTOMER"].includes(r.toUpperCase())
    );
    if (!isRestrictedRole && !list.some((r) => r.toUpperCase() === "OWNER")) {
      list.push("OWNER");
    }
    return list;
  }, [user]);

  const hasPermissionFn = useCallback(
    (permission: PermissionEnum) => checkPermission(roles, permission),
    [roles]
  );

  const isOwnerVal = useMemo(() => checkIsOwner(roles), [roles]);
  const isManagerVal = useMemo(() => checkIsManager(roles), [roles]);
  const isStaffVal = useMemo(() => checkIsStaff(roles), [roles]);

  const canCreateRestaurantVal = useMemo(
    () => checkCanCreateRestaurant(roles),
    [roles]
  );
  const canUpdateRestaurantVal = useMemo(
    () => checkCanUpdateRestaurant(roles),
    [roles]
  );
  const canDeleteRestaurantVal = useMemo(
    () => checkCanDeleteRestaurant(roles),
    [roles]
  );

  const canCreateBranchVal = useMemo(() => checkCanCreateBranch(roles), [roles]);
  const canUpdateBranchVal = useMemo(() => checkCanUpdateBranch(roles), [roles]);
  const canDeleteBranchVal = useMemo(() => checkCanDeleteBranch(roles), [roles]);

  const canUpdateTenantVal = useMemo(() => checkCanUpdateTenant(roles), [roles]);
  const canDeleteTenantVal = useMemo(() => checkCanDeleteTenant(roles), [roles]);
  const canInviteUsersVal = useMemo(() => checkCanInviteUsers(roles), [roles]);
  const canViewMenuVal = useMemo(() => checkCanViewMenu(roles), [roles]);
  const canCreateMenuVal = useMemo(() => checkCanCreateMenu(roles), [roles]);
  const canUpdateMenuVal = useMemo(() => checkCanUpdateMenu(roles), [roles]);
  const canDeleteMenuVal = useMemo(() => checkCanDeleteMenu(roles), [roles]);
  const canViewOrdersVal = useMemo(() => checkCanViewOrders(roles), [roles]);
  const canCreateOrderVal = useMemo(() => checkCanCreateOrder(roles), [roles]);
  const canUpdateOrderStatusVal = useMemo(() => checkCanUpdateOrderStatus(roles), [roles]);
  const canUpdatePaymentStatusVal = useMemo(() => checkCanUpdatePaymentStatus(roles), [roles]);
  const canCancelOrderVal = useMemo(() => checkCanCancelOrder(roles), [roles]);

  const value = {
    user,
    roles,
    isAuthenticated: !!user && authService.isAuthenticated(),
    isLoading,
    currentTenant,
    currentRestaurant,
    login,
    registerAndLogin,
    logout,
    setCurrentTenant,
    setCurrentRestaurant,
    refreshCurrentTenant,
    hasPermission: hasPermissionFn,
    isOwner: isOwnerVal,
    isManager: isManagerVal,
    isStaff: isStaffVal,
    canCreateRestaurant: canCreateRestaurantVal,
    canUpdateRestaurant: canUpdateRestaurantVal,
    canDeleteRestaurant: canDeleteRestaurantVal,
    canCreateBranch: canCreateBranchVal,
    canUpdateBranch: canUpdateBranchVal,
    canDeleteBranch: canDeleteBranchVal,
    canUpdateTenant: canUpdateTenantVal,
    canDeleteTenant: canDeleteTenantVal,
    canInviteUsers: canInviteUsersVal,
    canViewMenu: canViewMenuVal,
    canCreateMenu: canCreateMenuVal,
    canUpdateMenu: canUpdateMenuVal,
    canDeleteMenu: canDeleteMenuVal,
    canViewOrders: canViewOrdersVal,
    canCreateOrder: canCreateOrderVal,
    canUpdateOrderStatus: canUpdateOrderStatusVal,
    canUpdatePaymentStatus: canUpdatePaymentStatusVal,
    canCancelOrder: canCancelOrderVal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

