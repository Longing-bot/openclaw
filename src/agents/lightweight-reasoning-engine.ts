/**
 * OpenClaw 轻量级推理引擎
 * 
 * 专为小参数模型优化：
 * 1. 简化的推理逻辑
 * 2. 快速决策
 * 3. 低计算开销
 */

export interface Rule {
  condition: (context: any) => boolean;
  action: (context: any) => any;
  priority: number;
}

export class LightweightReasoningEngine {
  private rules: Rule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * 初始化默认规则
   */
  private initializeDefaultRules(): void {
    // 简单规则
    this.addRule({
      condition: (ctx) => ctx.type === 'question',
      action: (ctx) => ({ response: '搜索答案' }),
      priority: 1,
    });

    this.addRule({
      condition: (ctx) => ctx.type === 'command',
      action: (ctx) => ({ response: '执行命令' }),
      priority: 2,
    });

    console.log('[ReasoningEngine] 初始化完成');
  }

  /**
   * 添加规则
   */
  addRule(rule: Rule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 推理
   */
  reason(context: any): any {
    for (const rule of this.rules) {
      if (rule.condition(context)) {
        return rule.action(context);
      }
    }
    return { response: '无法处理' };
  }

  /**
   * 获取统计
   */
  getStats(): { ruleCount: number } {
    return { ruleCount: this.rules.length };
  }
}

let globalReasoningEngine: LightweightReasoningEngine | null = null;

export function getGlobalReasoningEngine(): LightweightReasoningEngine {
  if (!globalReasoningEngine) {
    globalReasoningEngine = new LightweightReasoningEngine();
  }
  return globalReasoningEngine;
}
