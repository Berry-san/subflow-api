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

import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    //  CacheModule.registerAsync({
    //   isGlobal: true,
    //   useFactory: async (config: ConfigService): Promise<CacheOptions> => {
    //     const redisUrl = config.get<string>('REDIS_URL');

    //     // Use Redis in production, memory in dev
    //     if (redisUrl && process.env.NODE_ENV === 'production') {
    //       // Parse REDIS_URL manually (because 'url' isn't in types)
    //       const url = new URL(redisUrl);
    //       const store = await redisStore({
    //         host: url.hostname,
    //         port: parseInt(url.port, 10) || 6379,
    //         password: url.password || undefined,
    //         username: url.username || undefined,
    //         tls: url.protocol === 'rediss:' ? {} : undefined,
    //       });

    //       return {
    //         store,
    //         ttl: 600, // TTL in **SECONDS** for Redis
    //       };
    //     }

    //     // Fallback to in-memory
    //     return {
    //       ttl: 600_000, // TTL in **MILLISECONDS** for memory
    //     };
    //   },
    //   inject: [ConfigService],
    // }),
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
