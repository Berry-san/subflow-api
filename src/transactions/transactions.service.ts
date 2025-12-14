import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        group: {
          select: { groupName: true },
        },
        groupPayment: {
          select: { plan: true, amount: true, currency: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllSystem() {
    return this.prisma.transaction.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        group: {
          select: { groupName: true },
        },
        groupPayment: {
          select: { plan: true, amount: true, currency: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
