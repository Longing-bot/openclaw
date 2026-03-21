/**
 * OpenClaw 模型管理系统统一入口
 * 
 * 整合所有模型相关系统：
 * 1. 通用模型适配器
 * 2. 模型能力增强器
 * 3. 模型性能优化器
 * 4. 模型切换管理器
 * 5. 模型成本优化器
 * 6. 模型路由器
 * 7. 模型质量评估器
 * 8. 模型并行执行器
 * 9. 模型负载均衡器
 * 10. 模型流式处理器
 * 11. 模型缓存管理器
 * 12. 模型批处理器
 */

// 导出所有模型相关系统
export { getGlobalUniversalModel, UniversalModelAdapter } from './universal-model-adapter';
export { getGlobalCapabilityEnhancer, ModelCapabilityEnhancer } from './model-capability-enhancer';
export { getGlobalPerformanceOptimizer, ModelPerformanceOptimizer } from './model-performance-optimizer';
export { getGlobalModelSwitchManager, ModelSwitchManager } from './model-switch-manager';
export { getGlobalCostOptimizer, ModelCostOptimizer } from './model-cost-optimizer';
export { getGlobalModelRouter, ModelRouter } from './model-router';
export { getGlobalQualityEvaluator, ModelQualityEvaluator } from './model-quality-evaluator';
export { getGlobalParallelExecutor, ModelParallelExecutor } from './model-parallel-executor';
export { getGlobalLoadBalancer, ModelLoadBalancer } from './model-load-balancer';
export { getGlobalStreamProcessor, ModelStreamProcessor } from './model-stream-processor';
export { getGlobalCacheManager, ModelCacheManager } from './model-cache-manager';
export { getGlobalBatchProcessor, ModelBatchProcessor } from './model-batch-processor';

// ==================== 统一管理器 ====================

export class ModelSystemManager {
  constructor() {
    console.log('[ModelSystem] 模型系统管理器初始化完成');
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): Record<string, any> {
    return {
      universalModel: require('./universal-model-adapter').getGlobalUniversalModel().getStats(),
      capabilityEnhancer: require('./model-capability-enhancer').getGlobalCapabilityEnhancer().getConfig(),
      performanceOptimizer: require('./model-performance-optimizer').getGlobalPerformanceOptimizer().getStats(),
      modelSwitch: require('./model-switch-manager').getGlobalModelSwitchManager().getStats(),
      costOptimizer: require('./model-cost-optimizer').getGlobalCostOptimizer().getStats(),
      router: require('./model-router').getGlobalModelRouter().getStats(),
      qualityEvaluator: 'initialized',
      parallelExecutor: require('./model-parallel-executor').getGlobalParallelExecutor().getStats(),
      loadBalancer: require('./model-load-balancer').getGlobalLoadBalancer().getStats(),
      streamProcessor: 'initialized',
      cacheManager: require('./model-cache-manager').getGlobalCacheManager().getStats(),
      batchProcessor: 'initialized',
    };
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    const status = this.getSystemStatus();

    return `
# 模型管理系统报告

## 系统状态
${Object.entries(status).map(([name, stat]) => `- ${name}: ${JSON.stringify(stat)}`).join('\n')}

## 支持的模型
- OpenAI: GPT-4.1, GPT-4.1-mini, GPT-4.1-nano, o3-mini
- Anthropic: Claude Opus 4, Sonnet 4, Haiku 3.5
- Google: Gemini 2.0 Flash, Gemini 2.0 Pro
- 小米: MiMo V2 Pro, MiMo V2 Flash
- DeepSeek: DeepSeek Chat, DeepSeek Coder
- 阿里: Qwen Max, Qwen Plus
- 月之暗面: Moonshot V1
- 智谱: GLM-4 Plus

## 核心特性
- 统一接口，不同模型
- 自动适配，智能优化
- 无缝切换，保持一致
- 专为小参数模型优化
    `.trim();
  }
}

// ==================== 全局实例 ====================

let globalModelSystemManager: ModelSystemManager | null = null;

export function getGlobalModelSystemManager(): ModelSystemManager {
  if (!globalModelSystemManager) {
    globalModelSystemManager = new ModelSystemManager();
  }
  return globalModelSystemManager;
}
