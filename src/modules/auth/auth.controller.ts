import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { extractClientIp } from '../audit/utils/client-ip.util.js';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { toUserResponse } from '../users/users.mapper.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { AuthService } from './auth.service.js';
import { LoginResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Tizimga kirish' })
  @ApiOkResponse({ type: LoginResponseDto })
  login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    return this.authService.login(loginDto, extractClientIp(req));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy foydalanuvchi' })
  @ApiOkResponse({ type: UserResponseDto })
  me(@CurrentUser() user: UserDocument): UserResponseDto {
    return toUserResponse(user);
  }
}
