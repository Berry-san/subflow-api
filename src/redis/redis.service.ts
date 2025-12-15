// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import Redis from 'ioredis';

// @Injectable()
// export class RedisService implements OnModuleInit {
//   private client: Redis;

//   constructor(private configService: ConfigService) {}

//   // onModuleInit() {
//   //   this.client = new Redis({
//   //     host: this.configService.get('REDIS_HOST') || 'localhost',
//   //     port: this.configService.get('REDIS_PORT') || 6379,
//   //   });
//   // }
//   onModuleInit() {
//     const redisUrl = this.configService.get<string>('REDIS_URL');

//     if (!redisUrl) {
//       throw new Error('REDIS_URL is missing!');
//     }

//     this.client = new Redis(redisUrl, {
//       tls: {}, // Enable TLS for Upstash
//       retryStrategy: (times) => {
//         if (times > 3) return undefined; // Stop retrying after 3 attempts
//         return Math.min(times * 50, 2000); // Retry delay
//       },
//     });

//     this.client.on('error', (err) => {
//       console.error('❌ Redis error:', err.message);
//     });
//   }

//   onModuleDestroy() {
//     this.client.quit().catch(console.error);
//   }

//   async get(key: string): Promise<string | null> {
//     return this.client.get(key);
//   }

//   async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
//     if (ttlSeconds) {
//       await this.client.setex(key, ttlSeconds, value);
//     } else {
//       await this.client.set(key, value);
//     }
//   }

//   async del(key: string): Promise<void> {
//     await this.client.del(key);
//   }

//   async exists(key: string): Promise<boolean> {
//     const result = await this.client.exists(key);
//     return result === 1;
//   }

//   async setWithTtl(key: string, value: any, ttlSeconds: number): Promise<void> {
//   if (!this.client) return;
//   await this.client.setex(key, ttlSeconds, typeof value === 'string' ? value : JSON.stringify(value));
// }
// }

// src/redis/redis.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis'; // ← REST client

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Use REST-specific env vars
    const restUrl = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
    const restToken = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');

    if (restUrl && restToken) {
      this.client = new Redis({
        url: restUrl,      // e.g., https://us1-xxxx.upstash.io
        token: restToken,  // your token
      });
      console.log('✅ Redis cache client initialized (Upstash REST)');
    } else {
      console.warn('⚠️ REDIS_REST_URL or REDIS_REST_TOKEN missing — cache disabled');
    }
  }

  onModuleDestroy() {
    // @upstash/redis doesn't need explicit close
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.exists(key);
    return result === 1;
  }
}