import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserDocument } from '../../modules/users/schemas/user.schema.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument => {
    const request = ctx.switchToHttp().getRequest<{ user: UserDocument }>();
    return request.user;
  },
);
