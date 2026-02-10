import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisConfig = this.configService.get('app.redis');
    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  // Rate limiting for role modification (20 requests per hour per tenant)
  async checkRoleModificationRateLimit(tenantId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `role_modification:${tenantId}`;
    const limit = 20;
    const windowInSeconds = 3600; // 1 hour

    const count = await this.client.incr(key);
    
    if (count === 1) {
      await this.client.expire(key, windowInSeconds);
    }

    if (count > limit) {
      const ttl = await this.client.ttl(key);
      return { allowed: false, retryAfter: ttl > 0 ? ttl : windowInSeconds };
    }

    return { allowed: true };
  }

  // Invalidate permission cache for a user
  async invalidateUserPermissionCache(userId: string): Promise<void> {
    const pattern = `permission:${userId}:*`;
    const keys = await this.client.keys(pattern);
    
    if (keys.length > 0) {
      await this.client.del(...keys);
      this.logger.log(`Invalidated ${keys.length} permission cache entries for user ${userId}`);
    }
  }

  // Generic get method
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  // Generic set method
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  // Generic delete method
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
