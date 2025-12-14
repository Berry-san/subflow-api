import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupPaymentDto } from './dto/create-group-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createGroupPayment(userId: string, groupId: string, createDto: CreateGroupPaymentDto) {
    // Verify admin access
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.adminUserId !== userId) {
      throw new ForbiddenException('You do not have permission to create payments for this group');
    }

    return this.prisma.groupPayment.create({
      data: {
        groupId,
        ...createDto,
        dueDate: new Date(createDto.dueDate),
      },
    });
  }

  async findAllGroupPayments(groupId: string) {
    return this.prisma.groupPayment.findMany({
      where: { groupId },
      include: { transactions: true },
    });
  }

  async createPayoutSetting(userId: string, groupId: string, data: any) { // Replace any with DTO
    // Verify admin
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.adminUserId !== userId) throw new ForbiddenException('You do not have permission to manage payout settings for this group');

    return this.prisma.payoutSetting.create({
      data: {
        groupId,
        ...data,
      },
    });
  }

  async getPayoutSetting(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.adminUserId !== userId) throw new ForbiddenException('You do not have permission to view payout settings for this group');

    return this.prisma.payoutSetting.findFirst({
      where: { groupId },
    });
  }

  async initializePayment(userId: string, groupPaymentId: string) {
    // Mock payment link generation
    const payment = await this.prisma.groupPayment.findUnique({ where: { id: groupPaymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    const amount = Number(payment.amount);
    const fees = this.calculateFees(amount);
    const totalAmount = amount + fees.platformFee + fees.gatewayFee;

    const link = `https://pay.sublow.com/${payment.id}?amount=${totalAmount}`; // Mock link
    
    return { 
      link,
      breakdown: {
        baseAmount: amount,
        fees,
        totalAmount
      }
    };
  }

  calculateFees(amount: number) {
    // Platform Fee: 1%
    const platformFee = amount * 0.01;
    
    // Gateway Fee (e.g. Paystack): 1.5% + 100 NGN
    const gatewayFee = (amount * 0.015) + 100;

    return {
      platformFee: Math.round(platformFee * 100) / 100,
      gatewayFee: Math.round(gatewayFee * 100) / 100,
    };
  }

  async handleWebhook(signature: string, payload: any) {
    // Verify signature (mock)
    if (signature !== 'secret') throw new UnauthorizedException('Invalid webhook signature');

    // Handle event (mock)
    console.log('Webhook received:', payload);
    return { status: 'success' };
  }
}
