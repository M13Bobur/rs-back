import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { UserRole } from '../enums/user-role.enum.js';
import type { UserDocument } from '../../modules/users/schemas/user.schema.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: UserDocument }>();

    if (!user) {
      throw new ForbiddenException('Kirish rad etildi');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Bu amal uchun ruxsat yo‘q');
    }

    return true;
  }
}
