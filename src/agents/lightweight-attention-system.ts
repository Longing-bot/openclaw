/**
 * OpenClaw 轻量级注意力系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的注意力机制
 * 2. 快速焦点切换
 * 3. 低计算开销
 */

export interface Focus {
  id: string;
  target: string;
  priority: number;
  startTime: Date;
  duration: number; // ms
}

export class LightweightAttentionSystem {
  private currentFocus: Focus | null = null;
  private focusHistory: Focus[] = [];
  private maxHistory: number = 100;

  constructor() {
    console.log('[AttentionSystem] 初始化完成');
  }

  /**
   * 设置焦点
   */
  setFocus(target: string, priority: number, duration: number = 5000): void {
    // 结束当前焦点
    if (this.currentFocus) {
      this.focusHistory.push({
        ...this.currentFocus,
        duration: Date.now() - this.currentFocus.startTime.getTime(),
      });

      // 限制历史
      if (this.focusHistory.length > this.maxHistory) {
        this.focusHistory = this.focusHistory.slice(-this.maxHistory);
      }
    }

    // 设置新焦点
    this.currentFocus = {
      id: `focus_${Date.now()}`,
      target,
      priority,
      startTime: new Date(),
      duration,
    };

    console.log(`[AttentionSystem] 焦点切换: ${target}`);
  }

  /**
   * 获取当前焦点
   */
  getCurrentFocus(): Focus | null {
    return this.currentFocus;
  }

  /**
   * 检查是否需要切换焦点
   */
  shouldSwitchFocus(newPriority: number): boolean {
    if (!this.currentFocus) return true;
    return newPriority > this.currentFocus.priority;
  }

  /**
   * 获取焦点历史
   */
  getFocusHistory(count: number = 10): Focus[] {
    return this.focusHistory.slice(-count);
  }

  /**
   * 获取统计
   */
  getStats(): { currentFocus: string | null; historyCount: number } {
    return {
      currentFocus: this.currentFocus?.target || null,
      historyCount: this.focusHistory.length,
    };
  }
}

let globalAttentionSystem: LightweightAttentionSystem | null = null;

export function getGlobalAttentionSystem(): LightweightAttentionSystem {
  if (!globalAttentionSystem) {
    globalAttentionSystem = new LightweightAttentionSystem();
  }
  return globalAttentionSystem;
}
