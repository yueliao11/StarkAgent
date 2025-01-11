interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheEntry<any>>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 60000 // Default TTL: 1 minute
  ): Promise<T> {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry && now - entry.timestamp < entry.ttl) {
      return entry.value;
    }

    const value = await fetcher();
    this.cache.set(key, {
      value,
      timestamp: now,
      ttl
    });

    return value;
  }

  public set<T>(key: string, value: T, ttl: number = 60000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  public get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp >= entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  public clear(): void {
    this.cache.clear();
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // 清理过期缓存
  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
