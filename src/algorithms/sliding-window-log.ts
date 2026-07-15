import { BaseAlgorithm } from './base';
import { TierConfig, AlgorithmResult } from '../config';

export class SlidingWindowLog extends BaseAlgorithm {
  async allow(key: string, config: TierConfig): Promise<AlgorithmResult> {
    const now = Date.now();
    const windowKey = this.getWindowKey(key, config.window);
    const windowStart = now - config.window;
    
    // Get existing requests
    let data = await this.store.get(windowKey);
    let requests: number[] = data?.requests || [];
    
    // Remove expired requests
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    if (requests.length < config.limit) {
      requests.push(now);
      await this.store.set(windowKey, { requests }, config.window);
      return {
        allowed: true,
        remaining: config.limit - requests.length,
        retryAfter: 0,
        reset: now + config.window
      };
    }
    
    // Calculate retry after based on oldest request
    const oldestRequest = requests[0];
    const retryAfter = oldestRequest - windowStart;
    
    await this.store.set(windowKey, { requests }, config.window);
    
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      reset: now + config.window
    };
  }
}