import { SetMetadata } from '@nestjs/common';
import { Permission } from '../enums/permission.enum.js';
import { PERMISSIONS_KEY, PERMISSIONS_MODE_KEY } from './permissions.decorator.js';

export const PermissionsAny = (...permissions: Permission[]) => {
  return (
    target: object,
    key?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    SetMetadata(PERMISSIONS_KEY, permissions)(target, key!, descriptor!);
    SetMetadata(PERMISSIONS_MODE_KEY, 'any')(target, key!, descriptor!);
  };
};
