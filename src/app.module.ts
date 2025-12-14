import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { OwnerModule } from './owner/owner.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RemindersModule } from './reminders/reminders.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 600000, // 10 minutes (in milliseconds)
    }),
    PrismaModule,
    RedisModule,
    CommonModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    GroupsModule,
    PaymentsModule,
    RemindersModule,
    OwnerModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
