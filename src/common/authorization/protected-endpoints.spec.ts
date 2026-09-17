import { describe, expect, it } from 'vitest';
import { Permission } from '../enums/permission.enum.js';
import { UserRole } from '../enums/user-role.enum.js';
import { roleHasPermission } from '../constants/role-permissions.js';

/** Maps representative API areas to required permissions (guard metadata). */
const PROTECTED_ENDPOINTS: {
  name: string;
  permission: Permission;
  anyOf?: Permission[];
  allowed: UserRole[];
}[] = [
  {
    name: 'GET /users',
    permission: Permission.USERS_READ,
    allowed: [UserRole.ADMIN],
  },
  {
    name: 'POST /users',
    permission: Permission.USERS_CREATE,
    allowed: [UserRole.ADMIN],
  },
  {
    name: 'GET /customers',
    permission: Permission.CUSTOMERS_READ,
    allowed: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
  },
  {
    name: 'GET /repairs',
    permission: Permission.REPAIRS_READ,
    allowed: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN],
  },
  {
    name: 'POST /repairs',
    permission: Permission.REPAIRS_MANAGE,
    allowed: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: 'PATCH /repairs/:id/diagnostics',
    permission: Permission.REPAIRS_ASSIGNED_MANAGE,
    anyOf: [Permission.REPAIRS_MANAGE, Permission.REPAIRS_ASSIGNED_MANAGE],
    allowed: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN],
  },
  {
    name: 'GET /inventory/products',
    permission: Permission.INVENTORY_READ,
    allowed: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN],
  },
  {
    name: 'POST /inventory/receive',
    permission: Permission.INVENTORY_MANAGE,
    allowed: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: 'GET /sales',
    permission: Permission.SALES_READ,
    allowed: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
  },
  {
    name: 'POST /payments',
    permission: Permission.SALES_MANAGE,
    allowed: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
  },
  {
    name: 'GET /expenses',
    permission: Permission.EXPENSES_MANAGE,
    allowed: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: 'GET /reports/daily',
    permission: Permission.REPORTS_VIEW,
    allowed: [UserRole.ADMIN, UserRole.MANAGER],
  },
];

const ALL_ROLES = Object.values(UserRole);

describe('protected endpoint permission matrix', () => {
  for (const endpoint of PROTECTED_ENDPOINTS) {
    describe(endpoint.name, () => {
      for (const role of ALL_ROLES) {
        const shouldAllow = endpoint.allowed.includes(role);
        it(`${role} ${shouldAllow ? 'allowed' : 'denied'}`, () => {
          const perms = endpoint.anyOf ?? [endpoint.permission];
          const hasAccess = perms.some((p) => roleHasPermission(role, p));
          expect(hasAccess).toBe(shouldAllow);
        });
      }
    });
  }
});
