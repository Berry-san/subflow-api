import { ForbiddenException, Injectable } from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(userId: string, createGroupDto: CreateGroupDto, req?: any) {
    const group = await this.prisma.group.create({
      data: {
        ...createGroupDto,
        adminUserId: userId,
      },
    });

    // Audit log
    await this.auditService.log({
      actorUserId: userId,
      action: 'CREATE',
      entityType: 'GROUP',
      entityId: group.id,
      changes: { groupName: group.groupName, groupLimit: group.groupLimit },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    return group;
  }

  async createWithSubscription(userId: string, dto: import('./dto/create-group-with-subscription.dto').CreateGroupWithSubscriptionDto) {
    const { subscriptionDetails, groupDetails } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Subscription
      const subscription = await tx.subscription.create({
        data: {
          ...subscriptionDetails,
          createdByUserId: userId,
        },
      });

      // 2. Create Group linked to Subscription
      const group = await tx.group.create({
        data: {
          ...groupDetails,
          subscriptionId: subscription.id,
          adminUserId: userId,
        },
      });

      return {
        group,
        subscription,
      };
    });
  }

  async findAll(userId: string) {
    // Return groups where user is admin or member
    return this.prisma.group.findMany({
      where: {
        OR: [
          { adminUserId: userId },
          { members: { some: { userId } } },
        ],
      },
    });
  }

  async findOne(userId: string, id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { members: true, payments: true },
    });

    if (!group) return null;

    // Check access
    if (group.adminUserId !== userId && !group.members.some(m => m.userId === userId)) {
      throw new ForbiddenException('You do not have permission to access this group');
    }

    return group;
  }

  async findPending(userId: string) {
    return this.prisma.groupMembership.findMany({
      where: { userId, status: 'PENDING' },
      include: { group: true },
    });
  }

  async getMembers(
    userId: string,
    groupId: string,
    status?: MembershipStatus,
  ) {
    // 1. Verify the user has access to the group
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        // Only fetch what's needed for access check
        adminUser: { select: { id: true } },
        members: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    if (!group) {
      throw new ForbiddenException('Group not found');
    }

    // 🔒 Allow only group admin (or extend to members if needed)
    const isGroupAdmin = group.adminUserId === userId;
    const isMember = group.members.length > 0;

    // 👇 Adjust policy as needed:
    // - Only admin can view members? → keep this
    // - Members can also view? → change to `if (!isGroupAdmin && !isMember)`
    if (!isGroupAdmin) {
      throw new ForbiddenException('Only the group admin can view members');
    }

    // 2. Fetch members with optional status filter
    const where: any = {
      groupId,
      ...(status ? { status } : {}),
    };

    const memberships = await this.prisma.groupMembership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true, // ⚠️ Only if needed; consider omitting in production
            isEmailVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // 3. Return clean, mapped data (optional but recommended)
    return memberships.map(m => ({
      id: m.id,
      userId: m.userId,
      roleInGroup: m.roleInGroup,
      status: m.status,
      joinedAt: m.joinedAt,
      approvedAt: m.approvedAt,
      declinedAt: m.declinedAt,
      user: m.user,
    }));
  }

  async join(userId: string, groupId: string) {
    // Check if user is already a member
    const existingMembership = await this.prisma.groupMembership.findUnique({ where: { groupId_userId: { groupId, userId } } });
 
    if (existingMembership) {
  if (existingMembership.status === 'PENDING') {
    throw new ForbiddenException('You are already pending to join this group');
  }
  throw new ForbiddenException('You are already a member of this group');
}

    // Check if group exists
    const group = await this.prisma.group.findUnique({ where: { id: groupId }, include: { members: true } });
    if (!group) throw new ForbiddenException('Group not found');

    // Check if group is full
    if (group.members.length >= group.groupLimit) throw new ForbiddenException('Group is full');

    // validate user id
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    return this.prisma.groupMembership.create({
      data: {
        userId,
        groupId,
        status: 'PENDING',
      },
    });
  }

  async approve(adminId: string, groupId: string, memberId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.adminUserId !== adminId) throw new ForbiddenException('Only the group admin can approve members');

    return this.prisma.groupMembership.update({
      where: { groupId_userId: { groupId, userId: memberId } },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });
  }

  async decline(adminId: string, groupId: string, memberId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.adminUserId !== adminId) throw new ForbiddenException('Only the group admin can decline members');

    return this.prisma.groupMembership.update({
      where: { groupId_userId: { groupId, userId: memberId } },
      data: { status: 'DECLINED', declinedAt: new Date() },
    });
  }

  async updateCombined(userId: string, groupId: string, dto: import('./dto/update-group-with-subscription.dto').UpdateGroupWithSubscriptionDto) {
    const { subscriptionDetails, groupDetails } = dto;

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.adminUserId !== userId) throw new ForbiddenException('Only the group admin can update this group');

    return this.prisma.$transaction(async (tx) => {
      let updatedSubscription = null;
      let updatedGroup = null;

      // 1. Update Subscription
      if (subscriptionDetails && group.subscriptionId) {
        updatedSubscription = await tx.subscription.update({
          where: { id: group.subscriptionId },
          data: subscriptionDetails,
        });
      }

      // 2. Update Group
      if (groupDetails) {
        updatedGroup = await tx.group.update({
          where: { id: groupId },
          data: groupDetails,
        });
      }

      return {
        group: updatedGroup || group,
        subscription: updatedSubscription,
      };
    });
  }
}
