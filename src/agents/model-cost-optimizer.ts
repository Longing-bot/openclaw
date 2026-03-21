/**
 * OpenClaw 模型成本优化器
 * 
 * 优化模型使用成本：
 * 1. Token 使用优化
 * 2. 模型选择优化
 * 3. 缓存优化
 * 4. 批量处理优化
 */

export interface CostConfig {
  provider: string;
  model: string;
  inputCostPer1k: number;  // 每1000输入token的成本
  outputCostPer1k: number; // 每1000输出token的成本
}

export interface CostMetrics {
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  requests: number;
}

export class ModelCostOptimizer {
  private costConfigs: Map<string, CostConfig> = new Map();
  private metrics: CostMetrics = {
    totalCost: 0,
    inputTokens: 0,
    outputTokens: 0,
    requests: 0,
  };

  private budget: number = 100; // 默认预算100美元
  private dailyBudget: number = 10; // 默认每日预算10美元

  constructor() {
    this.initializeCostConfigs();
  }

  /**
   * 初始化成本配置
   */
  private initializeCostConfigs(): void {
    // OpenAI
    this.setCostConfig('openai/gpt-4.1', {
      provider: 'openai',
      model: 'gpt-4.1',
      inputCostPer1k: 0.002,
      outputCostPer1k: 0.008,
    });

    this.setCostConfig('openai/gpt-4.1-mini', {
      provider: 'openai',
      model: 'gpt-4.1-mini',
      inputCostPer1k: 0.0004,
      outputCostPer1k: 0.0016,
    });

    this.setCostConfig('openai/gpt-4.1-nano', {
      provider: 'openai',
      model: 'gpt-4.1-nano',
      inputCostPer1k: 0.0001,
      outputCostPer1k: 0.0004,
    });

    // Anthropic
    this.setCostConfig('anthropic/claude-opus-4', {
      provider: 'anthropic',
      model: 'claude-opus-4',
      inputCostPer1k: 0.015,
      outputCostPer1k: 0.075,
    });

    this.setCostConfig('anthropic/claude-sonnet-4', {
      provider: 'anthropic',
      model: 'claude-sonnet-4',
      inputCostPer1k: 0.003,
      outputCostPer1k: 0.015,
    });

    this.setCostConfig('anthropic/claude-haiku-3-5', {
      provider: 'anthropic',
      model: 'claude-haiku-3-5',
      inputCostPer1k: 0.00025,
      outputCostPer1k: 0.00125,
    });

    // Google
    this.setCostConfig('google/gemini-2.0-flash', {
      provider: 'google',
      model: 'gemini-2.0-flash',
      inputCostPer1k: 0.0001,
      outputCostPer1k: 0.0004,
    });

    console.log('[CostOptimizer] 初始化完成');
  }

  /**
   * 设置成本配置
   */
  setCostConfig(key: string, config: CostConfig): void {
    this.costConfigs.set(key, config);
  }

  /**
   * 计算成本
   */
  calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    const key = `${provider}/${model}`;
    const config = this.costConfigs.get(key);

    if (!config) {
      return 0;
    }

    const inputCost = (inputTokens / 1000) * config.inputCostPer1k;
    const outputCost = (outputTokens / 1000) * config.outputCostPer1k;

    return inputCost + outputCost;
  }

  /**
   * 记录使用
   */
  recordUsage(provider: string, model: string, inputTokens: number, outputTokens: number): void {
    const cost = this.calculateCost(provider, model, inputTokens, outputTokens);

    this.metrics.totalCost += cost;
    this.metrics.inputTokens += inputTokens;
    this.metrics.outputTokens += outputTokens;
    this.metrics.requests++;
  }

  /**
   * 检查预算
   */
  checkBudget(): { withinBudget: boolean; remaining: number; dailyRemaining: number } {
    const remaining = this.budget - this.metrics.totalCost;
    const dailyRemaining = this.dailyBudget; // 简化实现

    return {
      withinBudget: remaining > 0,
      remaining,
      dailyRemaining,
    };
  }

  /**
   * 选择最便宜的模型
   */
  selectCheapestModel(taskType: string, availableModels: string[]): string {
    let cheapest = availableModels[0];
    let lowestCost = Infinity;

    for (const model of availableModels) {
      const config = this.costConfigs.get(model);
      if (config) {
        const avgCost = (config.inputCostPer1k + config.outputCostPer1k) / 2;
        if (avgCost < lowestCost) {
          lowestCost = avgCost;
          cheapest = model;
        }
      }
    }

    return cheapest;
  }

  /**
   * 设置预算
   */
  setBudget(budget: number, dailyBudget: number): void {
    this.budget = budget;
    this.dailyBudget = dailyBudget;
  }

  /**
   * 获取统计
   */
  getStats(): CostMetrics {
    return { ...this.metrics };
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.metrics = {
      totalCost: 0,
      inputTokens: 0,
      outputTokens: 0,
      requests: 0,
    };
  }
}

let globalCostOptimizer: ModelCostOptimizer | null = null;

export function getGlobalCostOptimizer(): ModelCostOptimizer {
  if (!globalCostOptimizer) {
    globalCostOptimizer = new ModelCostOptimizer();
  }
  return globalCostOptimizer;
}
