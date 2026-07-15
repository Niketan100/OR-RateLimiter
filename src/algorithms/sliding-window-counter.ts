import { BaseAlgorithm } from './base';
import { TierConfig, AlgorithmResult } from '../config';

export class SlidingWindowCounter extends BaseAlgorithm {
  async allow(key: string, config: TierConfig): Promise<AlgorithmResult> {
    const now = Date.now();
    const currentWindow = Math.floor(now / config.window);
    const previousWindow = currentWindow - 1;
    
    const currentKey = `${key}:${currentWindow}`;
    const previousKey = `${key}:${previousWindow}`;
    
    // Get counts for both windows
    const currentCount = (await this.store.get(currentKey))?.count || 0;
    const previousCount = (await this.store.get(previousKey))?.count || 0;
    
    // Calculate weighted count
    const windowElapsed = now - (currentWindow * config.window);
    const weightPrevious = 1 - (windowElapsed / config.window);
    const estimatedCount = previousCount * weightPrevious + currentCount;
    
    if (estimatedCount < config.limit) {
      // Increment current window
      const newCount = await this.store.increment(currentKey, config.window * 2);
      return {
        allowed: true,
        remaining: Math.floor(config.limit - estimatedCount - 1),
        retryAfter: 0,
        reset: (currentWindow + 1) * config.window
      };
    }
    
    // Calculate retry after
    const retryAfter = config.window - windowElapsed;
    
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(0, retryAfter),
      reset: (currentWindow + 1) * config.window
    };
  }
}