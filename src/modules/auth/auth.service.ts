import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginResponseDto } from './dto/auth-response.dto.js';
import { toUserResponse } from '../users/users.mapper.js';
import { UsersService } from '../users/users.service.js';
import { AuditAction } from '../audit/enums/audit-action.enum.js';
import { AuditEntityType } from '../audit/enums/audit-entity-type.enum.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
  ): Promise<LoginResponseDto> {
    const user = await this.usersService.findByLoginWithPassword(
      loginDto.login,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Login yoki parol noto‘g‘ri');
    }

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Login yoki parol noto‘g‘ri');
    }

    const payload: JwtPayload = {
      sub: user.id,
      login: user.login,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    this.auditService.record({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: AuditEntityType.AUTH,
      entityId: user.id,
      newValue: { login: user.login },
      ipAddress,
    });

    return {
      accessToken,
      user: toUserResponse(user),
    };
  }
}
