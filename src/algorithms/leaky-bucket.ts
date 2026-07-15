import { BaseAlgorithm } from './base';
import { TierConfig, AlgorithmResult } from '../config';

export class LeakyBucket extends BaseAlgorithm {
  async allow(key: string, config: TierConfig): Promise<AlgorithmResult> {
    const now = Date.now();
    const bucketKey = this.getWindowKey(key, config.window);
    const leakRate = config.window / config.limit; // ms per request
    
    let data = await this.store.get(bucketKey);
    let queue: number[] = data?.requests || [];
    let lastLeak = data?.lastLeak || now;
    
    // Leak requests that should have been processed
    const elapsed = now - lastLeak;
    const leakedCount = Math.floor(elapsed / leakRate);
    queue = queue.slice(leakedCount);
    lastLeak = lastLeak + leakedCount * leakRate;
    
    const maxQueue = config.burst || config.limit;
    
    if (queue.length < maxQueue) {
      queue.push(now);
      await this.store.set(bucketKey, { requests: queue, lastLeak }, config.window);
      
      // Calculate position in queue
      const positionInQueue = queue.length - 1;
      const processingDelay = positionInQueue * leakRate;
      
      return {
        allowed: true,
        remaining: maxQueue - queue.length,
        retryAfter: 0,
        reset: now + config.window
      };
    }
    
    // Calculate when next slot will be available
    const retryAfter = (queue.length - maxQueue + 1) * leakRate;
    
    await this.store.set(bucketKey, { requests: queue, lastLeak }, config.window);
    
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      reset: now + config.window
    };
  }
}