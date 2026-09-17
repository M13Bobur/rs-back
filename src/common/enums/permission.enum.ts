export enum Permission {
  DASHBOARD_VIEW = 'dashboard:view',

  USERS_READ = 'users:read',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',

  CUSTOMERS_READ = 'customers:read',
  CUSTOMERS_MANAGE = 'customers:manage',

  REPAIRS_READ = 'repairs:read',
  REPAIRS_MANAGE = 'repairs:manage',

  INVENTORY_READ = 'inventory:read',
  INVENTORY_MANAGE = 'inventory:manage',

  SALES_READ = 'sales:read',
  SALES_MANAGE = 'sales:manage',

  EXPENSES_MANAGE = 'expenses:manage',

  REPAIRS_ASSIGNED_MANAGE = 'repairs:assigned:manage',

  REPORTS_VIEW = 'reports:view',
}
