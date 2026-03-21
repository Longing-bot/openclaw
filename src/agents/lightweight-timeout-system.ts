/**
 * OpenClaw 轻量级超时系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的超时控制
 * 2. 快速超时检测
 * 3. 低计算开销
 */

export class LightweightTimeoutSystem {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    console.log('[TimeoutSystem] 初始化完成');
  }

  /**
   * 设置超时
   */
  set(id: string, callback: () => void, delay: number): void {
    // 清除现有超时
    this.clear(id);

    const timeout = setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, delay);

    this.timeouts.set(id, timeout);
  }

  /**
   * 清除超时
   */
  clear(id: string): void {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
  }

  /**
   * 检查是否存在
   */
  has(id: string): boolean {
    return this.timeouts.has(id);
  }

  /**
   * 清除所有
   */
  clearAll(): void {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }

  /**
   * 获取统计
   */
  getStats(): { activeTimeouts: number } {
    return { activeTimeouts: this.timeouts.size };
  }
}

let globalTimeoutSystem: LightweightTimeoutSystem | null = null;

export function getGlobalTimeoutSystem(): LightweightTimeoutSystem {
  if (!globalTimeoutSystem) {
    globalTimeoutSystem = new LightweightTimeoutSystem();
  }
  return globalTimeoutSystem;
}
