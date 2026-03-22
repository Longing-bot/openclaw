/**
 * OpenClaw 轻量级性能分析器
 * 
 * 专为小参数模型优化：
 * 1. 简化的性能分析
 * 2. 快速性能检测
 * 3. 低计算开销
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
}

export class LightweightPerformanceAnalyzer {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;

  constructor() {
    console.log('[PerformanceAnalyzer] 初始化完成');
  }

  /**
   * 开始计时
   */
  start(name: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.record(name, duration);
    };
  }

  /**
   * 记录指标
   */
  record(name: string, duration: number): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    // 限制数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * 获取指标
   */
  getMetrics(name?: string, count: number = 10): PerformanceMetric[] {
    let filtered = this.metrics;
    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }
    return filtered.slice(-count);
  }

  /**
   * 计算平均值
   */
  average(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, m) => sum + m.duration, 0) / filtered.length;
  }

  /**
   * 获取统计
   */
  getStats(): { metricCount: number; metricNames: string[] } {
    const names = new Set(this.metrics.map(m => m.name));
    return {
      metricCount: this.metrics.length,
      metricNames: Array.from(names),
    };
  }
}

let globalPerformanceAnalyzer: LightweightPerformanceAnalyzer | null = null;

export function getGlobalPerformanceAnalyzer(): LightweightPerformanceAnalyzer {
  if (!globalPerformanceAnalyzer) {
    globalPerformanceAnalyzer = new LightweightPerformanceAnalyzer();
  }
  return globalPerformanceAnalyzer;
}
