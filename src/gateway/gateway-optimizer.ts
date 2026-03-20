/**
 * 网关优化器
 * 用于优化OpenClaw网关的性能
 */

export class GatewayOptimizer {
  private static instance: GatewayOptimizer;
  private requestCache = new Map<string, any>();
  private connectionPool = new Map<string, any>();
  private metrics = new Map<string, number[]>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): GatewayOptimizer {
    if (!GatewayOptimizer.instance) {
      GatewayOptimizer.instance = new GatewayOptimizer();
    }
    return GatewayOptimizer.instance;
  }

  /**
   * 优化请求处理
   */
  optimizeRequest(key: string, handler: () => Promise<any>): Promise<any> {
    // 检查缓存
    if (this.requestCache.has(key)) {
      return Promise.resolve(this.requestCache.get(key));
    }

    // 执行处理
    const startTime = performance.now();
    return handler().then((result) => {
      const duration = performance.now() - startTime;
      this.recordMetric('requestDuration', duration);
      
      // 缓存结果
      this.requestCache.set(key, result);
      
      return result;
    });
  }

  /**
   * 优化连接管理
   */
  optimizeConnection(connectionId: string, factory: () => any): any {
    if (this.connectionPool.has(connectionId)) {
      return this.connectionPool.get(connectionId);
    }

    const connection = factory();
    this.connectionPool.set(connectionId, connection);
    return connection;
  }

  /**
   * 优化并发处理
   */
  async optimizeConcurrency<T>(tasks: (() => Promise<T>)[], maxConcurrency: number = 5): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<any>[] = [];

    for (const task of tasks) {
      const promise = task().then((result) => {
        results.push(result);
        executing.splice(executing.indexOf(promise), 1);
      });

      executing.push(promise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * 记录指标
   */
  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    requestCacheSize: number;
    connectionPoolSize: number;
    metrics: Map<string, { avg: number; min: number; max: number; count: number }>;
  } {
    const metricsStats = new Map();
    for (const [name, values] of this.metrics) {
      if (values.length > 0) {
        metricsStats.set(name, {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        });
      }
    }

    return {
      requestCacheSize: this.requestCache.size,
      connectionPoolSize: this.connectionPool.size,
      metrics: metricsStats,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * 清除连接池
   */
  clearConnectionPool(): void {
    this.connectionPool.clear();
  }

  /**
   * 清除所有
   */
  clearAll(): void {
    this.clearCache();
    this.clearConnectionPool();
    this.metrics.clear();
  }
}

// 导出单例
export const gatewayOptimizer = GatewayOptimizer.getInstance();
