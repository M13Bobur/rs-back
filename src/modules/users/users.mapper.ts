import { UserResponseDto } from './dto/user-response.dto.js';
import { UserDocument } from './schemas/user.schema.js';

export function toUserResponse(user: UserDocument): UserResponseDto {
  return {
    id: user.id,
    login: user.login,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
