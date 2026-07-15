import { UserContext } from '../config';

export class KeyBuilder {
  constructor(private prefix: string = 'rl') {}
  
  build(user: UserContext, tier: string, req: any): string {
    const parts: string[] = [
      this.prefix,
      `tier:${tier}`,
      `user:${user.id}`,
      `path:${this.normalizePath(req.path || req.url || '/')}`,
      `method:${(req.method || 'GET').toUpperCase()}`
    ];
    
    // Add optional identifiers for more granular control
    if (user.metadata?.orgId) {
      parts.push(`org:${user.metadata.orgId}`);
    }
    
    if (user.metadata?.apiKey) {
      parts.push(`apikey:${user.metadata.apiKey.substring(0, 8)}`);
    }
    
    return parts.join(':');
  }
  
  private normalizePath(path: string): string {
    // Remove trailing slash
    return path.replace(/\/$/, '') || '/';
  }
}