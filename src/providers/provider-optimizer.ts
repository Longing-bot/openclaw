/**
 * AI提供商优化器
 * 用于优化OpenClaw的AI模型调用
 */

export class ProviderOptimizer {
  private static instance: ProviderOptimizer;
  private responseCache = new Map<string, any>();
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();
  private retryQueues = new Map<string, any[]>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ProviderOptimizer {
    if (!ProviderOptimizer.instance) {
      ProviderOptimizer.instance = new ProviderOptimizer();
    }
    return ProviderOptimizer.instance;
  }

  /**
   * 优化模型调用
   */
  async optimizeModelCall(
    provider: string,
    model: string,
    prompt: string,
    caller: () => Promise<any>
  ): Promise<any> {
    const cacheKey = `${provider}:${model}:${prompt}`;
    
    // 检查缓存
    if (this.responseCache.has(cacheKey)) {
      return this.responseCache.get(cacheKey);
    }

    // 检查速率限制
    if (this.isRateLimited(provider)) {
      return this.queueRetry(provider, model, prompt, caller);
    }

    // 执行调用
    const startTime = performance.now();
    try {
      const response = await caller();
      const duration = performance.now() - startTime;
      
      // 记录速率限制
      this.recordRateLimit(provider);
      
      // 缓存响应
      this.responseCache.set(cacheKey, response);
      
      return response;
    } catch (error) {
      // 处理错误
      throw error;
    }
  }

  /**
   * 检查速率限制
   */
  private isRateLimited(provider: string): boolean {
    const limiter = this.rateLimiters.get(provider);
    if (!limiter) return false;

    const now = Date.now();
    if (now > limiter.resetTime) {
      limiter.count = 0;
      limiter.resetTime = now + 60000; // 1分钟重置
    }

    return limiter.count >= 100; // 每分钟最多100次请求
  }

  /**
   * 记录速率限制
   */
  private recordRateLimit(provider: string): void {
    if (!this.rateLimiters.has(provider)) {
      this.rateLimiters.set(provider, { count: 0, resetTime: Date.now() + 60000 });
    }
    this.rateLimiters.get(provider)!.count++;
  }

  /**
   * 队列重试
   */
  private async queueRetry(
    provider: string,
    model: string,
    prompt: string,
    caller: () => Promise<any>
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.retryQueues.has(provider)) {
        this.retryQueues.set(provider, []);
      }
      
      this.retryQueues.get(provider)!.push({
        model,
        prompt,
        caller,
        resolve,
        reject,
      });

      // 延迟重试
      setTimeout(() => {
        this.processRetryQueue(provider);
      }, 1000);
    });
  }

  /**
   * 处理重试队列
   */
  private async processRetryQueue(provider: string): Promise<void> {
    const queue = this.retryQueues.get(provider);
    if (!queue || queue.length === 0) return;

    const item = queue.shift();
    if (!item) return;

    try {
      const result = await this.optimizeModelCall(provider, item.model, item.prompt, item.caller);
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }

    // 继续处理队列
    if (queue.length > 0) {
      setTimeout(() => {
        this.processRetryQueue(provider);
      }, 100);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    cachedResponses: number;
    rateLimitedProviders: number;
    retryQueues: number;
  } {
    let rateLimitedProviders = 0;
    for (const limiter of this.rateLimiters.values()) {
      if (limiter.count > 0) rateLimitedProviders++;
    }

    return {
      cachedResponses: this.responseCache.size,
      rateLimitedProviders,
      retryQueues: this.retryQueues.size,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * 清除所有
   */
  clearAll(): void {
    this.clearCache();
    this.rateLimiters.clear();
    this.retryQueues.clear();
  }
}

// 导出单例
export const providerOptimizer = ProviderOptimizer.getInstance();
