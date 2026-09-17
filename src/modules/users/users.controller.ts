import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import type { UserDocument } from './schemas/user.schema.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersService } from './users.service.js';
import { toUserResponse } from './users.mapper.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../audit/enums/audit-action.enum.js';
import { AuditEntityType } from '../audit/enums/audit-entity-type.enum.js';
import { extractClientIp } from '../audit/utils/client-ip.util.js';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @Permissions(Permission.USERS_READ)
  @ApiOkResponse({ type: [UserResponseDto] })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map(toUserResponse);
  }

  @Get(':id')
  @Permissions(Permission.USERS_READ)
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return toUserResponse(user);
  }

  @Post()
  @Permissions(Permission.USERS_CREATE)
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() actor: UserDocument,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    this.auditService.record({
      userId: actor.id,
      action: AuditAction.EMPLOYEE_CHANGE,
      entityType: AuditEntityType.USER,
      entityId: user.id,
      newValue: {
        login: user.login,
        fullName: user.fullName,
        role: user.role,
      },
      ipAddress: extractClientIp(req),
    });
    return toUserResponse(user);
  }

  @Patch(':id')
  @Permissions(Permission.USERS_UPDATE)
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() actor: UserDocument,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    if (actor.id === id && updateUserDto.isActive === false) {
      throw new BadRequestException('O‘zingizni faolsizlantira olmaysiz');
    }
    const before = await this.usersService.findById(id);
    const user = await this.usersService.update(id, updateUserDto);
    this.auditService.record({
      userId: actor.id,
      action: AuditAction.EMPLOYEE_CHANGE,
      entityType: AuditEntityType.USER,
      entityId: user.id,
      previousValue: {
        login: before.login,
        fullName: before.fullName,
        role: before.role,
        isActive: before.isActive,
      },
      newValue: {
        login: user.login,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        passwordChanged: Boolean(updateUserDto.password),
      },
      ipAddress: extractClientIp(req),
    });
    return toUserResponse(user);
  }

  @Post(':id/reset-password')
  @Permissions(Permission.USERS_UPDATE)
  @ApiOkResponse({ type: UserResponseDto })
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() actor: UserDocument,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.resetPassword(id, dto.password);
    this.auditService.record({
      userId: actor.id,
      action: AuditAction.EMPLOYEE_CHANGE,
      entityType: AuditEntityType.USER,
      entityId: user.id,
      newValue: { passwordReset: true },
      ipAddress: extractClientIp(req),
    });
    return toUserResponse(user);
  }

  @Delete(':id')
  @Permissions(Permission.USERS_DELETE)
  @ApiOkResponse({ description: 'Foydalanuvchi o‘chirildi' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: UserDocument,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const before = await this.usersService.findById(id);
    await this.usersService.remove(id, actor.id);
    this.auditService.record({
      userId: actor.id,
      action: AuditAction.EMPLOYEE_CHANGE,
      entityType: AuditEntityType.USER,
      entityId: id,
      previousValue: {
        login: before.login,
        fullName: before.fullName,
        role: before.role,
      },
      newValue: { deleted: true },
      ipAddress: extractClientIp(req),
    });
    return { message: 'Foydalanuvchi muvaffaqiyatli o‘chirildi' };
  }
}
