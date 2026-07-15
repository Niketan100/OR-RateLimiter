import { Store } from '../stores/store.interface';
import { TierConfig, AlgorithmResult } from '../config';

export abstract class BaseAlgorithm {
  constructor(protected store: Store) {}
  
  abstract allow(key: string, config: TierConfig): Promise<AlgorithmResult>;
  
  protected getWindowKey(key: string, window: number): string {
    const windowSeconds = Math.floor(window / 1000);
    return `${key}:${windowSeconds}`;
  }
}