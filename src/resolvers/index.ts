import { UserContext } from '../config';

export type UserResolver = (req: any) => Promise<UserContext> | UserContext;

export class BuiltInResolvers {
  /**
   * JWT-based user resolver
   */
  static jwt(options: {
    secret: string;
    headerName?: string;
    idField?: string;
    tierField?: string;
    defaultTier?: string;
  }): UserResolver {
    return async (req: any): Promise<UserContext> => {
      try {
        const headerName = (options.headerName || 'authorization').toLowerCase();
        const authHeader = req.headers[headerName];
        
        if (!authHeader) {
          return { id: req.ip || 'unknown', tier: 'anonymous' };
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Try to use jsonwebtoken if available
        let decoded: any;
        try {
          const jwt = require('jsonwebtoken');
          decoded = jwt.verify(token, options.secret);
        } catch (e) {
          // Simple base64 decode for demo
          const payload = token.split('.')[1];
          decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        }

        return {
          id: decoded[options.idField || 'sub'] || 'unknown',
          tier: decoded[options.tierField || 'tier'] || options.defaultTier || 'authenticated',
          metadata: decoded
        };
      } catch (error) {
        return { id: req.ip || 'unknown', tier: 'anonymous' };
      }
    };
  }

  /**
   * API Key based resolver
   */
  static apiKey(options: {
    headerName?: string;
    queryParam?: string;
    lookupFn: (apiKey: string) => Promise<{ id: string; tier: string; metadata?: any }>;
  }): UserResolver {
    return async (req: any): Promise<UserContext> => {
      try {
        const headerName = (options.headerName || 'x-api-key').toLowerCase();
        let apiKey = req.headers[headerName];
        // Check query parameter as fallback
        if (!apiKey && options.queryParam) {
          apiKey = req.query?.[options.queryParam];
        }

        if (!apiKey) {
          return { id: req.ip || 'unknown', tier: 'anonymous' };
        }

        const result = await options.lookupFn(apiKey);
        return {
          id: result.id,
          tier: result.tier,
          metadata: { apiKey, ...result.metadata }
        };
      } catch (error) {
        return { id: req.ip || 'unknown', tier: 'anonymous' };
      }
    };
  }

  /**
   * Session-based resolver
   */
  static session(options?: {
    userPath?: string;
    idField?: string;
    tierField?: string;
  }): UserResolver {
    return (req: any): UserContext => {
      const userPath = options?.userPath || 'session.user';
      const user = this.getNestedProperty(req, userPath);

      if (user) {
        return {
          id: user[options?.idField || 'id'] || 'unknown',
          tier: user[options?.tierField || 'role'] || 'authenticated',
          metadata: user
        };
      }

      return { id: req.ip || 'unknown', tier: 'anonymous' };
    };
  }

  /**
   * IP-based resolver with custom mapping
   */
  static ipBased(config?: {
    whitelist?: string[];
    blacklist?: string[];
    tierForIp?: (ip: string) => string;
  }): UserResolver {
    return (req: any): UserContext => {
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      
      if (config?.blacklist?.includes(ip)) {
        return { id: ip, tier: 'blocked' };
      }

      if (config?.whitelist?.includes(ip)) {
        return { id: ip, tier: 'whitelisted' };
      }

      const tier = config?.tierForIp ? config.tierForIp(ip) : 'anonymous';
      return { id: ip, tier };
    };
  }

  /**
   * Chain multiple resolvers - first one that returns non-anonymous wins
   */
  static chain(resolvers: UserResolver[]): UserResolver {
    return async (req: any): Promise<UserContext> => {
      for (const resolver of resolvers) {
        try {
          const user = await resolver(req);
          if (user.tier !== 'anonymous') {
            return user;
          }
        } catch (error) {
          // Continue to next resolver
        }
      }
      return { id: req.ip || 'unknown', tier: 'anonymous' };
    };
  }

  /**
   * Helper to get nested object property
   */
  private static getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }
}