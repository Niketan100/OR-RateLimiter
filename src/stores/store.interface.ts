export interface StoreData {
  tokens?: number;
  lastRefill?: number;
  count?: number;
  timestamp?: number;
  requests?: number[];
  [key: string]: any;
}

export interface Store {
  get(key: string): Promise<StoreData | null>;
  set(key: string, data: StoreData, ttl: number): Promise<void>;
  increment(key: string, window: number): Promise<number>;
  decrement(key: string): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
}