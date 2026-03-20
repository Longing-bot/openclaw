/**
 * 路由优化器
 * 用于优化OpenClaw的请求路由
 */

export class RouteOptimizer {
  private static instance: RouteOptimizer;
  private routeCache = new Map<string, any>();
  private routePatterns = new Map<string, RegExp>();
  private hitCounts = new Map<string, number>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): RouteOptimizer {
    if (!RouteOptimizer.instance) {
      RouteOptimizer.instance = new RouteOptimizer();
    }
    return RouteOptimizer.instance;
  }

  /**
   * 优化路由匹配
   */
  optimizeRouteMatch(path: string, patterns: string[]): string | null {
    // 检查缓存
    if (this.routeCache.has(path)) {
      const cached = this.routeCache.get(path);
      this.hitCounts.set(path, (this.hitCounts.get(path) || 0) + 1);
      return cached;
    }

    // 匹配路由
    for (const pattern of patterns) {
      if (this.matchPattern(path, pattern)) {
        this.routeCache.set(path, pattern);
        this.hitCounts.set(path, 1);
        return pattern;
      }
    }

    return null;
  }

  /**
   * 匹配模式
   */
  private matchPattern(path: string, pattern: string): boolean {
    // 简单的模式匹配
    if (pattern === path) return true;
    
    // 通配符匹配
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return path.startsWith(prefix);
    }

    return false;
  }

  /**
   * 优化路由注册
   */
  optimizeRouteRegister(pattern: string, handler: any): void {
    // 编译正则表达式
    if (!this.routePatterns.has(pattern)) {
      const regex = this.patternToRegex(pattern);
      this.routePatterns.set(pattern, regex);
    }
  }

  /**
   * 模式转正则
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escaped}$`);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    cachedRoutes: number;
    registeredPatterns: number;
    totalHits: number;
  } {
    let totalHits = 0;
    for (const count of this.hitCounts.values()) {
      totalHits += count;
    }

    return {
      cachedRoutes: this.routeCache.size,
      registeredPatterns: this.routePatterns.size,
      totalHits,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.routeCache.clear();
    this.hitCounts.clear();
  }

  /**
   * 清除所有
   */
  clearAll(): void {
    this.clearCache();
    this.routePatterns.clear();
  }
}

// 导出单例
export const routeOptimizer = RouteOptimizer.getInstance();
