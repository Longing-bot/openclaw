/**
 * OpenClaw 模型缓存管理器
 * 
 * 智能缓存：
 * 1. 响应缓存
 * 2. 嵌入缓存
 * 3. 上下文缓存
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export class ModelCacheManager {
  private responseCache: Map<string, CacheEntry<string>> = new Map();
  private embeddingCache: Map<string, CacheEntry<number[]>> = new Map();
  private contextCache: Map<string, CacheEntry<any>> = new Map();

  private maxSize: number = 1000;
  private defaultTTL: number = 5 * 60 * 1000; // 5分钟

  constructor() {
    console.log('[CacheManager] 初始化完成');
  }

  /**
   * 缓存响应
   */
  cacheResponse(key: string, response: string, ttl?: number): void {
    this.set(this.responseCache, key, response, ttl);
  }

  /**
   * 获取缓存响应
   */
  getResponse(key: string): string | null {
    return this.get(this.responseCache, key);
  }

  /**
   * 缓存嵌入
   */
  cacheEmbedding(key: string, embedding: number[], ttl?: number): void {
    this.set(this.embeddingCache, key, embedding, ttl);
  }

  /**
   * 获取缓存嵌入
   */
  getEmbedding(key: string): number[] | null {
    return this.get(this.embeddingCache, key);
  }

  /**
   * 缓存上下文
   */
  cacheContext(key: string, context: any, ttl?: number): void {
    this.set(this.contextCache, key, context, ttl);
  }

  /**
   * 获取缓存上下文
   */
  getContext(key: string): any | null {
    return this.get(this.contextCache, key);
  }

  /**
   * 设置缓存
   */
  private set<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttl?: number): void {
    // 检查大小
    if (cache.size >= this.maxSize) {
      this.evictOldest(cache);
    }

    cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
    });
  }

  /**
   * 获取缓存
   */
  private get<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.value;
  }

  /**
   * 淘汰最旧的
   */
  private evictOldest<T>(cache: Map<string, CacheEntry<T>>): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.responseCache.clear();
    this.embeddingCache.clear();
    this.contextCache.clear();
  }

  /**
   * 获取统计
   */
  getStats(): {
    responseCache: number;
    embeddingCache: number;
    contextCache: number;
  } {
    return {
      responseCache: this.responseCache.size,
      embeddingCache: this.embeddingCache.size,
      contextCache: this.contextCache.size,
    };
  }
}

let globalCacheManager: ModelCacheManager | null = null;

export function getGlobalCacheManager(): ModelCacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new ModelCacheManager();
  }
  return globalCacheManager;
}
