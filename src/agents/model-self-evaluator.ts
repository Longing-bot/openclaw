/**
 * OpenClaw 模型自我评估器
 * 
 * 评估模型自身能力：
 * 1. 准确性评估
 * 2. 速度评估
 * 3. 成本评估
 */

export interface SelfEvaluation {
  accuracy: number;
  speed: number;
  cost: number;
  overall: number;
}

export class ModelSelfEvaluator {
  constructor() {
    console.log('[SelfEvaluator] 初始化完成');
  }

  /**
   * 评估自身
   */
  evaluate(
    correctAnswers: number,
    totalAnswers: number,
    avgResponseTime: number,
    totalCost: number
  ): SelfEvaluation {
    const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
    const speed = Math.max(0, 100 - avgResponseTime / 100);
    const cost = Math.max(0, 100 - totalCost * 10);
    const overall = (accuracy + speed + cost) / 3;

    return {
      accuracy,
      speed,
      cost,
      overall,
    };
  }

  /**
   * 生成改进建议
   */
  generateSuggestions(evaluation: SelfEvaluation): string[] {
    const suggestions: string[] = [];

    if (evaluation.accuracy < 80) {
      suggestions.push('提高准确性：使用更强大的模型');
    }

    if (evaluation.speed < 50) {
      suggestions.push('提高速度：使用更快的模型或优化提示词');
    }

    if (evaluation.cost > 50) {
      suggestions.push('降低成本：使用更便宜的模型或压缩上下文');
    }

    return suggestions;
  }

  /**
   * 生成报告
   */
  generateReport(evaluation: SelfEvaluation): string {
    const suggestions = this.generateSuggestions(evaluation);

    return `
# 模型自我评估报告

## 评分
- 准确性: ${evaluation.accuracy.toFixed(1)}/100
- 速度: ${evaluation.speed.toFixed(1)}/100
- 成本: ${evaluation.cost.toFixed(1)}/100
- 综合: ${evaluation.overall.toFixed(1)}/100

## 改进建议
${suggestions.map(s => `- ${s}`).join('\n')}
    `.trim();
  }
}

let globalSelfEvaluator: ModelSelfEvaluator | null = null;

export function getGlobalSelfEvaluator(): ModelSelfEvaluator {
  if (!globalSelfEvaluator) {
    globalSelfEvaluator = new ModelSelfEvaluator();
  }
  return globalSelfEvaluator;
}
