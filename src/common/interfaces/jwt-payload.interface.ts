import { UserRole } from '../enums/user-role.enum.js';

export interface JwtPayload {
  sub: string;
  login: string;
  role: UserRole;
}
