/**
 * 安全优化器
 * 用于优化OpenClaw的安全处理
 */

export class SecurityOptimizer {
  private static instance: SecurityOptimizer;
  private tokenCache = new Map<string, any>();
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();
  private blacklist = new Set<string>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): SecurityOptimizer {
    if (!SecurityOptimizer.instance) {
      SecurityOptimizer.instance = new SecurityOptimizer();
    }
    return SecurityOptimizer.instance;
  }

  /**
   * 优化令牌验证
   */
  optimizeTokenValidation(token: string, validator: (token: string) => Promise<any>): Promise<any> {
    // 检查缓存
    if (this.tokenCache.has(token)) {
      return Promise.resolve(this.tokenCache.get(token));
    }

    // 验证令牌
    return validator(token).then((result) => {
      // 缓存结果
      this.tokenCache.set(token, result);
      return result;
    });
  }

  /**
   * 优化速率限制
   */
  optimizeRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const limiter = this.rateLimiters.get(key);

    if (!limiter || now > limiter.resetTime) {
      this.rateLimiters.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (limiter.count >= limit) {
      return false;
    }

    limiter.count++;
    return true;
  }

  /**
   * 优化黑名单检查
   */
  optimizeBlacklistCheck(key: string): boolean {
    return this.blacklist.has(key);
  }

  /**
   * 添加到黑名单
   */
  addToBlacklist(key: string): void {
    this.blacklist.add(key);
  }

  /**
   * 从黑名单移除
   */
  removeFromBlacklist(key: string): void {
    this.blacklist.delete(key);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    cachedTokens: number;
    rateLimitedKeys: number;
    blacklistedKeys: number;
  } {
    return {
      cachedTokens: this.tokenCache.size,
      rateLimitedKeys: this.rateLimiters.size,
      blacklistedKeys: this.blacklist.size,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.tokenCache.clear();
  }

  /**
   * 清除所有
   */
  clearAll(): void {
    this.clearCache();
    this.rateLimiters.clear();
    this.blacklist.clear();
  }
}

// 导出单例
export const securityOptimizer = SecurityOptimizer.getInstance();
