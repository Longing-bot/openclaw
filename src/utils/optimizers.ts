/**
 * OpenClaw 优化工具集
 * 包含所有性能、内存、缓存和连接池优化工具
 */

export { PerformanceOptimizer, performanceOptimizer } from './performance-optimizer.js';
export { MemoryOptimizer, memoryOptimizer } from './memory-optimizer.js';
export { CacheOptimizer, responseCache, modelCache, sessionCache } from './cache-optimizer.js';
export { ConnectionPool } from './connection-pool.js';

/**
 * 优化工具工厂
 */
export class OptimizerFactory {
  /**
   * 创建性能监控器
   */
  static createPerformanceMonitor() {
    return new (require('./performance-optimizer.js').PerformanceOptimizer)();
  }

  /**
   * 创建内存优化器
   */
  static createMemoryOptimizer() {
    return new (require('./memory-optimizer.js').MemoryOptimizer)();
  }

  /**
   * 创建缓存优化器
   */
  static createCacheOptimizer<K, V>(maxSize: number = 1000, ttl: number = 5 * 60 * 1000) {
    return new (require('./cache-optimizer.js').CacheOptimizer<K, V>)(maxSize, ttl);
  }

  /**
   * 创建连接池
   */
  static createConnectionPool<T>(
    factory: () => Promise<T>,
    destroyer: (conn: T) => Promise<void>,
    maxConnections: number = 10,
    minConnections: number = 2
  ) {
    return new (require('./connection-pool.js').ConnectionPool<T>)(
      factory,
      destroyer,
      maxConnections,
      minConnections
    );
  }
}

/**
 * 优化工具管理器
 */
export class OptimizationManager {
  private static instance: OptimizationManager;
  private performanceMonitor = performanceOptimizer;
  private memoryOptimizer = memoryOptimizer;
  private caches = new Map<string, CacheOptimizer<any, any>>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): OptimizationManager {
    if (!OptimizationManager.instance) {
      OptimizationManager.instance = new OptimizationManager();
    }
    return OptimizationManager.instance;
  }

  /**
   * 获取性能监控器
   */
  getPerformanceMonitor() {
    return this.performanceMonitor;
  }

  /**
   * 获取内存优化器
   */
  getMemoryOptimizer() {
    return this.memoryOptimizer;
  }

  /**
   * 获取或创建缓存
   */
  getCache<K, V>(name: string, maxSize: number = 1000, ttl: number = 5 * 60 * 1000): CacheOptimizer<K, V> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new CacheOptimizer<K, V>(maxSize, ttl));
    }
    return this.caches.get(name)! as CacheOptimizer<K, V>;
  }

  /**
   * 获取所有优化统计
   */
  getAllStats() {
    return {
      performance: this.performanceMonitor.getAllMetrics(),
      memory: this.memoryOptimizer.getMemoryUsage(),
      caches: Array.from(this.caches.entries()).map(([name, cache]) => ({
        name,
        ...cache.getStats(),
      })),
    };
  }

  /**
   * 清理所有缓存
   */
  clearAllCaches(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCaches(): number {
    let totalCleaned = 0;
    for (const cache of this.caches.values()) {
      totalCleaned += cache.cleanupExpired();
    }
    return totalCleaned;
  }
}

// 导出单例
export const optimizationManager = OptimizationManager.getInstance();
