/**
 * 性能优化工具
 * 用于监控和优化OpenClaw的性能
 */

export class PerformanceOptimizer {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * 开始计时
   */
  startTimer(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  /**
   * 结束计时并记录
   */
  endTimer(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      throw new Error(`Timer ${name} not started`);
    }

    const duration = performance.now() - startTime;
    this.recordMetric(name, duration);
    this.startTimes.delete(name);
    return duration;
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
  getStats(name: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  /**
   * 清除指标
   */
  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): Map<string, { avg: number; min: number; max: number; count: number }> {
    const result = new Map();
    for (const [name] of this.metrics) {
      result.set(name, this.getStats(name));
    }
    return result;
  }
}

// 全局实例
export const performanceOptimizer = new PerformanceOptimizer();
