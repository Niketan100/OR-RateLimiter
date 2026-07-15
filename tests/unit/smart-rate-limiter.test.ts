import { SmartRateLimiter } from '../../src/smart-rate-limiter';
import { BuiltInResolvers } from '../../src/resolvers';

describe('SmartRateLimiter', () => {
  let limiter: SmartRateLimiter;

  beforeEach(() => {
    limiter = new SmartRateLimiter({
      userResolver: BuiltInResolvers.ipBased(),
      tiers: {
        anonymous: {
          limit: 5,
          window: 1000, // 1 second for fast testing
          algorithm: 'token-bucket',
          burst: 5
        }
      }
    });
  });

  afterEach(() => {
    limiter.destroy();
  });

  it('should allow requests within limit', async () => {
    const mockReq = { ip: '127.0.0.1', path: '/test', method: 'GET' };
    
    for (let i = 0; i < 5; i++) {
      const result = await limiter.allow(mockReq);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('should block requests over limit', async () => {
    const mockReq = { ip: '127.0.0.1', path: '/test', method: 'GET' };
    
    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      await limiter.allow(mockReq);
    }
    
    // This should be blocked
    const result = await limiter.allow(mockReq);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should separate limits for different users', async () => {
    const user1 = { ip: '1.1.1.1', path: '/test', method: 'GET' };
    const user2 = { ip: '2.2.2.2', path: '/test', method: 'GET' };
    
    // Exhaust user1's limit
    for (let i = 0; i < 5; i++) {
      await limiter.allow(user1);
    }
    
    // User2 should still have full access
    const result = await limiter.allow(user2);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});