import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpensesService } from './expenses.service.js';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @Permissions(Permission.EXPENSES_MANAGE)
  findAll(@Query() query: PaginationQueryDto) {
    return this.expensesService.findAll(query);
  }

  @Post()
  @Permissions(Permission.EXPENSES_MANAGE)
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: UserDocument) {
    return this.expensesService.create(dto, user.id);
  }
}
