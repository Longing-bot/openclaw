/**
 * OpenClaw 模型监控仪表板
 * 
 * 监控模型使用情况：
 * 1. 实时监控
 * 2. 性能监控
 * 3. 成本监控
 */

export interface DashboardMetrics {
  requestsPerMinute: number;
  avgResponseTime: number;
  errorRate: number;
  tokenUsage: number;
  cost: number;
}

export class ModelDashboard {
  private metrics: DashboardMetrics = {
    requestsPerMinute: 0,
    avgResponseTime: 0,
    errorRate: 0,
    tokenUsage: 0,
    cost: 0,
  };

  private requestTimes: number[] = [];
  private errorCount: number = 0;
  private requestCount: number = 0;

  constructor() {
    console.log('[Dashboard] 初始化完成');
  }

  /**
   * 记录请求
   */
  recordRequest(duration: number, tokens: number, cost: number, success: boolean): void {
    this.requestCount++;
    this.requestTimes.push(duration);
    this.metrics.tokenUsage += tokens;
    this.metrics.cost += cost;

    if (!success) {
      this.errorCount++;
    }

    // 计算每分钟请求数
    const oneMinuteAgo = Date.now() - 60000;
    this.requestTimes = this.requestTimes.filter(t => t > oneMinuteAgo);
    this.metrics.requestsPerMinute = this.requestTimes.length;

    // 计算平均响应时间
    if (this.requestTimes.length > 0) {
      this.metrics.avgResponseTime = 
        this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
    }

    // 计算错误率
    this.metrics.errorRate = this.requestCount > 0
      ? (this.errorCount / this.requestCount) * 100
      : 0;
  }

  /**
   * 获取指标
   */
  getMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    return `
# 模型监控仪表板

## 实时指标
- 每分钟请求: ${this.metrics.requestsPerMinute}
- 平均响应时间: ${this.metrics.avgResponseTime.toFixed(2)} ms
- 错误率: ${this.metrics.errorRate.toFixed(2)} %
- Token 使用: ${this.metrics.tokenUsage}
- 成本: $${this.metrics.cost.toFixed(4)}
    `.trim();
  }

  /**
   * 重置指标
   */
  reset(): void {
    this.metrics = {
      requestsPerMinute: 0,
      avgResponseTime: 0,
      errorRate: 0,
      tokenUsage: 0,
      cost: 0,
    };
    this.requestTimes = [];
    this.errorCount = 0;
    this.requestCount = 0;
  }
}

let globalDashboard: ModelDashboard | null = null;

export function getGlobalDashboard(): ModelDashboard {
  if (!globalDashboard) {
    globalDashboard = new ModelDashboard();
  }
  return globalDashboard;
}
