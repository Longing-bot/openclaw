/**
 * OpenClaw 轻量级决策系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的决策树
 * 2. 快速决策
 * 3. 低计算开销
 */

export interface Decision {
  id: string;
  context: string;
  options: string[];
  selected: string;
  reason: string;
  timestamp: Date;
}

export class LightweightDecisionSystem {
  private decisions: Decision[] = [];

  constructor() {
    console.log('[DecisionSystem] 初始化完成');
  }

  /**
   * 做决策
   */
  decide(context: string, options: string[]): Decision {
    // 简单决策：选择第一个
    const selected = options[0] || '无选项';

    const decision: Decision = {
      id: `decision_${Date.now()}`,
      context,
      options,
      selected,
      reason: '默认选择',
      timestamp: new Date(),
    };

    this.decisions.push(decision);

    // 限制数量
    if (this.decisions.length > 100) {
      this.decisions = this.decisions.slice(-100);
    }

    return decision;
  }

  /**
   * 评估选项
   */
  evaluateOptions(options: string[], criteria: Record<string, number>): string[] {
    // 简化评分
    return options.sort((a, b) => {
      const scoreA = criteria[a] || 0;
      const scoreB = criteria[b] || 0;
      return scoreB - scoreA;
    });
  }

  /**
   * 获取最近决策
   */
  getRecentDecisions(count: number = 5): Decision[] {
    return this.decisions.slice(-count);
  }

  /**
   * 获取统计
   */
  getStats(): { decisionCount: number } {
    return { decisionCount: this.decisions.length };
  }
}

let globalDecisionSystem: LightweightDecisionSystem | null = null;

export function getGlobalDecisionSystem(): LightweightDecisionSystem {
  if (!globalDecisionSystem) {
    globalDecisionSystem = new LightweightDecisionSystem();
  }
  return globalDecisionSystem;
}
