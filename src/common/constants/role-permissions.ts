import { Permission } from '../enums/permission.enum.js';
import { UserRole } from '../enums/user-role.enum.js';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),

  [UserRole.MANAGER]: [
    Permission.DASHBOARD_VIEW,
    Permission.CUSTOMERS_READ,
    Permission.CUSTOMERS_MANAGE,
    Permission.REPAIRS_READ,
    Permission.REPAIRS_MANAGE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_MANAGE,
    Permission.SALES_READ,
    Permission.SALES_MANAGE,
    Permission.EXPENSES_MANAGE,
    Permission.REPORTS_VIEW,
  ],

  [UserRole.CASHIER]: [
    Permission.DASHBOARD_VIEW,
    Permission.CUSTOMERS_READ,
    Permission.SALES_READ,
    Permission.SALES_MANAGE,
  ],

  [UserRole.TECHNICIAN]: [
    Permission.DASHBOARD_VIEW,
    Permission.REPAIRS_READ,
    Permission.REPAIRS_ASSIGNED_MANAGE,
    Permission.INVENTORY_READ,
  ],
};

export function roleHasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
