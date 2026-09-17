import { RepairStatus } from '../../../common/enums/repair-status.enum.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';

export const ALLOWED_STATUS_TRANSITIONS: Record<
  RepairStatus,
  RepairStatus[]
> = {
  [RepairStatus.WAITING]: [
    RepairStatus.DIAGNOSIS,
    RepairStatus.CANCELLED,
  ],
  [RepairStatus.DIAGNOSIS]: [
    RepairStatus.WAITING_CUSTOMER_APPROVAL,
    RepairStatus.IN_PROGRESS,
    RepairStatus.CANCELLED,
  ],
  [RepairStatus.WAITING_CUSTOMER_APPROVAL]: [
    RepairStatus.IN_PROGRESS,
    RepairStatus.CANCELLED,
  ],
  [RepairStatus.IN_PROGRESS]: [RepairStatus.READY, RepairStatus.CANCELLED],
  [RepairStatus.READY]: [RepairStatus.DELIVERED, RepairStatus.CANCELLED],
  [RepairStatus.DELIVERED]: [],
  [RepairStatus.CANCELLED]: [],
};

const MANAGER_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER];

export function canTransitionStatus(
  role: UserRole,
  from: RepairStatus,
  to: RepairStatus,
): boolean {
  if (!ALLOWED_STATUS_TRANSITIONS[from].includes(to)) {
    return false;
  }

  if (MANAGER_ROLES.includes(role)) {
    return true;
  }

  if (role === UserRole.TECHNICIAN) {
    const technicianAllowed: RepairStatus[] = [
      RepairStatus.DIAGNOSIS,
      RepairStatus.IN_PROGRESS,
      RepairStatus.READY,
      RepairStatus.WAITING_CUSTOMER_APPROVAL,
    ];
    return technicianAllowed.includes(to);
  }

  return false;
}

export function canCancelOrDeliver(role: UserRole): boolean {
  return MANAGER_ROLES.includes(role);
}
