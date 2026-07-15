export class RateLimitError extends Error {
  public retryAfter: number;
  public tier: string;
  public limit: number;
  
  constructor(message: string, retryAfter: number, tier: string, limit: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.tier = tier;
    this.limit = limit;
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class StoreError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'StoreError';
  }
}