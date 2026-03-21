/**
 * OpenClaw 模型性能优化器
 * 
 * 专为小参数模型优化：
 * 1. 响应速度优化
 * 2. Token 使用优化
 * 3. 缓存优化
 * 4. 并发优化
 */

export interface OptimizationMetrics {
  responseTime: number;
  tokenUsage: number;
  cacheHits: number;
  cacheMisses: number;
}

export class ModelPerformanceOptimizer {
  private metrics: OptimizationMetrics = {
    responseTime: 0,
    tokenUsage: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  private cache: Map<string, { response: string; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5分钟

  constructor() {
    console.log('[PerformanceOptimizer] 初始化完成');
  }

  /**
   * 优化请求
   */
  optimizeRequest(prompt: string): string {
    // 压缩提示词
    let optimized = prompt;

    // 移除多余空白
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // 移除重复内容
    const lines = optimized.split('\n');
    const uniqueLines = [...new Set(lines)];
    optimized = uniqueLines.join('\n');

    return optimized;
  }

  /**
   * 检查缓存
   */
  checkCache(key: string): string | null {
    const cached = this.cache.get(key);
    if (!cached) {
      this.metrics.cacheMisses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      this.metrics.cacheMisses++;
      return null;
    }

    this.metrics.cacheHits++;
    return cached.response;
  }

  /**
   * 设置缓存
   */
  setCache(key: string, response: string): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // 限制缓存大小
    if (this.cache.size > 1000) {
      const oldest = this.cache.keys().next().value;
      if (oldest) {
        this.cache.delete(oldest);
      }
    }
  }

  /**
   * 记录响应时间
   */
  recordResponseTime(duration: number): void {
    this.metrics.responseTime = (this.metrics.responseTime + duration) / 2;
  }

  /**
   * 记录 Token 使用
   */
  recordTokenUsage(tokens: number): void {
    this.metrics.tokenUsage += tokens;
  }

  /**
   * 估算 Token 数
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * 优化 Token 使用
   */
  optimizeTokenUsage(prompt: string, maxTokens: number): string {
    const estimated = this.estimateTokens(prompt);
    if (estimated <= maxTokens) return prompt;

    // 截断到指定长度
    const ratio = maxTokens / estimated;
    const truncateLength = Math.floor(prompt.length * ratio);
    return prompt.substring(0, truncateLength) + '...';
  }

  /**
   * 获取统计
   */
  getStats(): OptimizationMetrics {
    return { ...this.metrics };
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

let globalPerformanceOptimizer: ModelPerformanceOptimizer | null = null;

export function getGlobalPerformanceOptimizer(): ModelPerformanceOptimizer {
  if (!globalPerformanceOptimizer) {
    globalPerformanceOptimizer = new ModelPerformanceOptimizer();
  }
  return globalPerformanceOptimizer;
}
