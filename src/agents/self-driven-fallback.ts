/**
 * OpenClaw 自我驱动模型故障转移增强
 * 
 * 在 model-fallback 基础上添加：
 * 1. 从故障转移中学习
 * 2. 自动优化故障转移策略
 * 3. 预测性故障转移
 */

import type { ClawdbotConfig } from "../config/config.js";
import { runWithModelFallback } from "./model-fallback.js";
import { getGlobalSelfDrivenOptimizer } from "./self-driven-optimizer.js";

// ==================== 类型定义 ====================

export interface FallbackLearning {
  id: string;
  timestamp: Date;
  provider: string;
  model: string;
  error: string;
  reason?: string;
  status?: number;
  code?: string;
  resolvedBy: string;
  resolvedModel: string;
  duration: number;
}

export interface PredictiveFallback {
  provider: string;
  model: string;
  confidence: number; // 0-1
  reason: string;
}

// ==================== 自我驱动模型故障转移 ====================

export class SelfDrivenModelFallback {
  private learningHistory: FallbackLearning[] = [];
  private predictiveCache: Map<string, PredictiveFallback> = new Map();
  private lastAnalysis: Date = new Date();

  constructor() {
    this.startLearningCycle();
  }

  /**
   * 启动学习循环
   */
  private startLearningCycle(): void {
    setInterval(() => {
      this.analyzeAndOptimize();
    }, 10 * 60 * 1000); // 每10分钟分析一次
  }

  /**
   * 增强的模型故障转移
   */
  async runWithEnhancedFallback<T>(params: {
    cfg: ClawdbotConfig | undefined;
    provider: string;
    model: string;
    fallbacksOverride?: string[];
    run: (provider: string, model: string) => Promise<T>;
  }): Promise<{
    result: T;
    provider: string;
    model: string;
    attempts: Array<{
      provider: string;
      model: string;
      error: string;
      reason?: string;
      status?: number;
      code?: string;
    }>;
  }> {
    const startTime = Date.now();

    // 1. 检查预测性缓存
    const predicted = this.getPredictiveFallback(params.provider, params.model);
    if (predicted && predicted.confidence > 0.8) {
      console.log(`[SelfDrivenFallback] 使用预测性故障转移: ${predicted.provider}/${predicted.model}`);
    }

    // 2. 使用标准故障转移
    const result = await runWithModelFallback({
      cfg: params.cfg,
      provider: params.provider,
      model: params.model,
      fallbacksOverride: params.fallbacksOverride,
      run: params.run,
      onError: async (attempt) => {
        // 记录学习经验
        this.recordLearning({
          provider: attempt.provider,
          model: attempt.model,
          error: attempt.error instanceof Error ? attempt.error.message : String(attempt.error),
          reason: attempt.error instanceof Error ? attempt.error.name : undefined,
          duration: Date.now() - startTime,
        });
      },
    });

    // 3. 记录成功的故障转移
    if (result.attempts.length > 0) {
      const lastAttempt = result.attempts[result.attempts.length - 1];
      if (lastAttempt) {
        this.recordSuccess({
          provider: params.provider,
          model: params.model,
          resolvedBy: result.provider,
          resolvedModel: result.model,
          duration: Date.now() - startTime,
        });
      }
    }

    return result;
  }

  /**
   * 记录学习经验
   */
  private recordLearning(data: {
    provider: string;
    model: string;
    error: string;
    reason?: string;
    status?: number;
    code?: string;
    duration: number;
  }): void {
    const learning: FallbackLearning = {
      id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...data,
      resolvedBy: "",
      resolvedModel: "",
    };

    this.learningHistory.push(learning);

    // 限制历史记录
    if (this.learningHistory.length > 1000) {
      this.learningHistory = this.learningHistory.slice(-1000);
    }

    // 更新自我驱动优化器
    const optimizer = getGlobalSelfDrivenOptimizer();
    optimizer.recordExperience({
      context: `模型故障转移: ${data.provider}/${data.model}`,
      action: '故障转移',
      result: '失败',
      success: false,
      duration: data.duration,
      tags: ['model', 'fallback', 'error'],
    });
  }

  /**
   * 记录成功的故障转移
   */
  private recordSuccess(data: {
    provider: string;
    model: string;
    resolvedBy: string;
    resolvedModel: string;
    duration: number;
  }): void {
    // 更新学习历史
    const lastLearning = this.learningHistory[this.learningHistory.length - 1];
    if (lastLearning && lastLearning.provider === data.provider && lastLearning.model === data.model) {
      lastLearning.resolvedBy = data.resolvedBy;
      lastLearning.resolvedModel = data.resolvedModel;
    }

    // 更新预测性缓存
    this.updatePredictiveCache(data);

    // 更新自我驱动优化器
    const optimizer = getGlobalSelfDrivenOptimizer();
    optimizer.recordExperience({
      context: `模型故障转移: ${data.provider}/${data.model}`,
      action: '故障转移成功',
      result: `使用 ${data.resolvedBy}/${data.resolvedModel}`,
      success: true,
      duration: data.duration,
      tags: ['model', 'fallback', 'success'],
    });
  }

  /**
   * 更新预测性缓存
   */
  private updatePredictiveCache(data: {
    provider: string;
    model: string;
    resolvedBy: string;
    resolvedModel: string;
  }): void {
    const key = `${data.provider}/${data.model}`;
    const existing = this.predictiveCache.get(key);

    if (existing) {
      // 增加置信度
      existing.confidence = Math.min(1, existing.confidence + 0.1);
      existing.reason = `基于 ${this.learningHistory.length} 次学习`;
    } else {
      // 创建新的预测
      this.predictiveCache.set(key, {
        provider: data.resolvedBy,
        model: data.resolvedModel,
        confidence: 0.5,
        reason: '基于首次成功故障转移',
      });
    }
  }

  /**
   * 获取预测性故障转移
   */
  private getPredictiveFallback(provider: string, model: string): PredictiveFallback | undefined {
    const key = `${provider}/${model}`;
    return this.predictiveCache.get(key);
  }

  /**
   * 分析和优化
   */
  private analyzeAndOptimize(): void {
    console.log('[SelfDrivenFallback] 开始分析和优化...');

    // 1. 分析故障转移模式
    this.analyzeFallbackPatterns();

    // 2. 更新预测性缓存
    this.updatePredictiveCacheFromHistory();

    // 3. 生成优化建议
    this.generateOptimizationSuggestions();

    this.lastAnalysis = new Date();
    console.log('[SelfDrivenFallback] 分析和优化完成');
  }

  /**
   * 分析故障转移模式
   */
  private analyzeFallbackPatterns(): void {
    const recentLearning = this.learningHistory.slice(-100);

    // 分析错误类型
    const errorTypes = new Map<string, number>();
    for (const learning of recentLearning) {
      const errorType = learning.reason || 'unknown';
      errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);
    }

    // 分析最常失败的模型
    const failedModels = new Map<string, number>();
    for (const learning of recentLearning) {
      const key = `${learning.provider}/${learning.model}`;
      failedModels.set(key, (failedModels.get(key) || 0) + 1);
    }

    console.log(`[SelfDrivenFallback] 错误类型: ${JSON.stringify(Object.fromEntries(errorTypes))}`);
    console.log(`[SelfDrivenFallback] 失败模型: ${JSON.stringify(Object.fromEntries(failedModels))}`);
  }

  /**
   * 从历史更新预测性缓存
   */
  private updatePredictiveCacheFromHistory(): void {
    const recentLearning = this.learningHistory.slice(-100);
    const successfulFallbacks = recentLearning.filter(l => l.resolvedBy);

    for (const learning of successfulFallbacks) {
      const key = `${learning.provider}/${learning.model}`;
      const existing = this.predictiveCache.get(key);

      if (existing) {
        // 更新置信度
        const successCount = successfulFallbacks.filter(
          l => l.provider === learning.provider && l.model === learning.model
        ).length;
        existing.confidence = Math.min(1, successCount / 10);
      }
    }
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(): void {
    const recentLearning = this.learningHistory.slice(-100);
    const suggestions: string[] = [];

    // 分析最常失败的模型
    const failedModels = new Map<string, number>();
    for (const learning of recentLearning) {
      const key = `${learning.provider}/${learning.model}`;
      failedModels.set(key, (failedModels.get(key) || 0) + 1);
    }

    // 生成建议
    for (const [model, count] of failedModels) {
      if (count > 5) {
        suggestions.push(`模型 ${model} 失败次数较多 (${count} 次)，建议检查配置`);
      }
    }

    if (suggestions.length > 0) {
      console.log(`[SelfDrivenFallback] 优化建议: ${suggestions.join('; ')}`);
    }
  }

  /**
   * 获取状态
   */
  getStatus(): {
    learningHistory: number;
    predictiveCache: number;
    lastAnalysis: Date;
  } {
    return {
      learningHistory: this.learningHistory.length,
      predictiveCache: this.predictiveCache.size,
      lastAnalysis: this.lastAnalysis,
    };
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    const status = this.getStatus();
    const recentLearning = this.learningHistory.slice(-10);

    return `
# OpenClaw 自我驱动模型故障转移报告

## 状态
- 学习历史: ${status.learningHistory} 条记录
- 预测缓存: ${status.predictiveCache} 个条目
- 最后分析: ${status.lastAnalysis.toLocaleString()}

## 最近学习记录
${recentLearning.map(l => `- ${l.provider}/${l.model} -> ${l.resolvedBy}/${l.resolvedModel}`).join('\n')}

## 预测性故障转移
${Array.from(this.predictiveCache.entries()).map(([key, value]) => 
  `- ${key} -> ${value.provider}/${value.model} (置信度: ${(value.confidence * 100).toFixed(1)}%)`
).join('\n')}
    `.trim();
  }
}

// ==================== 全局实例 ====================

let globalSelfDrivenFallback: SelfDrivenModelFallback | null = null;

export function getGlobalSelfDrivenFallback(): SelfDrivenModelFallback {
  if (!globalSelfDrivenFallback) {
    globalSelfDrivenFallback = new SelfDrivenModelFallback();
  }
  return globalSelfDrivenFallback;
}

export function resetGlobalSelfDrivenFallback(): void {
  globalSelfDrivenFallback = null;
}
