import { SmartRateLimiter } from '../smart-rate-limiter';
import { Request, Response, NextFunction } from 'express';

export function createExpressMiddleware(limiter: SmartRateLimiter) {
  return (req: Request, res: Response, next: NextFunction) => {
    return limiter.middleware()(req, res, next);
  };
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        allowed: boolean;
        remaining: number;
        retryAfter: number;
        userTier?: string;
        userId?: string;
        limit?: number;
        window?: number;
      };
    }
  }
}