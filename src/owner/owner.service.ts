// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { Inject, Injectable } from '@nestjs/common';
// import { Cache } from 'cache-manager';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class OwnerService {
//   constructor(
//     private prisma: PrismaService,
//     @Inject(CACHE_MANAGER) private cacheManager: Cache,
//   ) {}

//   async getDashboardStats() {
//     const cacheKey = 'dashboard_stats';
//     const cachedData = await this.cacheManager.get(cacheKey);
//     if (cachedData) {
//       return cachedData;
//     }

//     const [totalUsers, totalGroups, totalSubscriptions, totalVolume] = await Promise.all([
//       this.prisma.user.count(),
//       this.prisma.group.count(),
//       this.prisma.subscription.count(),
//       this.prisma.transaction.aggregate({
//         _sum: { amount: true },
//         where: { status: 'SUCCESS' },
//       }),
//     ]);

//     const result = {
//       totalUsers,
//       totalGroups,
//       totalSubscriptions,
//       totalVolume: totalVolume._sum.amount || 0,
//     };

//     await this.cacheManager.set(cacheKey, result); // Uses default TTL from module config
//     return result;
//   }
// }

// owner.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class OwnerService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService, // ← Inject RedisService
  ) {}

  async getDashboardStats() {
    const cacheKey = 'dashboard_stats';
    const cachedData = await this.redisService.get(cacheKey); // ← Use RedisService

    if (cachedData) {
      return JSON.parse(cachedData); // ← Upstash returns strings
    }

    const [totalUsers, totalGroups, totalSubscriptions, totalVolume] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.group.count(),
      this.prisma.subscription.count(),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' },
      }),
    ]);

    const result = {
      totalUsers,
      totalGroups,
      totalSubscriptions,
      totalVolume: totalVolume._sum.amount || 0,
    };

    // Store as JSON string
    await this.redisService.set(cacheKey, JSON.stringify(result), 600); // TTL in seconds

    return result;
  }
}