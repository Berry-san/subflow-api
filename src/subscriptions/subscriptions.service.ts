import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentPlan } from '@prisma/client';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(userId: string, createSubscriptionDto: CreateSubscriptionDto, req?: any) {
    const { allowedPlans } = createSubscriptionDto;
    
    // Validation: ONE_OFF cannot be mixed with other plans
    if (allowedPlans.includes('ONE_OFF') && allowedPlans.length > 1) {
      throw new BadRequestException("'ONE_OFF' plan cannot be combined with other plans");
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        ...createSubscriptionDto,
        createdByUserId: userId,
      },
    });

    // Audit log
    await this.auditService.log({
      actorUserId: userId,
      action: 'CREATE',
      entityType: 'SUBSCRIPTION',
      entityId: subscription.id,
      changes: { name: subscription.name, allowedPlans: subscription.allowedPlans },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    return subscription;
  }

  async findAll(userId: string) { // Admin sees their own
    return this.prisma.subscription.findMany({
      where: { createdByUserId: userId },
    });
  }

  async findOne(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateSubscriptionDto: any) { // Replace any with DTO
    return this.prisma.subscription.update({
      where: { id },
      data: updateSubscriptionDto,
    });
  }

  async remove(id: string) {
    return this.prisma.subscription.delete({
      where: { id },
    });
  }

  getPaymentPlans() {
    return Object.values(PaymentPlan);
  }
}
