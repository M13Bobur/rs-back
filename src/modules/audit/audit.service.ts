import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import type { AuditAction } from './enums/audit-action.enum.js';
import type { AuditEntityType } from './enums/audit-entity-type.enum.js';
import { AuditLogsQueryDto } from './dto/audit-logs-query.dto.js';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema.js';

export type AuditRecordInput = {
  userId?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  record(input: AuditRecordInput): void {
    void this.persist(input).catch((error) => {
      this.logger.error(
        `Audit write failed: ${error instanceof Error ? error.message : error}`,
      );
    });
  }

  private async persist(input: AuditRecordInput): Promise<void> {
    await this.auditModel.create({
      userId: input.userId ? new Types.ObjectId(input.userId) : undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      previousValue: sanitizeAuditValue(input.previousValue),
      newValue: sanitizeAuditValue(input.newValue),
      ipAddress: input.ipAddress,
    });
  }

  async list(query: AuditLogsQueryDto) {
    const { page, limit, action, entityType, entityId, userId } = query;
    const filter: Record<string, unknown> = {};
    if (action) {
      filter.action = action;
    }
    if (entityType) {
      filter.entityType = entityType;
    }
    if (entityId) {
      filter.entityId = entityId;
    }
    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items.map((row) => ({
        id: row.id,
        userId: row.userId ? String(row.userId) : undefined,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        previousValue: row.previousValue,
        newValue: row.newValue,
        ipAddress: row.ipAddress,
        createdAt: row.createdAt,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}

function sanitizeAuditValue(
  value: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!value) {
    return undefined;
  }
  const copy = { ...value };
  for (const key of Object.keys(copy)) {
    if (/password/i.test(key)) {
      copy[key] = '[redacted]';
    }
  }
  return copy;
}
