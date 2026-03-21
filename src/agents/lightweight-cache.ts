/**
 * OpenClaw 轻量级缓存系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的缓存策略
 * 2. 快速读写
 * 3. 低内存占用
 */

export class LightweightCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private maxSize: number = 1000;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * 设置缓存
   */
  set(key: string, value: any, ttl: number = 300000): void {
    // 检查大小
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  /**
   * 获取缓存
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 淘汰最旧的
   */
  private evictOldest(): void {
    const oldest = this.cache.keys().next().value;
    if (oldest) {
      this.cache.delete(oldest);
    }
  }

  /**
   * 获取统计
   */
  getStats(): { size: number; hitRate: number } {
    return { size: this.cache.size, hitRate: 0 };
  }
}

let globalCache: LightweightCache | null = null;

export function getGlobalCache(): LightweightCache {
  if (!globalCache) {
    globalCache = new LightweightCache();
  }
  return globalCache;
}
