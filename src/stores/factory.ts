import { Store } from './store.interface';
import { MemoryStore } from './memory.store';
import { SmartRateLimiterConfig } from '../config';

export class StoreFactory {
  static create(config: SmartRateLimiterConfig): Store {
    if (config.store === 'redis' || config.redis) {
      try {
        const { RedisStore } = require('./redis.store');
        return new RedisStore(config.redis || { host: 'localhost', port: 6379 });
      } catch (error) {
        console.warn('Redis not available, falling back to memory store');
        return new MemoryStore();
      }
    }
    
    return new MemoryStore();
  }
}