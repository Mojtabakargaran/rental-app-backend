import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Redis client service for session and rate limiting storage
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('redis.host');
    const port = this.configService.get<number>('redis.port');
    const password = this.configService.get<string>('redis.password');

    this.client = new Redis({
      host,
      port,
      password,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err: Error) => {
      console.error('Redis connection error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // Store session with TTL
  async setSession(tokenHash: string, sessionData: string, ttlSeconds: number): Promise<void> {
    await this.client.setex(`session:${tokenHash}`, ttlSeconds, sessionData);
  }

  // Get session by token hash
  async getSession(tokenHash: string): Promise<string | null> {
    return await this.client.get(`session:${tokenHash}`);
  }

  // Delete session
  async deleteSession(tokenHash: string): Promise<void> {
    await this.client.del(`session:${tokenHash}`);
  }

  // Increment failed login attempts
  async incrementFailedAttempts(email: string, ttlSeconds: number): Promise<number> {
    const key = `failed_login:${email.toLowerCase()}`;
    const result = await this.client.incr(key);
    if (result === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return result;
  }

  // Get failed login attempts count
  async getFailedAttempts(email: string): Promise<number> {
    const key = `failed_login:${email.toLowerCase()}`;
    const value = await this.client.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  // Reset failed login attempts
  async resetFailedAttempts(email: string): Promise<void> {
    const key = `failed_login:${email.toLowerCase()}`;
    await this.client.del(key);
  }

  // Get TTL for rate limiting
  async getRateLimitTtl(email: string): Promise<number> {
    const key = `failed_login:${email.toLowerCase()}`;
    return await this.client.ttl(key);
  }

  // Generic get
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  // Generic set with TTL
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.setex(key, ttlSeconds, value);
  }
}
