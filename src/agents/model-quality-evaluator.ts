/**
 * OpenClaw 模型质量评估器
 * 
 * 评估模型输出质量：
 * 1. 准确性评估
 * 2. 完整性评估
 * 3. 相关性评估
 * 4. 流畅性评估
 */

export interface QualityMetrics {
  accuracy: number;    // 准确性 0-100
  completeness: number; // 完整性 0-100
  relevance: number;   // 相关性 0-100
  fluency: number;     // 流畅性 0-100
  overall: number;     // 综合评分 0-100
}

export class ModelQualityEvaluator {
  constructor() {
    console.log('[QualityEvaluator] 初始化完成');
  }

  /**
   * 评估响应质量
   */
  evaluate(
    input: string,
    response: string,
    expected?: string
  ): QualityMetrics {
    const accuracy = this.evaluateAccuracy(response, expected);
    const completeness = this.evaluateCompleteness(input, response);
    const relevance = this.evaluateRelevance(input, response);
    const fluency = this.evaluateFluency(response);

    const overall = (accuracy + completeness + relevance + fluency) / 4;

    return {
      accuracy,
      completeness,
      relevance,
      fluency,
      overall,
    };
  }

  /**
   * 评估准确性
   */
  private evaluateAccuracy(response: string, expected?: string): number {
    if (!expected) return 80; // 默认分数

    // 简单相似度计算
    const similarity = this.calculateSimilarity(response, expected);
    return Math.round(similarity * 100);
  }

  /**
   * 评估完整性
   */
  private evaluateCompleteness(input: string, response: string): number {
    // 检查响应长度是否合理
    const inputLength = input.length;
    const responseLength = response.length;

    if (responseLength < 10) return 30;
    if (responseLength < inputLength * 0.5) return 50;
    if (responseLength < inputLength) return 70;
    return 90;
  }

  /**
   * 评估相关性
   */
  private evaluateRelevance(input: string, response: string): number {
    // 提取关键词
    const inputKeywords = this.extractKeywords(input);
    const responseKeywords = this.extractKeywords(response);

    // 计算重叠度
    const overlap = inputKeywords.filter(k => responseKeywords.includes(k));
    const relevance = overlap.length / Math.max(inputKeywords.length, 1);

    return Math.round(relevance * 100);
  }

  /**
   * 评估流畅性
   */
  private evaluateFluency(response: string): number {
    // 检查流畅性指标
    let score = 80;

    // 检查是否有乱码
    if (/[^\w\s\u4e00-\u9fa5]/.test(response)) {
      score -= 10;
    }

    // 检查是否有重复
    const words = response.split(/\s+/);
    const uniqueWords = new Set(words);
    if (uniqueWords.size < words.length * 0.5) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(a: string, b: string): number {
    // 简单实现
    const aWords = new Set(a.split(/\s+/));
    const bWords = new Set(b.split(/\s+/));

    const intersection = new Set([...aWords].filter(x => bWords.has(x)));
    const union = new Set([...aWords, ...bWords]);

    return intersection.size / union.size;
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单实现
    return text.split(/\s+/).filter(w => w.length > 2).slice(0, 10);
  }

  /**
   * 生成报告
   */
  generateReport(metrics: QualityMetrics): string {
    return `
# 质量评估报告

## 评分
- 准确性: ${metrics.accuracy}/100
- 完整性: ${metrics.completeness}/100
- 相关性: ${metrics.relevance}/100
- 流畅性: ${metrics.fluency}/100
- 综合评分: ${metrics.overall}/100

## 评价
${this.getEvaluation(metrics.overall)}
    `.trim();
  }

  /**
   * 获取评价
   */
  private getEvaluation(score: number): string {
    if (score >= 90) return '优秀 - 质量很高';
    if (score >= 80) return '良好 - 质量不错';
    if (score >= 70) return '一般 - 质量尚可';
    if (score >= 60) return '较差 - 需要改进';
    return '很差 - 需要重新生成';
  }
}

let globalQualityEvaluator: ModelQualityEvaluator | null = null;

export function getGlobalQualityEvaluator(): ModelQualityEvaluator {
  if (!globalQualityEvaluator) {
    globalQualityEvaluator = new ModelQualityEvaluator();
  }
  return globalQualityEvaluator;
}
