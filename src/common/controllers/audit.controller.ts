import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuditService } from '../services/audit.service';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('my-activity')
  @ApiOperation({ summary: 'Get my audit logs' })
  async getMyActivity(@Request() req, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.auditService.findByUser(req.user.userId, parsedLimit);
  }

  @Get('all')
  @Roles(Role.SYSTEM_OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Get all audit logs (Admin only)' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllLogs(
    @Query('entityType') entityType?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    
    if (entityType) {
      return this.auditService.findByEntity(entityType, parsedLimit);
    }
    
    return this.auditService.findAll(parsedLimit);
  }
}
