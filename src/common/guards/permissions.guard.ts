import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { roleHasPermission } from '../constants/role-permissions.js';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
} from '../decorators/permissions.decorator.js';
import { Permission } from '../enums/permission.enum.js';
import type { UserDocument } from '../../modules/users/schemas/user.schema.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: UserDocument }>();

    if (!user) {
      throw new ForbiddenException('Kirish rad etildi');
    }

    const mode =
      this.reflector.getAllAndOverride<'all' | 'any'>(PERMISSIONS_MODE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'all';

    const allowed =
      mode === 'any'
        ? requiredPermissions.some((permission) =>
            roleHasPermission(user.role, permission),
          )
        : requiredPermissions.every((permission) =>
            roleHasPermission(user.role, permission),
          );

    if (!allowed) {
      throw new ForbiddenException('Bu amal uchun ruxsat yo‘q');
    }

    return true;
  }
}
