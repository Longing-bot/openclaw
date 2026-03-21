/**
 * OpenClaw 模型切换管理器
 * 
 * 智能模型切换：
 * 1. 根据任务类型选择模型
 * 2. 根据性能选择模型
 * 3. 根据成本选择模型
 * 4. 自动故障转移
 */

export interface ModelSwitchRule {
  taskType: string;
  preferredModel: string;
  fallbackModels: string[];
  maxCost?: number;
  maxLatency?: number;
}

export class ModelSwitchManager {
  private rules: Map<string, ModelSwitchRule> = new Map();
  private currentModel: string = 'gpt-4.1-mini';
  private switchHistory: Array<{ from: string; to: string; reason: string; timestamp: Date }> = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * 初始化默认规则
   */
  private initializeDefaultRules(): void {
    // 简单任务 - 使用快速便宜的模型
    this.addRule({
      taskType: 'simple',
      preferredModel: 'gpt-4.1-nano',
      fallbackModels: ['gpt-4.1-mini', 'claude-haiku-3-5'],
      maxCost: 0.001,
      maxLatency: 1000,
    });

    // 复杂任务 - 使用强大的模型
    this.addRule({
      taskType: 'complex',
      preferredModel: 'gpt-4.1',
      fallbackModels: ['claude-opus-4', 'gemini-2.0-pro'],
      maxCost: 0.1,
      maxLatency: 10000,
    });

    // 代码任务 - 使用代码专用模型
    this.addRule({
      taskType: 'code',
      preferredModel: 'deepseek-coder',
      fallbackModels: ['gpt-4.1', 'claude-sonnet-4'],
      maxCost: 0.05,
      maxLatency: 5000,
    });

    // 推理任务 - 使用推理模型
    this.addRule({
      taskType: 'reasoning',
      preferredModel: 'o3-mini',
      fallbackModels: ['deepseek-reasoner', 'gpt-4.1'],
      maxCost: 0.1,
      maxLatency: 15000,
    });

    // 创意任务 - 使用创意模型
    this.addRule({
      taskType: 'creative',
      preferredModel: 'claude-opus-4',
      fallbackModels: ['gpt-4.1', 'gemini-2.0-pro'],
      maxCost: 0.1,
      maxLatency: 10000,
    });

    console.log('[ModelSwitch] 初始化完成');
  }

  /**
   * 添加规则
   */
  addRule(rule: ModelSwitchRule): void {
    this.rules.set(rule.taskType, rule);
  }

  /**
   * 根据任务类型选择模型
   */
  selectModel(taskType: string): string {
    const rule = this.rules.get(taskType);
    if (!rule) {
      return this.currentModel;
    }

    return rule.preferredModel;
  }

  /**
   * 切换模型
   */
  switchModel(to: string, reason: string): void {
    const from = this.currentModel;
    this.currentModel = to;

    this.switchHistory.push({
      from,
      to,
      reason,
      timestamp: new Date(),
    });

    // 限制历史
    if (this.switchHistory.length > 100) {
      this.switchHistory.shift();
    }

    console.log(`[ModelSwitch] 切换模型: ${from} -> ${to} (${reason})`);
  }

  /**
   * 故障转移
   */
  fallback(taskType: string, error: string): string {
    const rule = this.rules.get(taskType);
    if (!rule) {
      return this.currentModel;
    }

    // 尝试故障转移模型
    for (const fallback of rule.fallbackModels) {
      if (fallback !== this.currentModel) {
        this.switchModel(fallback, `故障转移: ${error}`);
        return fallback;
      }
    }

    return this.currentModel;
  }

  /**
   * 获取当前模型
   */
  getCurrentModel(): string {
    return this.currentModel;
  }

  /**
   * 获取切换历史
   */
  getSwitchHistory(count: number = 10): Array<{ from: string; to: string; reason: string; timestamp: Date }> {
    return this.switchHistory.slice(-count);
  }

  /**
   * 获取统计
   */
  getStats(): { ruleCount: number; switchCount: number; currentModel: string } {
    return {
      ruleCount: this.rules.size,
      switchCount: this.switchHistory.length,
      currentModel: this.currentModel,
    };
  }
}

let globalModelSwitchManager: ModelSwitchManager | null = null;

export function getGlobalModelSwitchManager(): ModelSwitchManager {
  if (!globalModelSwitchManager) {
    globalModelSwitchManager = new ModelSwitchManager();
  }
  return globalModelSwitchManager;
}
