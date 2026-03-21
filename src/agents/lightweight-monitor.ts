/**
 * OpenClaw 轻量级监控系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的指标收集
 * 2. 快速监控
 * 3. 低计算开销
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
}

export class LightweightMonitor {
  private metrics: Map<string, Metric[]> = new Map();
  private maxMetrics: number = 100;

  constructor() {
    console.log('[Monitor] 初始化完成');
  }

  /**
   * 记录指标
   */
  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
    };

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // 限制数量
    if (metrics.length > this.maxMetrics) {
      metrics.shift();
    }
  }

  /**
   * 获取指标
   */
  getMetrics(name: string, count: number = 10): Metric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.slice(-count);
  }

  /**
   * 计算平均值
   */
  average(name: string): number {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  /**
   * 获取统计
   */
  getStats(): { metricCount: number; totalRecords: number } {
    let totalRecords = 0;
    for (const metrics of this.metrics.values()) {
      totalRecords += metrics.length;
    }
    return { metricCount: this.metrics.size, totalRecords };
  }
}

let globalMonitor: LightweightMonitor | null = null;

export function getGlobalMonitor(): LightweightMonitor {
  if (!globalMonitor) {
    globalMonitor = new LightweightMonitor();
  }
  return globalMonitor;
}
