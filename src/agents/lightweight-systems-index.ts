/**
 * OpenClaw 轻量级系统统一入口
 * 
 * 专为小参数模型优化：
 * 1. 整合所有轻量级系统
 * 2. 统一接口
 * 3. 低计算开销
 */

// 导入所有轻量级系统
export { getGlobalToolSystem, LightweightToolSystem } from './lightweight-tool-system';
export { getGlobalPromptOptimization, PromptOptimizationSystem } from './prompt-optimization-system';
export { getGlobalKnowledgeGraph, LightweightKnowledgeGraph } from './lightweight-knowledge-graph';
export { getGlobalVectorStore, LightweightVectorStore } from './lightweight-vector-store';
export { getGlobalReasoningEngine, LightweightReasoningEngine } from './lightweight-reasoning-engine';
export { getGlobalLearningSystem, LightweightLearningSystem } from './lightweight-learning-system';
export { getGlobalPlanningSystem, LightweightPlanningSystem } from './lightweight-planning-system';
export { getGlobalReflectionSystem, LightweightReflectionSystem } from './lightweight-reflection-system';
export { getGlobalEmotionalSystem, LightweightEmotionalSystem } from './lightweight-emotional-system';
export { getGlobalAttentionSystem, LightweightAttentionSystem } from './lightweight-attention-system';
export { getGlobalDecisionSystem, LightweightDecisionSystem } from './lightweight-decision-system';
export { getGlobalExecutionSystem, LightweightExecutionSystem } from './lightweight-execution-system';

// ==================== 统一管理器 ====================

export class LightweightSystemManager {
  private systems: Map<string, any> = new Map();

  constructor() {
    this.initializeSystems();
  }

  /**
   * 初始化所有系统
   */
  private initializeSystems(): void {
    // 延迟初始化，按需加载
    console.log('[SystemManager] 轻量级系统管理器初始化完成');
  }

  /**
   * 获取系统
   */
  getSystem(name: string): any {
    if (!this.systems.has(name)) {
      // 按需初始化
      switch (name) {
        case 'tool':
          this.systems.set(name, require('./lightweight-tool-system').getGlobalToolSystem());
          break;
        case 'prompt':
          this.systems.set(name, require('./prompt-optimization-system').getGlobalPromptOptimization());
          break;
        case 'knowledge':
          this.systems.set(name, require('./lightweight-knowledge-graph').getGlobalKnowledgeGraph());
          break;
        case 'vector':
          this.systems.set(name, require('./lightweight-vector-store').getGlobalVectorStore());
          break;
        case 'reasoning':
          this.systems.set(name, require('./lightweight-reasoning-engine').getGlobalReasoningEngine());
          break;
        case 'learning':
          this.systems.set(name, require('./lightweight-learning-system').getGlobalLearningSystem());
          break;
        case 'planning':
          this.systems.set(name, require('./lightweight-planning-system').getGlobalPlanningSystem());
          break;
        case 'reflection':
          this.systems.set(name, require('./lightweight-reflection-system').getGlobalReflectionSystem());
          break;
        case 'emotion':
          this.systems.set(name, require('./lightweight-emotional-system').getGlobalEmotionalSystem());
          break;
        case 'attention':
          this.systems.set(name, require('./lightweight-attention-system').getGlobalAttentionSystem());
          break;
        case 'decision':
          this.systems.set(name, require('./lightweight-decision-system').getGlobalDecisionSystem());
          break;
        case 'execution':
          this.systems.set(name, require('./lightweight-execution-system').getGlobalExecutionSystem());
          break;
        default:
          throw new Error(`未知系统: ${name}`);
      }
    }

    return this.systems.get(name);
  }

  /**
   * 获取所有系统状态
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [name, system] of this.systems) {
      if (system.getStats) {
        stats[name] = system.getStats();
      }
    }

    return stats;
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    const stats = this.getAllStats();

    return `
# 轻量级系统报告

## 系统状态
${Object.entries(stats).map(([name, stat]) => `- ${name}: ${JSON.stringify(stat)}`).join('\n')}

## 已加载系统
${Array.from(this.systems.keys()).join(', ')}
    `.trim();
  }
}

// ==================== 全局实例 ====================

let globalSystemManager: LightweightSystemManager | null = null;

export function getGlobalSystemManager(): LightweightSystemManager {
  if (!globalSystemManager) {
    globalSystemManager = new LightweightSystemManager();
  }
  return globalSystemManager;
}

export function resetGlobalSystemManager(): void {
  globalSystemManager = null;
}
