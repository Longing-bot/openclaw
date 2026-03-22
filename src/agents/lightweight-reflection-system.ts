/**
 * OpenClaw 轻量级反思系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的反思逻辑
 * 2. 快速学习提取
 * 3. 低计算开销
 */

export interface Reflection {
  id: string;
  timestamp: Date;
  context: string;
  observation: string;
  insight: string;
  action: string;
}

export class LightweightReflectionSystem {
  private reflections: Reflection[] = [];

  constructor() {
    console.log('[ReflectionSystem] 初始化完成');
  }

  /**
   * 反思
   */
  reflect(context: string, observation: string): Reflection {
    const id = `reflection_${Date.now()}`;
    const reflection: Reflection = {
      id,
      timestamp: new Date(),
      context,
      observation,
      insight: this.extractInsight(observation),
      action: this.suggestAction(observation),
    };

    this.reflections.push(reflection);

    // 限制数量
    if (this.reflections.length > 100) {
      this.reflections = this.reflections.slice(-100);
    }

    return reflection;
  }

  /**
   * 提取洞察
   */
  private extractInsight(observation: string): string {
    // 简化实现
    if (observation.includes('失败')) {
      return '需要改进方法';
    }
    if (observation.includes('成功')) {
      return '方法有效';
    }
    return '继续观察';
  }

  /**
   * 建议行动
   */
  private suggestAction(observation: string): string {
    // 简化实现
    if (observation.includes('失败')) {
      return '调整策略';
    }
    if (observation.includes('成功')) {
      return '保持方法';
    }
    return '收集更多信息';
  }

  /**
   * 获取最近反思
   */
  getRecentReflections(count: number = 5): Reflection[] {
    return this.reflections.slice(-count);
  }

  /**
   * 获取统计
   */
  getStats(): { reflectionCount: number } {
    return { reflectionCount: this.reflections.length };
  }
}

let globalReflectionSystem: LightweightReflectionSystem | null = null;

export function getGlobalReflectionSystem(): LightweightReflectionSystem {
  if (!globalReflectionSystem) {
    globalReflectionSystem = new LightweightReflectionSystem();
  }
  return globalReflectionSystem;
}
