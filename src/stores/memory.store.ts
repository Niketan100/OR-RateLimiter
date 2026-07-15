import { Store, StoreData } from './store.interface';

export class MemoryStore implements Store {
  private store: Map<string, { data: StoreData; expiry: number }>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async get(key: string): Promise<StoreData | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return { ...entry.data };
  }

  async set(key: string, data: StoreData, ttl: number): Promise<void> {
    this.store.set(key, {
      data: { ...data },
      expiry: Date.now() + ttl
    });
  }

  async increment(key: string, window: number): Promise<number> {
    const existing = await this.get(key);
    const count = (existing?.count || 0) + 1;
    const data = { ...existing, count, timestamp: Date.now() };
    await this.set(key, data, window);
    return count;
  }

  async decrement(key: string): Promise<void> {
    const entry = await this.get(key);
    if (entry && entry.count && entry.count > 0) {
      entry.count -= 1;
      const ttl = await this.ttl(key);
      await this.set(key, entry, ttl);
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -1;
    return Math.max(0, entry.expiry - Date.now());
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiry < now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
  // Add this method to MemoryStore class
getStore(): Map<string, { data: StoreData; expiry: number }> {
  return this.store;
}

// Also export for debugging
toJSON(): Record<string, any> {
  const obj: Record<string, any> = {};
  this.store.forEach((value, key) => {
    obj[key] = {
      data: value.data,
      expiry: new Date(value.expiry).toISOString(),
      ttl: Math.max(0, value.expiry - Date.now())
    };
  });
  return obj;
}
}

