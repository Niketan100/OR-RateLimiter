import { Store, StoreData } from './store.interface';

export class RedisStore implements Store {
  private redis: any;
  private keyPrefix: string;

  constructor(options: { host?: string; port?: number; password?: string; db?: number; keyPrefix?: string }) {
    // Dynamic import to avoid requiring Redis as mandatory dependency
    const Redis = require('ioredis');
    this.redis = new Redis({
      host: options.host || 'localhost',
      port: options.port || 6379,
      password: options.password,
      db: options.db || 0,
      keyPrefix: options.keyPrefix || 'ratelimit:',
      retryStrategy: (times: number) => Math.min(times * 50, 2000)
    });
    this.keyPrefix = options.keyPrefix || 'ratelimit:';
  }

  async get(key: string): Promise<StoreData | null> {
    const data = await this.redis.get(this.prefixKey(key));
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, data: StoreData, ttl: number): Promise<void> {
    await this.redis.set(this.prefixKey(key), JSON.stringify(data), 'PX', ttl);
  }

  async increment(key: string, window: number): Promise<number> {
    const prefixedKey = this.prefixKey(key);
    const multi = this.redis.multi();
    multi.incr(prefixedKey);
    multi.pttl(prefixedKey);
    
    const results = await multi.exec();
    const count = results?.[0]?.[1] as number || 1;
    
    // Set expiry only if it's a new key or TTL is -1
    if (count === 1 || (results?.[1]?.[1] as number) === -1) {
      await this.redis.pexpire(prefixedKey, window);
    }
    
    return count;
  }

  async decrement(key: string): Promise<void> {
    await this.redis.decr(this.prefixKey(key));
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.prefixKey(key));
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(this.prefixKey(key));
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.pttl(this.prefixKey(key));
  }

  private prefixKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  destroy(): void {
    this.redis.disconnect();
  }
}