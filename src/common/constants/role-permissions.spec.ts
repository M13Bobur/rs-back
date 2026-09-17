import { describe, expect, it } from 'vitest';
import { Permission } from '../enums/permission.enum.js';
import { UserRole } from '../enums/user-role.enum.js';
import { roleHasPermission } from './role-permissions.js';

describe('roleHasPermission', () => {
  it('grants ADMIN all permissions', () => {
    for (const permission of Object.values(Permission)) {
      expect(roleHasPermission(UserRole.ADMIN, permission)).toBe(true);
    }
  });

  it('MANAGER can manage operations but not users', () => {
    expect(roleHasPermission(UserRole.MANAGER, Permission.REPAIRS_MANAGE)).toBe(
      true,
    );
    expect(roleHasPermission(UserRole.MANAGER, Permission.EXPENSES_MANAGE)).toBe(
      true,
    );
    expect(roleHasPermission(UserRole.MANAGER, Permission.USERS_READ)).toBe(
      false,
    );
  });

  it('CASHIER can sell and take payments but not repairs or inventory', () => {
    expect(roleHasPermission(UserRole.CASHIER, Permission.SALES_MANAGE)).toBe(
      true,
    );
    expect(roleHasPermission(UserRole.CASHIER, Permission.CUSTOMERS_READ)).toBe(
      true,
    );
    expect(roleHasPermission(UserRole.CASHIER, Permission.REPAIRS_READ)).toBe(
      false,
    );
    expect(roleHasPermission(UserRole.CASHIER, Permission.INVENTORY_READ)).toBe(
      false,
    );
    expect(roleHasPermission(UserRole.CASHIER, Permission.EXPENSES_MANAGE)).toBe(
      false,
    );
  });

  it('TECHNICIAN can work assigned repairs and read inventory catalog', () => {
    expect(roleHasPermission(UserRole.TECHNICIAN, Permission.REPAIRS_READ)).toBe(
      true,
    );
    expect(
      roleHasPermission(UserRole.TECHNICIAN, Permission.REPAIRS_ASSIGNED_MANAGE),
    ).toBe(true);
    expect(roleHasPermission(UserRole.TECHNICIAN, Permission.REPAIRS_MANAGE)).toBe(
      false,
    );
    expect(roleHasPermission(UserRole.TECHNICIAN, Permission.INVENTORY_READ)).toBe(
      true,
    );
    expect(
      roleHasPermission(UserRole.TECHNICIAN, Permission.INVENTORY_MANAGE),
    ).toBe(false);
    expect(roleHasPermission(UserRole.TECHNICIAN, Permission.SALES_READ)).toBe(
      false,
    );
  });
});
