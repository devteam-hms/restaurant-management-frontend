import { PermissionEnum, RoleEnum } from "@/types/permissions";

// Exact role permissions mapped directly from backend app/modules/permissions/models.py
export const ROLE_PERMISSIONS: Record<RoleEnum, PermissionEnum[]> = {
  [RoleEnum.SUPER_ADMIN]: [
    PermissionEnum.INVITE_USERS,
    PermissionEnum.MANAGE_USERS,
    PermissionEnum.VIEW_USERS,
    PermissionEnum.DELETE_USERS,
    PermissionEnum.BRANCH_UPDATE_USERS,
    PermissionEnum.MANAGE_TENANT,
    PermissionEnum.UPDATE_TENANT,
    PermissionEnum.DELETE_TENANT,
    PermissionEnum.MANAGE_RESTAURANT,
    PermissionEnum.UPDATE_RESTAURANT,
    PermissionEnum.DELETE_RESTAURANT,
    PermissionEnum.MANAGE_BRANCH,
    PermissionEnum.UPDATE_BRANCH,
    PermissionEnum.DELETE_BRANCH,
    PermissionEnum.OPERATE_BRANCH,
    PermissionEnum.CREATE_MENU,
    PermissionEnum.UPDATE_MENU,
    PermissionEnum.DELETE_MENU,
    PermissionEnum.VIEW_MENU,
    PermissionEnum.VIEW_PROFILE,
    PermissionEnum.CREATE_ORDER,
    PermissionEnum.VIEW_ORDER,
    PermissionEnum.UPDATE_ORDER,
    PermissionEnum.CANCEL_ORDER,
    PermissionEnum.GENERATE_BILL,
    PermissionEnum.VIEW_BILL,
    PermissionEnum.UPDATE_BILL,
    PermissionEnum.CANCEL_BILL,
  ],
  [RoleEnum.OWNER]: [
    PermissionEnum.INVITE_USERS,
    PermissionEnum.MANAGE_USERS,
    PermissionEnum.VIEW_USERS,
    PermissionEnum.DELETE_USERS,
    PermissionEnum.BRANCH_UPDATE_USERS,
    PermissionEnum.MANAGE_TENANT,
    PermissionEnum.UPDATE_TENANT,
    PermissionEnum.DELETE_TENANT,
    PermissionEnum.MANAGE_RESTAURANT,
    PermissionEnum.UPDATE_RESTAURANT,
    PermissionEnum.DELETE_RESTAURANT,
    PermissionEnum.MANAGE_BRANCH,
    PermissionEnum.UPDATE_BRANCH,
    PermissionEnum.DELETE_BRANCH,
    PermissionEnum.OPERATE_BRANCH,
    PermissionEnum.CREATE_MENU,
    PermissionEnum.UPDATE_MENU,
    PermissionEnum.DELETE_MENU,
    PermissionEnum.VIEW_MENU,
    PermissionEnum.VIEW_PROFILE,
    PermissionEnum.CREATE_ORDER,
    PermissionEnum.VIEW_ORDER,
    PermissionEnum.UPDATE_ORDER,
    PermissionEnum.CANCEL_ORDER,
    PermissionEnum.GENERATE_BILL,
    PermissionEnum.VIEW_BILL,
    PermissionEnum.UPDATE_BILL,
    PermissionEnum.CANCEL_BILL,
  ],
  [RoleEnum.MANAGER]: [
    PermissionEnum.INVITE_USERS,
    PermissionEnum.MANAGE_USERS,
    PermissionEnum.VIEW_USERS,
    PermissionEnum.BRANCH_UPDATE_USERS,
    PermissionEnum.MANAGE_RESTAURANT,
    PermissionEnum.UPDATE_RESTAURANT,
    PermissionEnum.MANAGE_BRANCH,
    PermissionEnum.UPDATE_BRANCH,
    PermissionEnum.OPERATE_BRANCH,
    PermissionEnum.CREATE_MENU,
    PermissionEnum.UPDATE_MENU,
    PermissionEnum.DELETE_MENU,
    PermissionEnum.VIEW_MENU,
    PermissionEnum.VIEW_PROFILE,
    PermissionEnum.CREATE_ORDER,
    PermissionEnum.VIEW_ORDER,
    PermissionEnum.UPDATE_ORDER,
    PermissionEnum.CANCEL_ORDER,
    PermissionEnum.GENERATE_BILL,
    PermissionEnum.VIEW_BILL,
    PermissionEnum.UPDATE_BILL,
    PermissionEnum.CANCEL_BILL,
  ],
  [RoleEnum.STAFF]: [
    PermissionEnum.OPERATE_BRANCH,
    PermissionEnum.VIEW_MENU,
    PermissionEnum.VIEW_USERS,
    PermissionEnum.VIEW_PROFILE,
    PermissionEnum.VIEW_ORDER,
    PermissionEnum.UPDATE_ORDER,
    PermissionEnum.CANCEL_ORDER,
    PermissionEnum.GENERATE_BILL,
    PermissionEnum.VIEW_BILL,
    PermissionEnum.UPDATE_BILL,
    PermissionEnum.CANCEL_BILL,
  ],
  [RoleEnum.CUSTOMER]: [
    PermissionEnum.VIEW_PROFILE,
    PermissionEnum.VIEW_MENU,
    PermissionEnum.CREATE_ORDER,
    PermissionEnum.VIEW_ORDER,
  ],
};

/**
 * Check if the given user roles grant a specific permission.
 */
export function hasPermission(
  roles: string[] | undefined | null,
  permission: PermissionEnum
): boolean {
  if (!roles || roles.length === 0) return false;

  for (const rawRole of roles) {
    const roleUpper = rawRole.toUpperCase();
    if (roleUpper === "SUPER_ADMIN" || roleUpper === "SUPERADMIN") {
      return true;
    }
    const roleKey = Object.values(RoleEnum).find(
      (r) => r.toUpperCase() === roleUpper
    );
    if (roleKey && ROLE_PERMISSIONS[roleKey]) {
      if (ROLE_PERMISSIONS[roleKey].includes(permission)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if user has ANY of the specified permissions.
 */
export function hasAnyPermission(
  roles: string[] | undefined | null,
  permissions: PermissionEnum[]
): boolean {
  return permissions.some((perm) => hasPermission(roles, perm));
}

/**
 * Check if the user has a specific role.
 */
export function hasRole(
  roles: string[] | undefined | null,
  targetRole: RoleEnum | string
): boolean {
  if (!roles || roles.length === 0) return false;
  const target = targetRole.toUpperCase();
  return roles.some((r) => r.toUpperCase() === target);
}

export function isOwner(roles: string[] | undefined | null): boolean {
  return hasRole(roles, RoleEnum.OWNER) || hasRole(roles, RoleEnum.SUPER_ADMIN);
}

export function isManager(roles: string[] | undefined | null): boolean {
  return hasRole(roles, RoleEnum.MANAGER);
}

export function isStaff(roles: string[] | undefined | null): boolean {
  return hasRole(roles, RoleEnum.STAFF);
}

export function canCreateRestaurant(roles: string[] | undefined | null): boolean {
  return hasPermission(roles, PermissionEnum.MANAGE_RESTAURANT);
}

export function canUpdateRestaurant(roles: string[] | undefined | null): boolean {
  return (
    hasPermission(roles, PermissionEnum.UPDATE_RESTAURANT) ||
    hasPermission(roles, PermissionEnum.MANAGE_RESTAURANT)
  );
}

export function canDeleteRestaurant(roles: string[] | undefined | null): boolean {
  return hasPermission(roles, PermissionEnum.DELETE_RESTAURANT);
}

export function canCreateBranch(roles: string[] | undefined | null): boolean {
  return hasPermission(roles, PermissionEnum.MANAGE_BRANCH);
}

export function canUpdateBranch(roles: string[] | undefined | null): boolean {
  return (
    hasPermission(roles, PermissionEnum.UPDATE_BRANCH) ||
    hasPermission(roles, PermissionEnum.MANAGE_BRANCH)
  );
}

export function canDeleteBranch(roles: string[] | undefined | null): boolean {
  return hasPermission(roles, PermissionEnum.DELETE_BRANCH);
}

export function canUpdateTenant(roles: string[] | undefined | null): boolean {
  return (
    hasPermission(roles, PermissionEnum.UPDATE_TENANT) ||
    hasPermission(roles, PermissionEnum.MANAGE_TENANT)
  );
}

export function canDeleteTenant(roles: string[] | undefined | null): boolean {
  return hasPermission(roles, PermissionEnum.DELETE_TENANT);
}

export function canInviteUsers(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  // STAFF and CUSTOMER have NO invitation access
  const isRestricted = roles.some((r) =>
    ["STAFF", "CUSTOMER"].includes(r.toUpperCase())
  );
  if (isRestricted) return false;
  return (
    hasRole(roles, RoleEnum.OWNER) ||
    hasRole(roles, RoleEnum.SUPER_ADMIN) ||
    hasRole(roles, RoleEnum.MANAGER) ||
    hasPermission(roles, PermissionEnum.INVITE_USERS)
  );
}

export function canManageUsers(roles: string[] | undefined | null): boolean {
  return (
    hasPermission(roles, PermissionEnum.MANAGE_USERS) ||
    isOwner(roles) ||
    isManager(roles)
  );
}

export function canViewMenu(roles: string[] | undefined | null): boolean {
  return (
    hasPermission(roles, PermissionEnum.VIEW_MENU) ||
    isOwner(roles) ||
    isManager(roles) ||
    isStaff(roles)
  );
}

export function canCreateMenu(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  if (roles.some((r) => ["STAFF", "CUSTOMER"].includes(r.toUpperCase()))) return false;
  return (
    hasPermission(roles, PermissionEnum.CREATE_MENU) ||
    isOwner(roles) ||
    isManager(roles)
  );
}

export function canUpdateMenu(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  if (roles.some((r) => ["STAFF", "CUSTOMER"].includes(r.toUpperCase()))) return false;
  return (
    hasPermission(roles, PermissionEnum.UPDATE_MENU) ||
    isOwner(roles) ||
    isManager(roles)
  );
}

export function canDeleteMenu(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  if (roles.some((r) => ["STAFF", "CUSTOMER"].includes(r.toUpperCase()))) return false;
  return (
    hasPermission(roles, PermissionEnum.DELETE_MENU) ||
    isOwner(roles) ||
    isManager(roles)
  );
}

// Order Management Permissions
export function canViewOrders(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  // CUSTOMER alone cannot view admin panel orders
  const upper = roles.map((r) => r.toUpperCase());
  const managementRoles = ["SUPER_ADMIN", "SUPERADMIN", "OWNER", "MANAGER", "STAFF"];
  return managementRoles.some((m) => upper.includes(m)) || hasPermission(roles, PermissionEnum.VIEW_ORDER);
}

export function canCreateOrder(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  // Backend allows order creation for authenticated customers or accounts that can create orders
  return (
    hasPermission(roles, PermissionEnum.CREATE_ORDER) ||
    isOwner(roles) ||
    isManager(roles)
  );
}

export function canUpdateOrderStatus(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  const upper = roles.map((r) => r.toUpperCase());
  // CUSTOMER cannot update order status in admin panel
  if (upper.length === 1 && upper[0] === "CUSTOMER") return false;
  return (
    hasPermission(roles, PermissionEnum.UPDATE_ORDER) ||
    isOwner(roles) ||
    isManager(roles) ||
    isStaff(roles)
  );
}

export function canUpdatePaymentStatus(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  const upper = roles.map((r) => r.toUpperCase());
  if (upper.length === 1 && upper[0] === "CUSTOMER") return false;
  return (
    hasPermission(roles, PermissionEnum.UPDATE_ORDER) ||
    isOwner(roles) ||
    isManager(roles) ||
    isStaff(roles)
  );
}

export function canCancelOrder(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  return (
    hasPermission(roles, PermissionEnum.CANCEL_ORDER) ||
    isOwner(roles) ||
    isManager(roles) ||
    isStaff(roles)
  );
}




