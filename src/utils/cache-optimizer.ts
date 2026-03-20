/**
 * 缓存优化工具
 * 用于优化OpenClaw的缓存策略
 */

export class CacheOptimizer<K, V> {
  private cache = new Map<K, V>();
  private accessTimes = new Map<K, number>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 1000, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * 获取缓存
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 更新访问时间
      this.accessTimes.set(key, Date.now());
      return value;
    }
    return undefined;
  }

  /**
   * 设置缓存
   */
  set(key: K, value: V): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
    }

    // 如果超过最大大小，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, value);
    this.accessTimes.set(key, Date.now());
  }

  /**
   * 删除缓存
   */
  delete(key: K): boolean {
    this.accessTimes.delete(key);
    return this.cache.delete(key);
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 检查是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 驱逐最旧的条目
   */
  private evictOldest(): void {
    let oldestKey: K | undefined;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.delete(oldestKey);
    }
  }

  /**
   * 清除过期条目
   */
  cleanupExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, time] of this.accessTimes) {
      if (now - time > this.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 获取统计信息
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}

// 全局缓存实例
export const responseCache = new CacheOptimizer<string, any>(1000, 5 * 60 * 1000);
export const modelCache = new CacheOptimizer<string, any>(100, 10 * 60 * 1000);
export const sessionCache = new CacheOptimizer<string, any>(500, 15 * 60 * 1000);
