/**
 * OpenClaw 轻量级健康检查器
 * 
 * 专为小参数模型优化：
 * 1. 简化的健康检查
 * 2. 快速状态检测
 * 3. 低计算开销
 */

export interface HealthStatus {
  healthy: boolean;
  checks: Array<{ name: string; status: boolean; message?: string }>;
  timestamp: Date;
}

export class LightweightHealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map();

  constructor() {
    console.log('[HealthChecker] 初始化完成');
  }

  /**
   * 添加检查
   */
  addCheck(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  /**
   * 执行健康检查
   */
  async check(): Promise<HealthStatus> {
    const results: Array<{ name: string; status: boolean; message?: string }> = [];
    let allHealthy = true;

    for (const [name, check] of this.checks) {
      try {
        const status = await check();
        results.push({ name, status });
        if (!status) allHealthy = false;
      } catch (error) {
        results.push({
          name,
          status: false,
          message: error instanceof Error ? error.message : String(error),
        });
        allHealthy = false;
      }
    }

    return {
      healthy: allHealthy,
      checks: results,
      timestamp: new Date(),
    };
  }

  /**
   * 获取检查数量
   */
  getCheckCount(): number {
    return this.checks.size;
  }
}

let globalHealthChecker: LightweightHealthChecker | null = null;

export function getGlobalHealthChecker(): LightweightHealthChecker {
  if (!globalHealthChecker) {
    globalHealthChecker = new LightweightHealthChecker();
  }
  return globalHealthChecker;
}
