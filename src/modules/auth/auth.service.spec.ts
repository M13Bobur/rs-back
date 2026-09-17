import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { AuditService } from '../audit/audit.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByLoginWithPassword: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn().mockResolvedValue('token'),
          },
        },
        {
          provide: AuditService,
          useValue: { record: vi.fn() },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
  });

  it('throws for invalid credentials', async () => {
    vi.mocked(usersService.findByLoginWithPassword).mockResolvedValue(null);

    await expect(
      authService.login({ login: 'admin', password: 'password1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns token for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('password1', 4);
    vi.mocked(usersService.findByLoginWithPassword).mockResolvedValue({
      id: '1',
      login: 'admin',
      fullName: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await authService.login({
      login: 'admin',
      password: 'password1',
    });

    expect(result.accessToken).toBe('token');
    expect(result.user.login).toBe('admin');
  });
});
