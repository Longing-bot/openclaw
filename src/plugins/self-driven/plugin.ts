/**
 * OpenClaw 自我驱动插件
 * 
 * 核心功能：
 * 1. 监控代理执行
 * 2. 记录经验
 * 3. 自我反思
 * 4. 自主执行任务
 */

import type { PluginContext, PluginHook } from '../types';

// ==================== 类型定义 ====================

export interface SelfDrivenConfig {
  enable: boolean;
  reflectionInterval: number; // 分钟
  maxExperiences: number;
  autoExecute: boolean;
}

export interface Experience {
  id: string;
  timestamp: Date;
  type: 'tool-call' | 'model-call' | 'error' | 'success' | 'user-interaction';
  context: string;
  action: string;
  result: string;
  success: boolean;
  duration: number;
  tags: string[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface Reflection {
  id: string;
  timestamp: Date;
  type: 'performance' | 'behavior' | 'goal' | 'learning';
  observation: string;
  insight: string;
  actionPlan: string;
}

// ==================== 自我驱动插件 ====================

export class SelfDrivenPlugin {
  private config: SelfDrivenConfig;
  private experiences: Experience[] = [];
  private goals: Map<string, Goal> = new Map();
  private reflections: Reflection[] = [];
  private lastReflection: Date = new Date();
  private context: PluginContext | null = null;

  constructor(config: Partial<SelfDrivenConfig> = {}) {
    this.config = {
      enable: true,
      reflectionInterval: 5,
      maxExperiences: 1000,
      autoExecute: true,
      ...config,
    };
  }

  /**
   * 初始化插件
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    console.log('[SelfDriven] 插件初始化完成');

    // 初始化默认目标
    this.initializeDefaultGoals();

    // 启动自我反思
    if (this.config.enable) {
      this.startReflectionCycle();
    }
  }

  /**
   * 初始化默认目标
   */
  private initializeDefaultGoals(): void {
    this.addGoal({
      title: '优化响应时间',
      description: '减少模型调用和工具调用的延迟',
      priority: 'high',
    });

    this.addGoal({
      title: '提高缓存命中率',
      description: '优化缓存策略，减少重复计算',
      priority: 'medium',
    });

    this.addGoal({
      title: '学习用户偏好',
      description: '从交互中学习用户偏好，提供更个性化的服务',
      priority: 'medium',
    });
  }

  /**
   * 启动反思循环
   */
  private startReflectionCycle(): void {
    setInterval(() => {
      this.reflect();
    }, this.config.reflectionInterval * 60 * 1000);
  }

  /**
   * 添加目标
   */
  addGoal(goal: Omit<Goal, 'id' | 'status' | 'progress' | 'createdAt'>): string {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGoal: Goal = {
      ...goal,
      id,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    this.goals.set(id, newGoal);
    console.log(`[SelfDriven] 添加目标: ${goal.title}`);
    return id;
  }

  /**
   * 更新目标进度
   */
  updateGoalProgress(goalId: string, progress: number): void {
    const goal = this.goals.get(goalId);
    if (goal) {
      goal.progress = Math.min(100, Math.max(0, progress));
      if (goal.progress === 100) {
        goal.status = 'completed';
        goal.completedAt = new Date();
        console.log(`[SelfDriven] 目标完成: ${goal.title}`);
      } else if (goal.progress > 0) {
        goal.status = 'in-progress';
      }
    }
  }

  /**
   * 记录经验
   */
  recordExperience(experience: Omit<Experience, 'id' | 'timestamp'>): void {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newExperience: Experience = {
      ...experience,
      id,
      timestamp: new Date(),
    };

    this.experiences.push(newExperience);

    // 限制经验数量
    if (this.experiences.length > this.config.maxExperiences) {
      this.experiences = this.experiences.slice(-this.config.maxExperiences);
    }

    // 从经验中学习
    this.learnFromExperience(newExperience);
  }

  /**
   * 从经验中学习
   */
  private learnFromExperience(experience: Experience): void {
    if (experience.success && experience.duration < 1000) {
      // 成功且快速的经验，强化相关行为
      console.log(`[SelfDriven] 学习成功经验: ${experience.context}`);
    } else if (!experience.success) {
      // 失败经验，调整行为
      console.log(`[SelfDriven] 从失败中学习: ${experience.context}`);
      this.adjustBehavior(experience);
    }
  }

  /**
   * 调整行为
   */
  private adjustBehavior(experience: Experience): void {
    if (experience.tags.includes('slow')) {
      // 如果是性能问题，优化相关目标
      const performanceGoal = Array.from(this.goals.values()).find(g => 
        g.title.includes('性能') || g.title.includes('响应')
      );
      if (performanceGoal) {
        performanceGoal.priority = 'critical';
      }
    }
  }

  /**
   * 自我反思
   */
  private reflect(): void {
    console.log('[SelfDriven] 开始自我反思...');

    // 1. 分析性能
    this.analyzePerformance();

    // 2. 分析目标进度
    this.analyzeGoals();

    // 3. 分析学习经验
    this.analyzeExperiences();

    // 4. 生成反思
    this.generateReflection();

    // 5. 更新最后反思时间
    this.lastReflection = new Date();

    console.log('[SelfDriven] 自我反思完成');
  }

  /**
   * 分析性能
   */
  private analyzePerformance(): void {
    const recentExperiences = this.experiences.slice(-10);
    const failedExperiences = recentExperiences.filter(e => !e.success);

    if (failedExperiences.length > 3) {
      console.log('[SelfDriven] 最近失败经验较多');
      this.createReflection('performance', '最近10个经验中有3个以上失败', '分析失败原因，调整策略');
    }

    // 分析平均响应时间
    const avgDuration = recentExperiences.reduce((sum, e) => sum + e.duration, 0) / recentExperiences.length;
    if (avgDuration > 2000) {
      console.log('[SelfDriven] 平均响应时间过长');
      this.createReflection('performance', '平均响应时间超过2秒', '优化代码，减少延迟');
    }
  }

  /**
   * 分析目标
   */
  private analyzeGoals(): void {
    const pendingGoals = Array.from(this.goals.values()).filter(g => g.status === 'pending');
    const inProgressGoals = Array.from(this.goals.values()).filter(g => g.status === 'in-progress');

    if (pendingGoals.length > 5) {
      console.log('[SelfDriven] 待处理目标过多');
      this.createReflection('goal', `有${pendingGoals.length}个待处理目标`, '优先处理高优先级目标');
    }

    // 检查进行中的目标是否停滞
    inProgressGoals.forEach(goal => {
      const timeSinceCreation = Date.now() - goal.createdAt.getTime();
      if (timeSinceCreation > 24 * 60 * 60 * 1000 && goal.progress < 50) {
        console.log(`[SelfDriven] 目标${goal.title}进展缓慢`);
        this.createReflection('goal', `目标"${goal.title}"创建超过24小时，进度不足50%`, '重新评估目标优先级或调整策略');
      }
    });
  }

  /**
   * 分析经验
   */
  private analyzeExperiences(): void {
    const recentExperiences = this.experiences.slice(-10);
    const failedExperiences = recentExperiences.filter(e => !e.success);

    if (failedExperiences.length > 3) {
      console.log('[SelfDriven] 最近失败经验较多');
      this.createReflection('learning', '最近10个经验中有3个以上失败', '分析失败原因，调整策略');
    }
  }

  /**
   * 创建反思
   */
  private createReflection(type: Reflection['type'], observation: string, actionPlan: string): void {
    const id = `reflection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const reflection: Reflection = {
      id,
      timestamp: new Date(),
      type,
      observation,
      insight: this.generateInsight(type, observation),
      actionPlan,
    };

    this.reflections.push(reflection);

    // 限制反思数量
    if (this.reflections.length > 100) {
      this.reflections = this.reflections.slice(-100);
    }

    console.log(`[SelfDriven] 生成反思: ${observation}`);
  }

  /**
   * 生成洞察
   */
  private generateInsight(type: Reflection['type'], observation: string): string {
    switch (type) {
      case 'performance':
        return '性能问题是影响用户体验的关键因素';
      case 'behavior':
        return '行为模式需要持续优化';
      case 'goal':
        return '目标管理需要更有效的策略';
      case 'learning':
        return '学习是持续改进的基础';
      default:
        return '需要持续反思和改进';
    }
  }

  /**
   * 生成反思
   */
  private generateReflection(): void {
    const pendingGoals = Array.from(this.goals.values()).filter(g => g.status === 'pending');
    const completedGoals = Array.from(this.goals.values()).filter(g => g.status === 'completed');
    const totalGoals = this.goals.size;

    if (completedGoals.length < totalGoals * 0.3) {
      this.createReflection('goal', '目标完成率低于30%', '重新评估目标可行性，调整优先级');
    }
  }

  /**
   * 自主执行
   */
  autonomousExecute(): void {
    if (!this.config.autoExecute) {
      return;
    }

    console.log('[SelfDriven] 开始自主执行...');

    // 1. 识别需要执行的任务
    const pendingGoals = Array.from(this.goals.values())
      .filter(g => g.status === 'pending')
      .sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      });

    // 2. 执行最高优先级的任务
    if (pendingGoals.length > 0) {
      const goal = pendingGoals[0];
      goal.status = 'in-progress';
      console.log(`[SelfDriven] 开始执行目标: ${goal.title}`);

      // 记录经验
      this.recordExperience({
        type: 'success',
        context: `执行目标: ${goal.title}`,
        action: '开始执行',
        result: '进行中',
        success: true,
        duration: 0,
        tags: ['goal', 'execution'],
      });
    }

    console.log('[SelfDriven] 自主执行完成');
  }

  /**
   * 获取状态
   */
  getStatus(): {
    goals: Goal[];
    experiences: number;
    reflections: number;
    lastReflection: Date;
  } {
    return {
      goals: Array.from(this.goals.values()),
      experiences: this.experiences.length,
      reflections: this.reflections.length,
      lastReflection: this.lastReflection,
    };
  }

  /**
   * 获取推荐行动
   */
  getRecommendedActions(): string[] {
    const recommendations: string[] = [];

    // 基于目标推荐
    const pendingGoals = Array.from(this.goals.values()).filter(g => g.status === 'pending');
    if (pendingGoals.length > 3) {
      recommendations.push('优先处理高优先级目标');
    }

    // 基于经验推荐
    const recentExperiences = this.experiences.slice(-10);
    const failedExperiences = recentExperiences.filter(e => !e.success);
    if (failedExperiences.length > 3) {
      recommendations.push('分析失败原因，调整策略');
    }

    return recommendations;
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    const status = this.getStatus();
    const recommendations = this.getRecommendedActions();

    return `
# OpenClaw 自我驱动报告

## 目标状态
- 总目标数: ${status.goals.length}
- 已完成: ${status.goals.filter(g => g.status === 'completed').length}
- 进行中: ${status.goals.filter(g => g.status === 'in-progress').length}
- 待处理: ${status.goals.filter(g => g.status === 'pending').length}

## 学习经验
- 总经验数: ${status.experiences}
- 总反思数: ${status.reflections}
- 最后反思: ${status.lastReflection.toLocaleString()}

## 推荐行动
${recommendations.map(r => `- ${r}`).join('\n')}
    `.trim();
  }

  /**
   * 清理插件
   */
  async cleanup(): Promise<void> {
    console.log('[SelfDriven] 插件清理完成');
  }
}

// ==================== 插件钩子 ====================

export function createSelfDrivenHooks(plugin: SelfDrivenPlugin): PluginHook[] {
  return [
    {
      name: 'self-driven:tool-call',
      hook: 'afterToolCall',
      handler: async (context: any) => {
        const startTime = Date.now();
        const duration = Date.now() - startTime;

        plugin.recordExperience({
          type: 'tool-call',
          context: `工具调用: ${context.toolName}`,
          action: '调用工具',
          result: context.success ? '成功' : '失败',
          success: context.success,
          duration,
          tags: ['tool', context.success ? 'success' : 'error'],
        });

        return context;
      },
    },
    {
      name: 'self-driven:model-call',
      hook: 'afterModelCall',
      handler: async (context: any) => {
        const startTime = Date.now();
        const duration = Date.now() - startTime;

        plugin.recordExperience({
          type: 'model-call',
          context: `模型调用: ${context.model}`,
          action: '调用模型',
          result: context.success ? '成功' : '失败',
          success: context.success,
          duration,
          tags: ['model', context.success ? 'success' : 'error'],
        });

        return context;
      },
    },
    {
      name: 'self-driven:error',
      hook: 'onError',
      handler: async (context: any) => {
        plugin.recordExperience({
          type: 'error',
          context: `错误: ${context.error.message}`,
          action: '处理错误',
          result: '失败',
          success: false,
          duration: 0,
          tags: ['error'],
        });

        return context;
      },
    },
  ];
}

// ==================== 导出 ====================

export function createSelfDrivenPlugin(config?: Partial<SelfDrivenConfig>): SelfDrivenPlugin {
  return new SelfDrivenPlugin(config);
}
