/**
 * OpenClaw SuperClaw 自我进化核心系统
 * 
 * 统一所有自我进化功能，消除重复代码
 * 合并自：
 * - superclaw-evolution.ts
 * - superclaw-ultimate.ts
 * - self-driven-optimizer.ts
 * - ooda-cognitive-loop.ts
 * - persistent-memory-system.ts
 * - modular-agent-architecture.ts
 * - self-awareness/index.ts
 * 
 * 设计原则：轻量化、高效率、低开销
 */

import { getGlobalCoreEngine } from './core-engine.js';
import { getGlobalCognitiveSystem } from './cognitive-system.js';
import { getGlobalMemorySystem } from './memory-system.js';
import { getGlobalExecutionSystem } from './execution-system.js';
import { getGlobalMonitoringSystem } from './monitoring-system.js';

// ==================== 工具函数 ====================

const now = () => now();
const generateId = (prefix: string) => `${prefix}_${now()}_${Math.random().toString(36).slice(2, 9)}`;

// ==================== 类型定义 ====================

export interface EvolutionConfig {
  enableAutonomy: boolean;
  enableEvolution: boolean;
  enableAwareness: boolean;
  enableThinking: boolean;
  enableLearning: boolean;
  reflectionInterval: number; // 分钟
  learningRate: number; // 0-1
}

export interface Experience {
  id: string;
  context: string;
  action: string;
  result: string;
  success: boolean;
  timestamp: number;
  tags: string[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  goalId?: string;
  createdAt: number;
  completedAt?: number;
}

export interface Reflection {
  id: string;
  content: string;
  insights: string[];
  timestamp: number;
  category: string;
}

export interface BehaviorPattern {
  id: string;
  pattern: string;
  frequency: number;
  successRate: number;
  lastSeen: number;
}

export interface Knowledge {
  id: string;
  domain: string;
  content: string;
  confidence: number;
  source: string;
  timestamp: number;
}

// ==================== 自主性引擎 ====================

class AutonomyEngine {
  private goals: Map<string, Goal> = new Map();
  private tasks: Map<string, Task> = new Map();

  addGoal(goal: Omit<Goal, 'id' | 'status' | 'createdAt'>): string {
    const id = generateId("goal");
    this.goals.set(id, {
      ...goal,
      id,
      status: 'pending',
      createdAt: now(),
    });
    return id;
  }

  addTask(task: Omit<Task, 'id' | 'status' | 'createdAt'>): string {
    const id = generateId("task");
    this.tasks.set(id, {
      ...task,
      id,
      status: 'pending',
      createdAt: now(),
    });
    return id;
  }

  completeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = now();
    }
  }

  completeGoal(goalId: string): void {
    const goal = this.goals.get(goalId);
    if (goal) {
      goal.status = 'completed';
      goal.completedAt = now();
    }
  }

  getActiveGoals(): Goal[] {
    return Array.from(this.goals.values())
      .filter(g => g.status === 'pending' || g.status === 'in_progress');
  }

  getActiveTasks(): Task[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'pending' || t.status === 'in_progress');
  }

  getStatus(): { goals: number; tasks: number; completedGoals: number; completedTasks: number } {
    const goals = Array.from(this.goals.values());
    const tasks = Array.from(this.tasks.values());
    
    return {
      goals: goals.length,
      tasks: tasks.length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
    };
  }

  clear(): void {
    this.goals.clear();
    this.tasks.clear();
  }
}

// ==================== 进化引擎 ====================

class EvolutionEngine {
  private experiences: Experience[] = [];
  private patterns: BehaviorPattern[] = [];
  private knowledgeBase: Knowledge[] = [];

  recordExperience(experience: Omit<Experience, 'id' | 'timestamp'>): string {
    const id = generateId("exp");
    this.experiences.push({
      ...experience,
      id,
      timestamp: now(),
    });

    // 更新行为模式
    this.updatePatterns(experience.context, experience.success);
    
    // 更新知识库
    if (experience.success) {
      this.addKnowledge('experience', experience.result, 0.7, 'experience');
    }

    return id;
  }

  private updatePatterns(context: string, success: boolean): void {
    const existing = this.patterns.find(p => p.pattern === context);
    
    if (existing) {
      existing.frequency++;
      existing.successRate = (existing.successRate * (existing.frequency - 1) + (success ? 1 : 0)) / existing.frequency;
      existing.lastSeen = now();
    } else {
      this.patterns.push({
        id: generateId("pattern"),
        pattern: context,
        frequency: 1,
        successRate: success ? 1 : 0,
        lastSeen: now(),
      });
    }
  }

  addKnowledge(domain: string, content: string, confidence: number, source: string): string {
    const id = generateId("knowledge");
    this.knowledgeBase.push({
      id,
      domain,
      content,
      confidence,
      source,
      timestamp: now(),
    });
    return id;
  }

  getRecommendedPattern(context: string): BehaviorPattern | null {
    return this.patterns
      .filter(p => context.includes(p.pattern) || p.pattern.includes(context))
      .sort((a, b) => b.successRate - a.successRate)[0] || null;
  }

  getRelatedKnowledge(domain: string): Knowledge[] {
    return this.knowledgeBase
      .filter(k => k.domain === domain)
      .sort((a, b) => b.confidence - a.confidence);
  }

  getStatus(): { experiences: number; patterns: number; knowledge: number } {
    return {
      experiences: this.experiences.length,
      patterns: this.patterns.length,
      knowledge: this.knowledgeBase.length,
    };
  }

  clear(): void {
    this.experiences = [];
    this.patterns = [];
    this.knowledgeBase = [];
  }
}

// ==================== OODA 循环 ====================

class OODACycle {
  private observations: string[] = [];
  private orientations: string[] = [];
  private decisions: string[] = [];
  private actions: string[] = [];

  observe(observation: string): void {
    this.observations.push(observation);
    if (this.observations.length > 100) {
      this.observations.shift();
    }
  }

  orient(orientation: string): void {
    this.orientations.push(orientation);
    if (this.orientations.length > 100) {
      this.orientations.shift();
    }
  }

  decide(decision: string): void {
    this.decisions.push(decision);
    if (this.decisions.length > 100) {
      this.decisions.shift();
    }
  }

  act(action: string): void {
    this.actions.push(action);
    if (this.actions.length > 100) {
      this.actions.shift();
    }
  }

  getLatestCycle(): { observation: string; orientation: string; decision: string; action: string } | null {
    if (this.observations.length === 0) return null;
    
    return {
      observation: this.observations[this.observations.length - 1],
      orientation: this.orientations[this.orientations.length - 1] || '',
      decision: this.decisions[this.decisions.length - 1] || '',
      action: this.actions[this.actions.length - 1] || '',
    };
  }

  clear(): void {
    this.observations = [];
    this.orientations = [];
    this.decisions = [];
    this.actions = [];
  }
}

// ==================== SuperClaw 自我进化核心 ====================

export class SuperClawEvolutionCore {
  private config: EvolutionConfig;
  private autonomy: AutonomyEngine;
  private evolution: EvolutionEngine;
  private ooda: OODACycle;
  private startTime: Date = now();
  private evolutionLevel: number = 1;

  constructor(config: Partial<EvolutionConfig> = {}) {
    this.config = {
      enableAutonomy: true,
      enableEvolution: true,
      enableAwareness: true,
      enableThinking: true,
      enableLearning: true,
      reflectionInterval: 5,
      learningRate: 0.8,
      ...config,
    };

    this.autonomy = new AutonomyEngine();
    this.evolution = new EvolutionEngine();
    this.ooda = new OODACycle();

    // 启动进化循环
    if (this.config.enableAutonomy) {
      this.startEvolutionCycle();
    }
  }

  private startEvolutionCycle(): void {
    setInterval(() => {
      this.evolve();
    }, this.config.reflectionInterval * 60 * 1000);
  }

  private evolve(): void {
    // 反思
    this.reflect();
    
    // 学习
    this.learn();
    
    // 优化
    this.optimize();
    
    // 提升等级
    this.evolutionLevel++;
  }

  private reflect(): void {
    const memory = getGlobalMemorySystem();
    const monitoring = getGlobalMonitoringSystem();
    
    monitoring.logger.info('SuperClaw 进化反思', {
      level: this.evolutionLevel,
      autonomy: this.autonomy.getStatus(),
      evolution: this.evolution.getStatus(),
    });
  }

  private learn(): void {
    const cognitive = getGlobalCognitiveSystem();
    
    // 从经验中学习
    const patterns = this.evolution.getStatus();
    cognitive.think(`学习中... 已有 ${patterns.experiences} 条经验`);
  }

  private optimize(): void {
    const core = getGlobalCoreEngine();
    const monitoring = getGlobalMonitoringSystem();
    
    // 清理缓存
    core.cache.cleanup();
    
    // 记录优化
    monitoring.metrics.record('evolution_level', this.evolutionLevel);
  }

  // ==================== 公共接口 ====================

  /**
   * 记录经验
   */
  recordExperience(context: string, action: string, result: string, success: boolean, tags: string[] = []): string {
    const id = this.evolution.recordExperience({
      context,
      action,
      result,
      success,
      tags,
    });

    // OODA 循环
    this.ooda.observe(context);
    this.ooda.orient(`分析: ${context}`);
    this.ooda.decide(`决定: ${action}`);
    this.ooda.act(`执行: ${result}`);

    // 记录到记忆系统
    const memory = getGlobalMemorySystem();
    memory.remember(`经验: ${context} -> ${action} -> ${result}`, success ? 0.8 : 0.4, tags);

    return id;
  }

  /**
   * 添加目标
   */
  addGoal(title: string, description: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'high'): string {
    const id = this.autonomy.addGoal({
      title,
      description,
      priority,
    });

    // 记录到记忆系统
    const memory = getGlobalMemorySystem();
    memory.remember(`目标: ${title} - ${description}`, 0.9, ['goal', priority]);

    return id;
  }

  /**
   * 添加任务
   */
  addTask(title: string, description: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium', goalId?: string): string {
    const id = this.autonomy.addTask({
      title,
      description,
      priority,
      goalId,
    });

    // 记录到记忆系统
    const memory = getGlobalMemorySystem();
    memory.remember(`任务: ${title} - ${description}`, 0.7, ['task', priority]);

    return id;
  }

  /**
   * 完成任务
   */
  completeTask(taskId: string): void {
    this.autonomy.completeTask(taskId);
    this.recordExperience(`完成任务: ${taskId}`, 'completeTask', 'success', true, ['success', 'task']);
  }

  /**
   * 获取推荐行为
   */
  getRecommendedBehavior(context: string): string | null {
    return this.evolution.getRecommendedPattern(context)?.pattern || null;
  }

  /**
   * 获取相关知识
   */
  getRelatedKnowledge(domain: string): Knowledge[] {
    return this.evolution.getRelatedKnowledge(domain);
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): Record<string, any> {
    const core = getGlobalCoreEngine();
    const cognitive = getGlobalCognitiveSystem();
    const memory = getGlobalMemorySystem();
    const execution = getGlobalExecutionSystem();
    const monitoring = getGlobalMonitoringSystem();

    return {
      uptime: now() - this.startTime.getTime(),
      evolutionLevel: this.evolutionLevel,
      autonomy: this.autonomy.getStatus(),
      evolution: this.evolution.getStatus(),
      ooda: this.ooda.getLatestCycle(),
      core: core.getStats(),
      cognitive: cognitive.getStats(),
      memory: memory.getStats(),
      execution: execution.getStats(),
      monitoring: monitoring.getStats(),
    };
  }

  /**
   * 获取每日报告
   */
  getDailyReport(): string {
    const status = this.getSystemStatus();
    
    return `
# SuperClaw 进化日报

## 系统状态
- 运行时间: ${Math.floor(status.uptime / 1000 / 60)} 分钟
- 进化等级: ${status.evolutionLevel}

## 自主性
- 活跃目标: ${status.autonomy.goals}
- 活跃任务: ${status.autonomy.tasks}
- 完成目标: ${status.autonomy.completedGoals}
- 完成任务: ${status.autonomy.completedTasks}

## 进化
- 经验数: ${status.evolution.experiences}
- 行为模式: ${status.evolution.patterns}
- 知识库: ${status.evolution.knowledge}

## 记忆
- 知识节点: ${status.memory.knowledgeNodes}
- 向量条目: ${status.memory.vectorEntries}
- 上下文: ${status.memory.contextEntries}
    `.trim();
  }

  /**
   * 自主运行
   */
  autonomousRun(): void {
    const monitoring = getGlobalMonitoringSystem();
    
    monitoring.logger.info('SuperClaw 自主运行开始');
    
    // 1. 反思
    this.reflect();
    
    // 2. 识别任务
    const activeTasks = this.autonomy.getActiveTasks();
    if (activeTasks.length === 0) {
      this.addTask('系统反思', '反思系统状态，识别问题和改进点', 'high');
    }
    
    // 3. 学习
    this.learn();
    
    // 4. 优化
    this.optimize();
    
    monitoring.logger.info('SuperClaw 自主运行完成');
  }

  /**
   * 获取进化等级
   */
  getEvolutionLevel(): number {
    return this.evolutionLevel;
  }

  /**
   * 清理所有数据
   */
  clear(): void {
    this.autonomy.clear();
    this.evolution.clear();
    this.ooda.clear();
    this.evolutionLevel = 1;
  }
}

// ==================== 全局实例 ====================

let globalSuperClawEvolution: SuperClawEvolutionCore | null = null;

export function getGlobalSuperClawEvolution(config?: Partial<EvolutionConfig>): SuperClawEvolutionCore {
  if (!globalSuperClawEvolution) {
    globalSuperClawEvolution = new SuperClawEvolutionCore(config);
  }
  return globalSuperClawEvolution;
}

export function resetGlobalSuperClawEvolution(): void {
  globalSuperClawEvolution = null;
}

// ==================== 导出子系统 ====================

export { getGlobalCoreEngine } from './core-engine.js';
export { getGlobalCognitiveSystem } from './cognitive-system.js';
export { getGlobalMemorySystem } from './memory-system.js';
export { getGlobalExecutionSystem } from './execution-system.js';
export { getGlobalMonitoringSystem } from './monitoring-system.js';
