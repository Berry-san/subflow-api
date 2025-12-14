// Example: How to add audit logging to any service

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class ExampleService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService, // Inject AuditService
  ) {}

  async create(userId: string, data: any, req?: any) {
    // Perform the operation
    const result = await this.prisma.example.create({ data });

    // Log the audit
    await this.auditService.log({
      actorUserId: userId,
      action: 'CREATE',
      entityType: 'EXAMPLE',
      entityId: result.id,
      changes: data,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    return result;
  }

  async update(userId: string, id: string, data: any, req?: any) {
    // Get old data for audit trail
    const oldData = await this.prisma.example.findUnique({ where: { id } });

    // Perform the operation
    const result = await this.prisma.example.update({
      where: { id },
      data,
    });

    // Log the audit with before/after
    await this.auditService.log({
      actorUserId: userId,
      action: 'UPDATE',
      entityType: 'EXAMPLE',
      entityId: id,
      changes: {
        before: oldData,
        after: result,
      },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    return result;
  }

  async delete(userId: string, id: string, req?: any) {
    // Get data before deletion
    const data = await this.prisma.example.findUnique({ where: { id } });

    // Perform the operation
    await this.prisma.example.delete({ where: { id } });

    // Log the audit
    await this.auditService.log({
      actorUserId: userId,
      action: 'DELETE',
      entityType: 'EXAMPLE',
      entityId: id,
      changes: { deleted: data },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }
}
