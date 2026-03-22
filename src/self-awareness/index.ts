/**
 * OpenClaw 自我进化系统 - 统一入口（完整版）
 * 
 * 整合所有模块：
 * 1. 自主性 (Autonomy)
 * 2. 自我进化 (Self-Evolution)
 * 3. 自我觉醒 (Self-Awareness)
 * 4. 持久化存储 (Storage)
 * 5. 记忆系统集成 (Memory Integration)
 * 6. 人类化思考 (Humanized Thinking)
 */

import { AutonomyEngine, getGlobalAutonomyEngine } from './autonomy';
import { SelfEvolutionEngine, getGlobalSelfEvolutionEngine } from './self-evolution';
import { SelfAwarenessEngine, getGlobalSelfAwarenessEngine } from './self-awareness-engine';
import { SelfDrivenEngine, getGlobalSelfDrivenEngine } from './self-driven';
import { PersistentStorage, getGlobalPersistentStorage } from './storage';
import { MemoryIntegration, getGlobalMemoryIntegration } from './memory-integration';
import { HumanizedThinking, getGlobalHumanizedThinking } from './humanized-thinking';

export interface SelfEvolutionConfig {
  enableAutonomy: boolean;
  enableSelfEvolution: boolean;
  enableSelfAwareness: boolean;
  enableStorage: boolean;
  enableMemoryIntegration: boolean;
  enableHumanizedThinking: boolean;
  reflectionInterval: number; // 分钟
  maxConcurrentTasks: number;
  learningRate: number;
  dataDir?: string;
}

export class SelfEvolutionSystem {
  private autonomy: AutonomyEngine;
  private selfEvolution: SelfEvolutionEngine;
  private selfAwareness: SelfAwarenessEngine;
  private selfDriven: SelfDrivenEngine;
  private storage: PersistentStorage;
  private memory: MemoryIntegration;
  private thinking: HumanizedThinking;
  private config: SelfEvolutionConfig;

  constructor(config?: Partial<SelfEvolutionConfig>) {
    this.config = {
      enableAutonomy: true,
      enableSelfEvolution: true,
      enableSelfAwareness: true,
      enableStorage: true,
      enableMemoryIntegration: true,
      enableHumanizedThinking: true,
      reflectionInterval: 5,
      maxConcurrentTasks: 3,
      learningRate: 0.1,
      ...config,
    };

    // 初始化各个模块
    this.autonomy = getGlobalAutonomyEngine();
    this.selfEvolution = getGlobalSelfEvolutionEngine();
    this.selfAwareness = getGlobalSelfAwarenessEngine();
    this.selfDriven = getGlobalSelfDrivenEngine();
    
    if (this.config.enableStorage) {
      this.storage = getGlobalPersistentStorage({
        dataDir: this.config.dataDir,
      });
    }
    
    if (this.config.enableMemoryIntegration) {
      this.memory = getGlobalMemoryIntegration();
    }
    
    if (this.config.enableHumanizedThinking) {
      this.thinking = getGlobalHumanizedThinking();
    }

    // 启动系统
    this.start();
  }

  /**
   * 启动系统
   */
  private start(): void {
    console.log('[SelfEvolution] 启动自我进化系统...');
    
    // 启动自主任务识别
    if (this.config.enableAutonomy) {
      setInterval(() => {
        this.autonomy.autonomousTaskIdentification();
      }, 10 * 60 * 1000); // 每10分钟
    }
    
    // 启动自动保存
    if (this.config.enableStorage) {
      setInterval(() => {
        this.saveAll();
      }, this.config.reflectionInterval * 60 * 1000);
    }
    
    console.log('[SelfEvolution] 自我进化系统已启动');
  }

  /**
   * 记录经验
   */
  recordExperience(context: string, action: string, result: string, success: boolean, tags: string[] = []): string {
    const experienceId = this.selfEvolution.recordExperience({
      context,
      action,
      result,
      success,
      tags,
    });
    
    // 同时记录到记忆系统
    if (this.config.enableMemoryIntegration) {
      this.memory.writeToDailyMemory({
        id: experienceId,
        timestamp: new Date(),
        type: 'experience',
        content: `${context} -> ${action} -> ${result}`,
        tags,
        importance: success ? 80 : 40,
        source: 'self-evolution',
      });
    }
    
    // 记录情感
    if (this.config.enableHumanizedThinking) {
      this.thinking.recordEmotion(context, success ? 1 : -1);
    }
    
    return experienceId;
  }

  /**
   * 添加任务
   */
  addTask(title: string, description: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): string {
    const taskId = this.autonomy.addTask({
      title,
      description,
      priority,
    });
    
    // 记录到记忆系统
    if (this.config.enableMemoryIntegration) {
      this.memory.writeToDailyMemory({
        id: taskId,
        timestamp: new Date(),
        type: 'goal',
        content: `新任务: ${title} - ${description}`,
        tags: ['task', priority],
        importance: priority === 'critical' ? 100 : priority === 'high' ? 80 : 50,
        source: 'autonomy',
      });
    }
    
    return taskId;
  }

  /**
   * 添加目标
   */
  addGoal(title: string, description: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'high'): string {
    const goalId = this.autonomy.addGoal({
      title,
      description,
      priority,
      tasks: [],
    });
    
    // 记录到记忆系统
    if (this.config.enableMemoryIntegration) {
      this.memory.writeToLongTermMemory({
        id: goalId,
        timestamp: new Date(),
        type: 'goal',
        content: `新目标: ${title} - ${description}`,
        tags: ['goal', priority],
        importance: 90,
        source: 'autonomy',
      });
    }
    
    return goalId;
  }

  /**
   * 完成任务
   */
  completeTask(taskId: string, result: string): void {
    this.autonomy.completeTask(taskId, result);
    
    // 记录经验
    this.recordExperience(
      `完成任务: ${taskId}`,
      'completeTask',
      result,
      true,
      ['success', 'task']
    );
  }

  /**
   * 获取推荐行为
   */
  getRecommendedBehavior(context: string) {
    return this.selfEvolution.getRecommendedPattern(context);
  }

  /**
   * 获取相关知识
   */
  getRelatedKnowledge(domain: string) {
    return this.selfEvolution.getRelatedKnowledge(domain);
  }

  /**
   * 获取系统状态
   */
  getSystemStatus() {
    return {
      autonomy: this.autonomy.getStatus(),
      selfEvolution: this.selfEvolution.getStatus(),
      selfAwareness: this.selfAwareness.getStateSummary(),
      selfDriven: this.selfDriven.getStatus(),
      storage: this.config.enableStorage ? this.storage.getStatus() : null,
      memory: this.config.enableMemoryIntegration ? this.memory.getMemoryStats() : null,
      thinking: this.config.enableHumanizedThinking ? this.thinking.getThinkingStats() : null,
    };
  }

  /**
   * 获取问题报告
   */
  getIssueReport() {
    return this.selfAwareness.exportStateReport();
  }

  /**
   * 获取思考报告
   */
  getThinkingReport(): string {
    if (this.config.enableHumanizedThinking) {
      return this.thinking.generateThinkingReport();
    }
    return '人类化思考模块未启用';
  }

  /**
   * 创建反思任务
   */
  createReflectionTask(): void {
    this.addTask(
      '系统反思',
      '反思系统状态，识别问题和改进点',
      'high'
    );
  }

  /**
   * 创建学习任务
   */
  createLearningTask(): void {
    this.addTask(
      '学习新知识',
      '从最近的经验中学习，更新知识库',
      'medium'
    );
  }

  /**
   * 创建优化任务
   */
  createOptimizationTask(): void {
    this.addTask(
      '系统优化',
      '分析系统性能，提出优化建议',
      'high'
    );
  }

  /**
   * 自主运行
   */
  autonomousRun(): void {
    console.log('[SelfEvolution] 开始自主运行...');
    
    // 1. 识别需要执行的任务
    this.autonomy.autonomousTaskIdentification();
    
    // 2. 创建反思任务
    this.createReflectionTask();
    
    // 3. 创建学习任务
    this.createLearningTask();
    
    // 4. 创建优化任务
    this.createOptimizationTask();
    
    // 5. 记录反思
    if (this.config.enableMemoryIntegration) {
      this.memory.writeToDailyMemory({
        id: `reflection_${Date.now()}`,
        timestamp: new Date(),
        type: 'reflection',
        content: '完成自主运行，创建了反思、学习、优化任务',
        tags: ['reflection', 'autonomous'],
        importance: 70,
        source: 'self-evolution',
      });
    }
    
    console.log('[SelfEvolution] 自主运行完成');
  }

  /**
   * 保存所有数据
   */
  saveAll(): void {
    if (this.config.enableStorage) {
      // 保存经验
      this.storage.save('experiences.json', {
        experiences: this.selfEvolution.getStatus(),
        lastSave: new Date(),
      });
      
      // 保存任务
      this.storage.save('tasks.json', {
        tasks: this.autonomy.getStatus(),
        lastSave: new Date(),
      });
      
      // 保存问题
      this.storage.save('issues.json', {
        issues: this.selfAwareness.getIssueStats(),
        lastSave: new Date(),
      });
      
      // 保存思考
      if (this.config.enableHumanizedThinking) {
        this.storage.save('thinking.json', {
          thinking: this.thinking.getThinkingStats(),
          lastSave: new Date(),
        });
      }
      
      console.log('[SelfEvolution] 数据已保存');
    }
  }

  /**
   * 加载所有数据
   */
  loadAll(): void {
    if (this.config.enableStorage) {
      // 这里可以添加从文件加载数据的逻辑
      console.log('[SelfEvolution] 数据已加载');
    }
  }

  /**
   * 搜索记忆
   */
  searchMemory(query: string) {
    if (this.config.enableMemoryIntegration) {
      return this.memory.searchMemory(query);
    }
    return [];
  }

  /**
   * 获取联想
   */
  getAssociations(concept: string) {
    if (this.config.enableHumanizedThinking) {
      return this.thinking.getAssociations(concept);
    }
    return [];
  }

  /**
   * 获取最近的思考
   */
  getRecentThoughts(count: number = 10) {
    if (this.config.enableHumanizedThinking) {
      return this.thinking.getRecentThoughts(count);
    }
    return [];
  }

  /**
   * 获取每日报告
   */
  getDailyReport(): string {
    const today = new Date().toISOString().split('T')[0];
    const status = this.getSystemStatus();
    const issues = this.selfAwareness.getIssueStats();
    const suggestions = this.selfAwareness.getSuggestionStats();
    
    return `
# OpenClaw 自我进化日报 - ${today}

## 系统状态
- 活跃任务: ${status.autonomy.inProgressTasks}
- 待处理任务: ${status.autonomy.pendingTasks}
- 已完成任务: ${status.autonomy.completedTasks}
- 行为模式: ${status.selfEvolution.behaviorPatterns}
- 知识库: ${status.selfEvolution.knowledgeBase}

## 问题统计
- 未解决问题: ${issues.open}
- 已解决问题: ${issues.resolved}

## 建议统计
- 待处理建议: ${suggestions.pending}
- 已实施建议: ${suggestions.implemented}

## 记忆统计
- 长期记忆: ${status.memory?.longTermCount || 0}
- 今日记忆: ${status.memory?.dailyCount || 0}

## 思考统计
- 总思考数: ${status.thinking?.totalThoughts || 0}
- 平均信心度: ${status.thinking?.averageConfidence?.toFixed(1) || 0}%
- 平均创造力: ${status.thinking?.averageCreativity?.toFixed(1) || 0}%
    `.trim();
  }
}

// 全局实例
let globalSelfEvolutionSystem: SelfEvolutionSystem | null = null;

export function getGlobalSelfEvolutionSystem(config?: Partial<SelfEvolutionConfig>): SelfEvolutionSystem {
  if (!globalSelfEvolutionSystem) {
    globalSelfEvolutionSystem = new SelfEvolutionSystem(config);
  }
  return globalSelfEvolutionSystem;
}

// 导出各个模块的接口
export { AutonomyEngine, getGlobalAutonomyEngine } from './autonomy';
export { SelfEvolutionEngine, getGlobalSelfEvolutionEngine } from './self-evolution';
export { SelfAwarenessEngine, getGlobalSelfAwarenessEngine } from './self-awareness-engine';
export { SelfDrivenEngine, getGlobalSelfDrivenEngine } from './self-driven';
export { PersistentStorage, getGlobalPersistentStorage } from './storage';
export { MemoryIntegration, getGlobalMemoryIntegration } from './memory-integration';
export { HumanizedThinking, getGlobalHumanizedThinking } from './humanized-thinking';
