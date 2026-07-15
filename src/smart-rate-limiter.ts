import { 
  SmartRateLimiterConfig, 
  UserContext, 
  RateLimitResult, 
  TierConfig, 
  RouteRule 
} from './config';
import { Store } from './stores/store.interface';
import { StoreFactory } from './stores/factory';
import { BaseAlgorithm } from './algorithms/base';
import { TokenBucket } from './algorithms/token-bucket';
import { LeakyBucket } from './algorithms/leaky-bucket';
import { FixedWindow } from './algorithms/fixed-window';
import { SlidingWindowLog } from './algorithms/sliding-window-log';
import { SlidingWindowCounter } from './algorithms/sliding-window-counter';
import { KeyBuilder } from './utils/key-builder';
import { PathNormalizer } from './utils/path-normalizer';
import { HeadersBuilder } from './utils/headers';
import { ConfigurationError, RateLimitError } from './errors/rate-limit-errors';

export class SmartRateLimiter {
  private store: Store;
  private algorithms: Map<string, BaseAlgorithm>;
  private keyBuilder: KeyBuilder;
  private pathNormalizer: PathNormalizer;
  private headersBuilder: HeadersBuilder;
  private tierCache: Map<string, TierConfig>;
  private config: SmartRateLimiterConfig;

  constructor(config: SmartRateLimiterConfig) {
    this.config = this.applyDefaults(config);
    this.validateConfig();
    
    this.store = StoreFactory.create(this.config);
    this.algorithms = this.initializeAlgorithms();
    this.keyBuilder = new KeyBuilder(this.config.keyPrefix);
    this.pathNormalizer = new PathNormalizer();
    this.headersBuilder = new HeadersBuilder();
    this.tierCache = new Map();
  }

  private applyDefaults(config: SmartRateLimiterConfig): SmartRateLimiterConfig {
    return {
      headers: config.headers !== false,
      statusCode: config.statusCode || 429,
      message: config.message || 'Too many requests, please try again later.',
      skipOnError: config.skipOnError || false,
      keyPrefix: config.keyPrefix || 'rl',
      ...config
    };
  }

  private validateConfig(): void {
    if (!this.config.userResolver) {
      throw new ConfigurationError('userResolver is required in configuration');
    }
    if (!this.config.tiers || Object.keys(this.config.tiers).length === 0) {
      throw new ConfigurationError('At least one tier must be defined in configuration');
    }
  }

  private initializeAlgorithms(): Map<string, BaseAlgorithm> {
    const algorithms = new Map<string, BaseAlgorithm>();
    algorithms.set('token-bucket', new TokenBucket(this.store));
    algorithms.set('leaky-bucket', new LeakyBucket(this.store));
    algorithms.set('fixed-window', new FixedWindow(this.store));
    algorithms.set('sliding-window-log', new SlidingWindowLog(this.store));
    algorithms.set('sliding-window-counter', new SlidingWindowCounter(this.store));
    return algorithms;
  }

  /**
   * Main method to check if a request should be allowed
   */
  async allow(req: any): Promise<RateLimitResult> {
    try {
      // Step 1: Resolve user identity
      const user = await this.resolveUser(req);
      
      // Step 2: Determine user's tier
      const tier = await this.resolveTier(user, req);
      
      // Step 3: Get effective rate limits
      const effectiveLimit = await this.getEffectiveLimits(tier, req, user);
      
      // Step 4: Build rate limit key
      const key = this.keyBuilder.build(user, tier, req);
      
      // Step 5: Check against rate limit algorithm
      const algorithm = this.getAlgorithm(effectiveLimit.algorithm);
      const result = await algorithm.allow(key, effectiveLimit);
      
      // Step 6: Trigger onLimitReached callback if needed
      if (!result.allowed && this.config.onLimitReached) {
        try {
          await this.config.onLimitReached(user, result);
        } catch (callbackError) {
          console.error('Error in onLimitReached callback:', callbackError);
        }
      }

      return {
        ...result,
        userTier: tier,
        userId: user.id,
        limit: effectiveLimit.limit,
        window: effectiveLimit.window
      };
    } catch (error) {
      if (this.config.skipOnError) {
        // Fail open - allow request through
        return {
          allowed: true,
          remaining: -1,
          retryAfter: 0,
          reset: 0,
          userTier: 'error',
          userId: 'unknown',
          limit: 0,
          window: 0
        };
      }
      throw error;
    }
  }

  /**
   * Resolve user from request
   */
  private async resolveUser(req: any): Promise<UserContext> {
    try {
      const user = await this.config.userResolver(req);
      if (!user.id || !user.tier) {
        throw new Error('User resolver must return id and tier');
      }
      return user;
    } catch (error) {
      // Fallback to anonymous user
      console.warn('User resolver failed, falling back to anonymous:', error);
      return {
        id: req.ip || req.connection?.remoteAddress || 'unknown',
        tier: 'anonymous'
      };
    }
  }

  /**
   * Resolve which tier applies to the user
   */
  private async resolveTier(user: UserContext, req: any): Promise<string> {
    if (this.config.tierResolver) {
      try {
        return await this.config.tierResolver(user, req);
      } catch (error) {
        console.warn('Tier resolver failed:', error);
      }
    }
    return user.tier || 'anonymous';
  }

  /**
   * Get effective limits considering routes and overrides
   */
  private async getEffectiveLimits(
    tier: string,
    req: any,
    user: UserContext
  ): Promise<TierConfig> {
    // Get base tier config
    const baseTier = this.config.tiers[tier] || 
                     this.config.tiers['anonymous'] || {
                       limit: 10,
                       window: 60000,
                       algorithm: 'fixed-window'
                     };

    // Check for route-specific overrides
    if (this.config.routes) {
      const routeRule = this.getRouteRule(req.path || req.url, req.method);
      if (routeRule) {
        return this.mergeRouteRule(baseTier, routeRule, user, tier);
      }
    }

    return baseTier;
  }

  /**
   * Find matching route rule
   */
  private getRouteRule(path: string, method: string): RouteRule | null {
    if (!this.config.routes) return null;

    for (const [, rule] of Object.entries(this.config.routes)) {
      const pattern = rule.path || '';
      
      if (this.pathNormalizer.match(path, pattern)) {
        // Check method if specified
        if (!rule.methods || rule.methods.includes(method.toUpperCase())) {
          return rule;
        }
      }
    }

    return null;
  }

  /**
   * Merge route-specific overrides with base tier config
   */
  private mergeRouteRule(
    baseTier: TierConfig,
    routeRule: RouteRule,
    user: UserContext,
    currentTier: string
  ): TierConfig {
    let merged = { ...baseTier };

    // Apply static tier overrides
    if (routeRule.tiers) {
      const tierOverride = routeRule.tiers[currentTier] || routeRule.tiers['default'];
      if (tierOverride) {
        merged = { ...merged, ...tierOverride };
      }
    }

    // Apply dynamic limits if defined
    if (routeRule.customLimits) {
      try {
        const dynamicLimits = routeRule.customLimits(user);
        merged = { ...merged, ...dynamicLimits };
      } catch (error) {
        console.error('Error in customLimits function:', error);
      }
    }

    return merged;
  }

  /**
   * Get algorithm instance
   */
  private getAlgorithm(name?: string): BaseAlgorithm {
    const algoName = name || 'token-bucket';
    const algorithm = this.algorithms.get(algoName);
    if (!algorithm) {
      throw new Error(`Unknown algorithm: ${algoName}. Available: ${Array.from(this.algorithms.keys()).join(', ')}`);
    }
    return algorithm;
  }

  /**
   * Express/Koa compatible middleware
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const result = await this.allow(req);

        // Set standard rate limit headers
        if (this.config.headers !== false) {
          this.headersBuilder.setHeaders(res, result);
        }

        if (!result.allowed) {
          const errorResponse = {
            error: this.config.message,
            retryAfter: result.retryAfter,
            retryAfterSeconds: Math.ceil(result.retryAfter / 1000),
            tier: result.userTier,
            limit: result.limit,
            remaining: result.remaining
          };

          return res
            .status(this.config.statusCode || 429)
            .json(errorResponse);
        }

        // Attach rate limit info to request for downstream use
        req.rateLimit = result;
        
        if (next) {
          next();
        }
      } catch (error) {
        if (this.config.skipOnError) {
          if (next) next();
        } else {
          next(error);
        }
      }
    };
  }

  /**
   * Get current rate limit status for a request
   */
  async getStatus(req: any): Promise<RateLimitResult> {
    return this.allow(req);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.store && typeof (this.store as any).destroy === 'function') {
      (this.store as any).destroy();
    }
    this.tierCache.clear();
  }
}