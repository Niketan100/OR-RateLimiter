import { BaseAlgorithm } from './base';
import { TierConfig, AlgorithmResult } from '../config';

export class FixedWindow extends BaseAlgorithm {
  async allow(key: string, config: TierConfig): Promise<AlgorithmResult> {
    const now = Date.now();
    const windowKey = this.getWindowKey(key, config.window);
    
    const count = await this.store.increment(windowKey, config.window);
    
    if (count <= config.limit) {
      return {
        allowed: true,
        remaining: config.limit - count,
        retryAfter: 0,
        reset: now + config.window
      };
    }
    
    const ttl = await this.store.ttl(windowKey);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: ttl > 0 ? ttl : config.window,
      reset: now + config.window
    };
  }
}