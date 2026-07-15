export interface UserContext {
  id: string;
  tier: string;
  metadata?: Record<string, any>;
}

export interface TierConfig {
  limit: number;
  window: number; // milliseconds
  algorithm?: 'token-bucket' | 'leaky-bucket' | 'fixed-window' | 'sliding-window-log' | 'sliding-window-counter';
  burst?: number;
  hardLimit?: number;
  concurrentLimit?: number;
  quota?: {
    daily?: number;
    hourly?: number;
    monthly?: number;
  };
}

export interface RouteRule {
  path?: string;
  pattern?: RegExp;
  methods?: string[];
  tiers?: Record<string, Partial<TierConfig>>;
  customLimits?: (user: UserContext) => Partial<TierConfig> | Promise<Partial<TierConfig>>;
}

export interface SmartRateLimiterConfig {
  userResolver: (req: any) => Promise<UserContext> | UserContext;
  tiers: Record<string, TierConfig>;
  tierResolver?: (user: UserContext, req: any) => Promise<string> | string;
  routes?: Record<string, RouteRule>;
  keyPrefix?: string;
  store?: 'memory' | 'redis' | any;
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  headers?: boolean;
  statusCode?: number;
  message?: string;
  skipOnError?: boolean;
  onLimitReached?: (user: UserContext, result: RateLimitResult) => Promise<void> | void;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // milliseconds
  reset: number; // timestamp
  userTier?: string;
  userId?: string;
  limit?: number;
  window?: number;
}

export interface AlgorithmResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  reset: number;
}