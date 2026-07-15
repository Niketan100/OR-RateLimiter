import { BaseAlgorithm } from './base';
import { TierConfig, AlgorithmResult } from '../config';

export class TokenBucket extends BaseAlgorithm {
  async allow(key: string, config: TierConfig): Promise<AlgorithmResult> {
    const now = Date.now();
    const windowKey = this.getWindowKey(key, config.window);
    const maxTokens = config.burst || config.limit;
    
    // Get current bucket state
    const bucketData = await this.store.get(windowKey);
    let tokens = bucketData?.tokens ?? maxTokens;
    let lastRefill = bucketData?.lastRefill ?? now;
    
    // Calculate token refill
    const elapsed = now - lastRefill;
    const refillRate = config.limit / config.window; // tokens per millisecond
    const tokensToAdd = elapsed * refillRate;
    tokens = Math.min(tokens + tokensToAdd, maxTokens);
    
    // Check if request can be allowed
    if (tokens >= 1) {
      tokens -= 1;
      await this.store.set(windowKey, { tokens, lastRefill: now }, config.window);
      return {
        allowed: true,
        remaining: Math.floor(tokens),
        retryAfter: 0,
        reset: now + config.window
      };
    }
    
    // Calculate retry after time
    const tokensNeeded = 1 - tokens;
    const retryAfter = Math.ceil(tokensNeeded / refillRate);
    
    await this.store.set(windowKey, { tokens, lastRefill: now }, config.window);
    
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      reset: now + config.window
    };
  }
}