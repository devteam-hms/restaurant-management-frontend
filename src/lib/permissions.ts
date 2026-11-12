import { PermissionEnum, RoleEnum } from '@/types/permissions';

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
    PermissionEnum.MANAGE_TAX,
    PermissionEnum.VIEW_TAX,
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
    PermissionEnum.MANAGE_TAX,
    PermissionEnum.VIEW_TAX,
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
    PermissionEnum.VIEW_TAX,
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
    PermissionEnum.VIEW_TAX,
  ],
  [RoleEnum.CUSTOMER]: [
    PermissionEnum.VIEW_PROFILE,
    PermissionEnum.VIEW_MENU,
    PermissionEnum.CREATE_ORDER,
    PermissionEnum.VIEW_ORDER,
    PermissionEnum.VIEW_BILL,
  ],
};

export function hasPermission(
  roles: string[] | undefined | null,
  permission: PermissionEnum
): boolean {
  if (!roles || roles.length === 0) return false;

  for (const rawRole of roles) {
    const roleUpper = rawRole.toUpperCase();
    if (roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPERADMIN') {
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

export function hasAnyPermission(
  roles: string[] | undefined | null,
  permissions: PermissionEnum[]
): boolean {
  return permissions.some((perm) => hasPermission(roles, perm));
}

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
  return hasRole(roles, RoleEnum.MANAGER) || isOwner(roles);
}

export function isStaff(roles: string[] | undefined | null): boolean {
  return hasRole(roles, RoleEnum.STAFF) || isManager(roles);
}

export function isCustomer(roles: string[] | undefined | null): boolean {
  return hasRole(roles, RoleEnum.CUSTOMER);
}

export function isTenantAdmin(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  const adminRoles = ['OWNER', 'MANAGER', 'SUPER_ADMIN', 'SUPERADMIN', 'TENANT_ADMIN', 'ADMIN'];
  return roles.some((r) => adminRoles.includes(r.toUpperCase()));
}

export function isCustomerAuthorized(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  // Any authenticated customer or owner can use the customer portal
  return true;
}

