/**
 * Rate Limiter OSS - Smart, plug-and-play rate limiting library
 * 
 * @example
 * ```typescript
 * import { SmartRateLimiter, BuiltInResolvers } from 'rate-limiter-oss';
 * 
 * const limiter = new SmartRateLimiter({
 *   userResolver: BuiltInResolvers.jwt({ secret: 'your-secret' }),
 *   tiers: {
 *     premium: { limit: 1000, window: 3600000 },
 *     basic: { limit: 100, window: 3600000 },
 *     anonymous: { limit: 10, window: 60000 }
 *   }
 * });
 * 
 * app.use(limiter.middleware());
 * ```
 */

// Main exports
export { SmartRateLimiter } from './smart-rate-limiter';

// Configuration types
export type {
  SmartRateLimiterConfig,
  UserContext,
  TierConfig,
  RouteRule,
  RateLimitResult,
  AlgorithmResult
} from './config';

// Resolvers
export { BuiltInResolvers } from './resolvers/index';
export type { UserResolver } from './resolvers/index';

// Errors
export { RateLimitError, ConfigurationError, StoreError } from './errors/rate-limit-errors';

// Middleware (optional)
export { createExpressMiddleware } from './middleware/express';

// Stores (for advanced use)
export { MemoryStore } from './stores/memory.store';
export { RedisStore } from './stores/redis.store';
export type { Store, StoreData } from './stores/store.interface';

// Algorithms (for extending)
export { BaseAlgorithm } from './algorithms/base';
export { TokenBucket } from './algorithms/token-bucket';
export { LeakyBucket } from './algorithms/leaky-bucket';
export { FixedWindow } from './algorithms/fixed-window';
export { SlidingWindowLog } from './algorithms/sliding-window-log';
export { SlidingWindowCounter } from './algorithms/sliding-window-counter';