import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PermissionsAny } from '../../common/decorators/permissions-any.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { CreateRepairDto } from './dto/create-repair.dto.js';
import { RepairResponseDto } from './dto/repair-response.dto.js';
import { RepairsQueryDto } from './dto/repairs-query.dto.js';
import { UpdateRepairDto } from './dto/update-repair.dto.js';
import { UpdateRepairStatusDto } from './dto/update-repair-status.dto.js';
import { UpdateDiagnosticsDto } from './dto/update-diagnostics.dto.js';
import { UpdateReceptionDto } from './dto/update-reception.dto.js';
import { ReceptionChecklistDto } from './dto/reception-checklist.dto.js';
import { PhysicalConditionDto } from './dto/physical-condition.dto.js';
import { AccessoriesChecklistDto } from './dto/accessories-checklist.dto.js';
import { RepairPhotoType } from '../../common/enums/repair-photo-type.enum.js';
import {
  REPAIR_PHOTO_MAX_SIZE,
  repairPhotoFileFilter,
  repairPhotoStorage,
} from './config/upload.config.js';
import { AddRepairPartDto } from './dto/add-repair-part.dto.js';
import { AddRepairServiceDto } from './dto/add-repair-service.dto.js';
import { RepairBillingService } from './repair-billing.service.js';
import { RepairsService } from './repairs.service.js';

@ApiTags('repairs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('repairs')
export class RepairsController {
  constructor(
    private readonly repairsService: RepairsService,
    private readonly repairBillingService: RepairBillingService,
  ) {}

  @Get('technicians/options')
  @Permissions(Permission.REPAIRS_READ)
  @ApiOkResponse({ description: 'Ustalar ro‘yxati (filter uchun)' })
  listTechnicians() {
    return this.repairsService.listTechnicians();
  }

  @Get()
  @Permissions(Permission.REPAIRS_READ)
  findAll(
    @Query() query: RepairsQueryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairsService.findAll(query, user);
  }

  @Get(':id/reception')
  @Permissions(Permission.REPAIRS_READ)
  getReception(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.repairsService.getReception(id, user);
  }

  @Patch(':id/reception')
  @Permissions(Permission.REPAIRS_MANAGE)
  updateReception(
    @Param('id') id: string,
    @Body() dto: UpdateReceptionDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairsService.updateReception(id, dto, user.id);
  }

  @Patch(':id/checklist')
  @Permissions(Permission.REPAIRS_MANAGE)
  updateChecklist(
    @Param('id') id: string,
    @Body() dto: ReceptionChecklistDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairsService.updateChecklist(id, dto, user.id);
  }

  @Patch(':id/physical-condition')
  @Permissions(Permission.REPAIRS_MANAGE)
  updatePhysicalCondition(
    @Param('id') id: string,
    @Body() dto: PhysicalConditionDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairsService.updatePhysicalCondition(id, dto, user.id);
  }

  @Patch(':id/accessories')
  @Permissions(Permission.REPAIRS_MANAGE)
  updateAccessories(
    @Param('id') id: string,
    @Body() dto: AccessoriesChecklistDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairsService.updateAccessories(id, dto, user.id);
  }

  @Get(':id/diagnostics')
  @Permissions(Permission.REPAIRS_READ)
  getDiagnostics(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.repairsService.getDiagnostics(id, user);
  }

  @Patch(':id/diagnostics')
  @PermissionsAny(
    Permission.REPAIRS_MANAGE,
    Permission.REPAIRS_ASSIGNED_MANAGE,
  )
  updateDiagnostics(
    @Param('id') id: string,
    @Body() dto: UpdateDiagnosticsDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairsService.updateDiagnostics(id, dto, user);
  }

  @Post(':id/photos')
  @Permissions(Permission.REPAIRS_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: repairPhotoStorage(),
      fileFilter: repairPhotoFileFilter,
      limits: { fileSize: REPAIR_PHOTO_MAX_SIZE },
    }),
  )
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: RepairPhotoType,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairsService.uploadPhoto(id, file, type, user.id);
  }

  @Delete(':id/photos/:photoId')
  @Permissions(Permission.REPAIRS_MANAGE)
  deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairsService.deletePhoto(id, photoId, user.id);
  }

  @Post(':id/services')
  @PermissionsAny(
    Permission.REPAIRS_MANAGE,
    Permission.REPAIRS_ASSIGNED_MANAGE,
  )
  addService(
    @Param('id') id: string,
    @Body() dto: AddRepairServiceDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairBillingService.addService(id, dto, user);
  }

  @Delete(':id/services/:lineId')
  @PermissionsAny(
    Permission.REPAIRS_MANAGE,
    Permission.REPAIRS_ASSIGNED_MANAGE,
  )
  removeService(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairBillingService.removeService(id, lineId, user);
  }

  @Post(':id/parts')
  @PermissionsAny(
    Permission.REPAIRS_MANAGE,
    Permission.REPAIRS_ASSIGNED_MANAGE,
  )
  addPart(
    @Param('id') id: string,
    @Body() dto: AddRepairPartDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairBillingService.addPart(id, dto, user);
  }

  @Delete(':id/parts/:lineId')
  @PermissionsAny(
    Permission.REPAIRS_MANAGE,
    Permission.REPAIRS_ASSIGNED_MANAGE,
  )
  removePart(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.repairBillingService.removePart(id, lineId, user);
  }

  @Get(':id')
  @Permissions(Permission.REPAIRS_READ)
  @ApiOkResponse({ type: RepairResponseDto })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<RepairResponseDto> {
    return this.repairsService.findById(id, user);
  }

  @Post()
  @Permissions(Permission.REPAIRS_MANAGE)
  @ApiCreatedResponse({ type: RepairResponseDto })
  create(
    @Body() dto: CreateRepairDto,
    @CurrentUser() user: UserDocument,
  ): Promise<RepairResponseDto> {
    return this.repairsService.create(dto, user.id);
  }

  @Patch(':id/status')
  @Permissions(Permission.REPAIRS_MANAGE)
  @ApiOkResponse({ type: RepairResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRepairStatusDto,
    @CurrentUser() user: UserDocument,
  ): Promise<RepairResponseDto> {
    return this.repairsService.updateStatus(id, dto, user);
  }

  @Patch(':id')
  @Permissions(Permission.REPAIRS_MANAGE)
  @ApiOkResponse({ type: RepairResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRepairDto,
    @CurrentUser() user: UserDocument,
  ): Promise<RepairResponseDto> {
    return this.repairsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions(Permission.REPAIRS_MANAGE)
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.repairsService.remove(id).then(() => ({
      message: 'Ta’mirlash buyurtmasi o‘chirildi',
    }));
  }
}
