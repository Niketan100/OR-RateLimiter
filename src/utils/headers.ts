import { RateLimitResult } from '../config';

export class HeadersBuilder {
  setHeaders(res: any, result: RateLimitResult): void {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(result.limit || 0),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
      'X-RateLimit-Tier': result.userTier || 'unknown'
    };
    
    if (!result.allowed) {
      headers['Retry-After'] = String(Math.ceil(result.retryAfter / 1000));
      headers['X-RateLimit-Retry-After-Ms'] = String(result.retryAfter);
    }
    
    // Set headers on response object
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader?.(key, value);
      res.set?.(key, value);
    }
  }
}