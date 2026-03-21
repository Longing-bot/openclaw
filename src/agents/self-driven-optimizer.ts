/**
 * OpenClaw 自我驱动代理优化器
 * 
 * 在 AgentRuntimeOptimizer 基础上添加：
 * 1. 自主任务识别和执行
 * 2. 从经验中学习和优化
 * 3. 自我反思和改进
 */

import { AgentRuntimeOptimizer, getGlobalAgentOptimizer } from './agent-optimizer';

// ==================== 自我驱动类型定义 ====================

export interface SelfDrivenGoal {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number; // 0-100
  createdAt: Date;
  completedAt?: Date;
}

export interface LearningExperience {
  id: string;
  timestamp: Date;
  context: string;
  action: string;
  result: string;
  success: boolean;
  impact: number; // -100 to 100
  tags: string[];
}

export interface Reflection {
  id: string;
  timestamp: Date;
  type: 'performance' | 'behavior' | 'goal' | 'learning';
  observation: string;
  insight: string;
  actionPlan: string;
}

// ==================== 自我驱动代理优化器 ====================

export class SelfDrivenAgentOptimizer extends AgentRuntimeOptimizer {
  private goals: Map<string, SelfDrivenGoal> = new Map();
  private experiences: LearningExperience[] = [];
  private reflections: Reflection[] = [];
  private lastReflectionTime: Date = new Date();
  private reflectionInterval: number = 5 * 60 * 1000; // 5分钟

  constructor() {
    super();
    this.initializeDefaultGoals();
    this.startSelfReflection();
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
   * 开始自我反思
   */
  private startSelfReflection(): void {
    setInterval(() => {
      this.reflect();
    }, this.reflectionInterval);
  }

  /**
   * 添加目标
   */
  addGoal(goal: Omit<SelfDrivenGoal, 'id' | 'status' | 'progress' | 'createdAt'>): string {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGoal: SelfDrivenGoal = {
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
  recordExperience(experience: Omit<LearningExperience, 'id' | 'timestamp'>): void {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newExperience: LearningExperience = {
      ...experience,
      id,
      timestamp: new Date(),
    };

    this.experiences.push(newExperience);

    // 限制经验数量
    if (this.experiences.length > 1000) {
      this.experiences = this.experiences.slice(-1000);
    }

    // 从经验中学习
    this.learnFromExperience(newExperience);
  }

  /**
   * 从经验中学习
   */
  private learnFromExperience(experience: LearningExperience): void {
    // 分析经验
    if (experience.success && experience.impact > 50) {
      // 成功且影响大的经验，强化相关行为
      console.log(`[SelfDriven] 学习成功经验: ${experience.context}`);
    } else if (!experience.success && experience.impact < -50) {
      // 失败且影响大的经验，调整行为
      console.log(`[SelfDriven] 从失败中学习: ${experience.context}`);
      this.adjustBehavior(experience);
    }
  }

  /**
   * 调整行为
   */
  private adjustBehavior(experience: LearningExperience): void {
    // 根据失败经验调整行为
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

    // 1. 分析性能指标
    const metrics = this.getMetrics();
    this.analyzePerformance(metrics);

    // 2. 分析目标进度
    this.analyzeGoals();

    // 3. 分析学习经验
    this.analyzeExperiences();

    // 4. 生成反思
    this.generateReflection();

    // 5. 更新最后反思时间
    this.lastReflectionTime = new Date();

    console.log('[SelfDriven] 自我反思完成');
  }

  /**
   * 分析性能
   */
  private analyzePerformance(metrics: any): void {
    // 分析缓存命中率
    const cacheHitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);
    if (cacheHitRate < 0.5) {
      console.log('[SelfDriven] 缓存命中率低，需要优化');
      this.createReflection('performance', '缓存命中率低于50%', '优化缓存策略，增加缓存时间');
    }

    // 分析响应时间
    const avgModelCallTime = metrics.modelCallTime / metrics.modelCalls;
    if (avgModelCallTime > 2000) {
      console.log('[SelfDriven] 模型调用时间过长');
      this.createReflection('performance', '模型调用平均时间超过2秒', '优化模型选择，使用更快的模型');
    }
  }

  /**
   * 分析目标
   */
  private analyzeGoals(): void {
    const pendingGoals = Array.from(this.goals.values()).filter(g => g.status === 'pending');
    const inProgressGoals = Array.from(this.goals.values()).filter(g => g.status === 'in-progress');

    if (pendingGoals.length > 5) {
      console.log('[SelfDriven] 待处理目标过多，需要优先处理');
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
      console.log('[SelfDriven] 最近失败经验较多，需要反思');
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
    // 基于当前状态生成反思
    const metrics = this.getMetrics();
    const goals = Array.from(this.goals.values());

    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalGoals = goals.length;

    if (completedGoals < totalGoals * 0.3) {
      this.createReflection('goal', '目标完成率低于30%', '重新评估目标可行性，调整优先级');
    }
  }

  /**
   * 自主执行
   */
  autonomousExecute(): void {
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
        context: `执行目标: ${goal.title}`,
        action: '开始执行',
        result: '进行中',
        success: true,
        impact: 10,
        tags: ['goal', 'execution'],
      });
    }

    // 3. 更新目标进度
    this.updateGoalProgressBasedOnMetrics();

    console.log('[SelfDriven] 自主执行完成');
  }

  /**
   * 基于指标更新目标进度
   */
  private updateGoalProgressBasedOnMetrics(): void {
    const metrics = this.getMetrics();

    // 更新"优化响应时间"目标
    const responseGoal = Array.from(this.goals.values()).find(g => 
      g.title.includes('响应时间')
    );
    if (responseGoal) {
      const avgModelCallTime = metrics.modelCallTime / metrics.modelCalls;
      if (avgModelCallTime < 1000) {
        this.updateGoalProgress(responseGoal.id, 100);
      } else if (avgModelCallTime < 2000) {
        this.updateGoalProgress(responseGoal.id, 50);
      }
    }

    // 更新"提高缓存命中率"目标
    const cacheGoal = Array.from(this.goals.values()).find(g => 
      g.title.includes('缓存命中率')
    );
    if (cacheGoal) {
      const cacheHitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);
      this.updateGoalProgress(cacheGoal.id, cacheHitRate * 100);
    }
  }

  /**
   * 获取自我驱动状态
   */
  getSelfDrivenStatus(): {
    goals: SelfDrivenGoal[];
    experiences: number;
    reflections: number;
    lastReflection: Date;
  } {
    return {
      goals: Array.from(this.goals.values()),
      experiences: this.experiences.length,
      reflections: this.reflections.length,
      lastReflection: this.lastReflectionTime,
    };
  }

  /**
   * 获取推荐行动
   */
  getRecommendedActions(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    // 基于性能指标推荐
    const cacheHitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);
    if (cacheHitRate < 0.5) {
      recommendations.push('优化缓存策略，增加缓存时间');
    }

    const avgModelCallTime = metrics.modelCallTime / metrics.modelCalls;
    if (avgModelCallTime > 2000) {
      recommendations.push('考虑使用更快的模型');
    }

    // 基于目标推荐
    const pendingGoals = Array.from(this.goals.values()).filter(g => g.status === 'pending');
    if (pendingGoals.length > 3) {
      recommendations.push('优先处理高优先级目标');
    }

    return recommendations;
  }

  /**
   * 生成自我驱动报告
   */
  generateSelfDrivenReport(): string {
    const status = this.getSelfDrivenStatus();
    const metrics = this.getMetrics();
    const recommendations = this.getRecommendedActions();

    return `
# OpenClaw 自我驱动报告

## 目标状态
- 总目标数: ${status.goals.length}
- 已完成: ${status.goals.filter(g => g.status === 'completed').length}
- 进行中: ${status.goals.filter(g => g.status === 'in-progress').length}
- 待处理: ${status.goals.filter(g => g.status === 'pending').length}

## 性能指标
- 会话加载次数: ${metrics.sessionLoads}
- 模型调用次数: ${metrics.modelCalls}
- 工具调用次数: ${metrics.toolCalls}
- 缓存命中率: ${((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)}%

## 学习经验
- 总经验数: ${status.experiences}
- 最后反思: ${status.lastReflection.toLocaleString()}

## 推荐行动
${recommendations.map(r => `- ${r}`).join('\n')}
    `.trim();
  }
}

// ==================== 全局实例 ====================

let globalSelfDrivenOptimizer: SelfDrivenAgentOptimizer | null = null;

export function getGlobalSelfDrivenOptimizer(): SelfDrivenAgentOptimizer {
  if (!globalSelfDrivenOptimizer) {
    globalSelfDrivenOptimizer = new SelfDrivenAgentOptimizer();
  }
  return globalSelfDrivenOptimizer;
}

export function resetGlobalSelfDrivenOptimizer(): void {
  globalSelfDrivenOptimizer = null;
}
