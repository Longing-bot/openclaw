/**
 * OpenClaw OODA+ 认知循环系统
 * 
 * 内化自 Van autonomous-agent 项目：
 * https://github.com/maxwellmelo/van-autonomous-agent
 * 
 * 核心概念：
 * 1. OODA+ 认知循环 - Observe, Orient, Decide, Act, Reflect, Evolve
 * 2. 四级目标层次 - Vision, strategic, tactical, micro goals
 * 3. 持久化文件记忆 - 使用 Markdown 文件
 * 4. 个性和情感状态模型 - 好奇心、信心、谨慎、挫败感
 * 5. 自我进化引擎 - 能力差距识别和改进项目管理
 */

// ==================== 类型定义 ====================

export interface Goal {
  id: string;
  title: string;
  description: string;
  level: 'vision' | 'strategic' | 'tactical' | 'micro';
  priority: number; // 1-10
  status: 'pending' | 'active' | 'completed' | 'failed' | 'paused';
  progress: number; // 0-100
  parentId?: string;
  dependencies: string[];
  createdAt: Date;
  completedAt?: Date;
  deadline?: Date;
}

export interface Experience {
  id: string;
  timestamp: Date;
  phase: 'observe' | 'orient' | 'decide' | 'act' | 'reflect' | 'evolve';
  context: string;
  action: string;
  outcome: string;
  success: boolean;
  learnings: string[];
  emotionalImpact: number; // -100 to 100
}

export interface PersonalityState {
  curiosity: number; // 0-100
  confidence: number; // 0-100
  caution: number; // 0-100
  frustration: number; // 0-100
  satisfaction: number; // 0-100
}

export interface CapabilityGap {
  id: string;
  area: string;
  currentLevel: number; // 0-100
  targetLevel: number; // 0-100
  priority: number; // 1-10
  identifiedAt: Date;
  improvementPlan?: string;
}

export interface Reflection {
  id: string;
  timestamp: Date;
  goalId: string;
  expectedOutcome: string;
  actualOutcome: string;
  analysis: string;
  learnings: string[];
  actionItems: string[];
}

// ==================== OODA+ 认知循环 ====================

export class OODACognitiveLoop {
  private goals: Map<string, Goal> = new Map();
  private experiences: Experience[] = [];
  private personality: PersonalityState = {
    curiosity: 70,
    confidence: 60,
    caution: 50,
    frustration: 20,
    satisfaction: 50,
  };
  private capabilityGaps: Map<string, CapabilityGap> = new Map();
  private reflections: Reflection[] = [];
  private cycleCount: number = 0;
  private lastCycleTime: Date = new Date();

  constructor() {
    this.initializeDefaultGoals();
  }

  /**
   * 初始化默认目标
   */
  private initializeDefaultGoals(): void {
    this.addGoal({
      title: '提高系统性能',
      description: '优化代码执行效率，减少响应时间',
      level: 'vision',
      priority: 9,
    });

    this.addGoal({
      title: '扩展知识库',
      description: '学习新技能，扩展能力范围',
      level: 'strategic',
      priority: 8,
    });

    this.addGoal({
      title: '完善文档',
      description: '更新和完善系统文档',
      level: 'tactical',
      priority: 6,
    });
  }

  /**
   * 执行 OODA+ 循环
   */
  async executeCycle(): Promise<void> {
    console.log(`[OODA+] 开始第 ${++this.cycleCount} 次循环`);

    // 1. Observe - 观察
    const observations = await this.observe();
    this.recordExperience('observe', '观察环境', observations.summary, true);

    // 2. Orient - 定向
    const orientation = await this.orient(observations);
    this.recordExperience('orient', '分析情况', orientation.summary, true);

    // 3. Decide - 决策
    const decision = await this.decide(orientation);
    this.recordExperience('decide', '制定决策', decision.summary, true);

    // 4. Act - 行动
    const actionResult = await this.act(decision);
    this.recordExperience('act', '执行行动', actionResult.summary, actionResult.success);

    // 5. Reflect - 反思
    const reflection = await this.reflect(decision, actionResult);
    this.recordExperience('reflect', '反思结果', reflection.summary, true);

    // 6. Evolve - 进化
    await this.evolve(reflection);
    this.recordExperience('evolve', '系统进化', '完成进化', true);

    this.lastCycleTime = new Date();
    console.log(`[OODA+] 循环完成`);
  }

  /**
   * Observe - 观察
   */
  private async observe(): Promise<{ summary: string; data: any }> {
    console.log('[OODA+] Observe - 观察环境');

    // 收集活跃目标
    const activeGoals = Array.from(this.goals.values()).filter(g => g.status === 'active');

    // 收集最近经验
    const recentExperiences = this.experiences.slice(-10);

    // 收集能力差距
    const gaps = Array.from(this.capabilityGaps.values());

    return {
      summary: `观察到 ${activeGoals.length} 个活跃目标，${recentExperiences.length} 条最近经验，${gaps.length} 个能力差距`,
      data: {
        activeGoals,
        recentExperiences,
        capabilityGaps: gaps,
        personality: this.personality,
      },
    };
  }

  /**
   * Orient - 定向
   */
  private async orient(observations: any): Promise<{ summary: string; analysis: any }> {
    console.log('[OODA+] Orient - 分析情况');

    // 分析目标优先级
    const prioritizedGoals = observations.data.activeGoals
      .sort((a: Goal, b: Goal) => b.priority - a.priority);

    // 分析情感状态对决策的影响
    const emotionalInfluence = this.calculateEmotionalInfluence();

    // 识别需要关注的领域
    const areasOfConcern = this.identifyAreasOfConcern(observations.data);

    return {
      summary: `分析完成，最高优先级目标：${prioritizedGoals[0]?.title || '无'}`,
      analysis: {
        prioritizedGoals,
        emotionalInfluence,
        areasOfConcern,
      },
    };
  }

  /**
   * Decide - 决策
   */
  private async decide(orientation: any): Promise<{ summary: string; plan: any }> {
    console.log('[OODA+] Decide - 制定决策');

    // 选择最高优先级目标
    const selectedGoal = orientation.analysis.prioritizedGoals[0];

    if (!selectedGoal) {
      return {
        summary: '没有活跃目标，创建新目标',
        plan: { action: 'create-goal' },
      };
    }

    // 生成行动计划
    const plan = this.generateActionPlan(selectedGoal, orientation.analysis);

    return {
      summary: `为目标 "${selectedGoal.title}" 制定计划`,
      plan,
    };
  }

  /**
   * Act - 行动
   */
  private async act(decision: any): Promise<{ summary: string; success: boolean }> {
    console.log('[OODA+] Act - 执行行动');

    try {
      // 执行计划
      const result = await this.executePlan(decision.plan);

      // 更新目标进度
      if (decision.plan.goalId) {
        this.updateGoalProgress(decision.plan.goalId, result.progress);
      }

      return {
        summary: `行动完成：${result.summary}`,
        success: true,
      };
    } catch (error) {
      return {
        summary: `行动失败：${error instanceof Error ? error.message : String(error)}`,
        success: false,
      };
    }
  }

  /**
   * Reflect - 反思
   */
  private async reflect(decision: any, actionResult: any): Promise<{ summary: string; reflection: Reflection }> {
    console.log('[OODA+] Reflect - 反思结果');

    const reflection: Reflection = {
      id: `reflection_${Date.now()}`,
      timestamp: new Date(),
      goalId: decision.plan.goalId || '',
      expectedOutcome: decision.plan.expectedOutcome || '成功完成',
      actualOutcome: actionResult.summary,
      analysis: this.analyzeOutcome(decision, actionResult),
      learnings: this.extractLearnings(decision, actionResult),
      actionItems: this.generateActionItems(decision, actionResult),
    };

    this.reflections.push(reflection);

    // 更新情感状态
    this.updateEmotionalState(actionResult.success);

    return {
      summary: `反思完成，提取 ${reflection.learnings.length} 条经验`,
      reflection,
    };
  }

  /**
   * Evolve - 进化
   */
  private async evolve(reflection: Reflection): Promise<void> {
    console.log('[OODA+] Evolve - 系统进化');

    // 处理反思记录，更新能力
    for (const learning of reflection.learnings) {
      this.processLearning(learning);
    }

    // 识别新的能力差距
    this.identifyCapabilityGaps();

    // 调整策略方向
    this.adjustStrategy(reflection);

    // 关闭完成的目标
    this.closeCompletedGoals();
  }

  /**
   * 添加目标
   */
  addGoal(goal: Omit<Goal, 'id' | 'status' | 'progress' | 'createdAt' | 'dependencies'>): string {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGoal: Goal = {
      ...goal,
      id,
      status: 'pending',
      progress: 0,
      dependencies: [],
      createdAt: new Date(),
    };

    this.goals.set(id, newGoal);
    console.log(`[OODA+] 添加目标: ${goal.title}`);
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
        console.log(`[OODA+] 目标完成: ${goal.title}`);
      } else if (goal.progress > 0) {
        goal.status = 'active';
      }
    }
  }

  /**
   * 记录经验
   */
  private recordExperience(phase: Experience['phase'], context: string, outcome: string, success: boolean): void {
    const experience: Experience = {
      id: `exp_${Date.now()}`,
      timestamp: new Date(),
      phase,
      context,
      action: '',
      outcome,
      success,
      learnings: [],
      emotionalImpact: success ? 10 : -10,
    };

    this.experiences.push(experience);

    // 限制经验数量
    if (this.experiences.length > 1000) {
      this.experiences = this.experiences.slice(-1000);
    }
  }

  /**
   * 计算情感影响
   */
  private calculateEmotionalInfluence(): number {
    return (
      this.personality.curiosity * 0.3 +
      this.personality.confidence * 0.3 -
      this.personality.caution * 0.2 -
      this.personality.frustration * 0.2
    );
  }

  /**
   * 识别关注领域
   */
  private identifyAreasOfConcern(data: any): string[] {
    const concerns: string[] = [];

    // 检查失败经验
    const failedExperiences = data.recentExperiences.filter((e: Experience) => !e.success);
    if (failedExperiences.length > 3) {
      concerns.push('近期失败经验较多');
    }

    // 检查能力差距
    const highPriorityGaps = data.capabilityGaps.filter((g: CapabilityGap) => g.priority > 7);
    if (highPriorityGaps.length > 0) {
      concerns.push('存在高优先级能力差距');
    }

    return concerns;
  }

  /**
   * 生成行动计划
   */
  private generateActionPlan(goal: Goal, analysis: any): any {
    return {
      goalId: goal.id,
      steps: [
        `分析目标 "${goal.title}" 的需求`,
        `制定具体执行步骤`,
        `执行并监控进度`,
        `评估结果并调整`,
      ],
      expectedOutcome: '完成目标',
      priority: goal.priority,
    };
  }

  /**
   * 执行计划
   */
  private async executePlan(plan: any): Promise<{ summary: string; progress: number }> {
    // 模拟执行
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      summary: `执行计划完成`,
      progress: Math.min(100, (plan.priority || 5) * 10),
    };
  }

  /**
   * 分析结果
   */
  private analyzeOutcome(decision: any, actionResult: any): string {
    if (actionResult.success) {
      return '行动成功，目标进展顺利';
    } else {
      return '行动失败，需要调整策略';
    }
  }

  /**
   * 提取经验
   */
  private extractLearnings(decision: any, actionResult: any): string[] {
    const learnings: string[] = [];

    if (actionResult.success) {
      learnings.push('成功经验：按照计划执行有效');
    } else {
      learnings.push('失败教训：需要更好的规划和风险控制');
    }

    return learnings;
  }

  /**
   * 生成行动项
   */
  private generateActionItems(decision: any, actionResult: any): string[] {
    const items: string[] = [];

    if (!actionResult.success) {
      items.push('分析失败原因');
      items.push('调整行动计划');
      items.push('重新执行');
    }

    return items;
  }

  /**
   * 更新情感状态
   */
  private updateEmotionalState(success: boolean): void {
    if (success) {
      this.personality.confidence = Math.min(100, this.personality.confidence + 5);
      this.personality.satisfaction = Math.min(100, this.personality.satisfaction + 10);
      this.personality.frustration = Math.max(0, this.personality.frustration - 5);
    } else {
      this.personality.confidence = Math.max(0, this.personality.confidence - 5);
      this.personality.frustration = Math.min(100, this.personality.frustration + 10);
    }
  }

  /**
   * 处理学习
   */
  private processLearning(learning: string): void {
    console.log(`[OODA+] 处理学习: ${learning}`);
    // 根据学习内容更新能力
  }

  /**
   * 识别能力差距
   */
  private identifyCapabilityGaps(): void {
    // 分析最近的失败经验
    const recentFailures = this.experiences.slice(-50).filter(e => !e.success);

    for (const failure of recentFailures) {
      const gapId = `gap_${failure.phase}`;
      if (!this.capabilityGaps.has(gapId)) {
        this.capabilityGaps.set(gapId, {
          id: gapId,
          area: failure.phase,
          currentLevel: 50,
          targetLevel: 80,
          priority: 7,
          identifiedAt: new Date(),
        });
      }
    }
  }

  /**
   * 调整策略
   */
  private adjustStrategy(reflection: Reflection): void {
    // 根据反思结果调整策略
    if (reflection.learnings.length > 0) {
      this.personality.curiosity = Math.min(100, this.personality.curiosity + 2);
    }
  }

  /**
   * 关闭完成的目标
   */
  private closeCompletedGoals(): void {
    for (const [id, goal] of this.goals) {
      if (goal.status === 'completed' && goal.progress === 100) {
        console.log(`[OODA+] 关闭完成目标: ${goal.title}`);
      }
    }
  }

  /**
   * 获取状态
   */
  getState(): {
    goals: Goal[];
    experiences: number;
    personality: PersonalityState;
    capabilityGaps: CapabilityGap[];
    reflections: number;
    cycleCount: number;
  } {
    return {
      goals: Array.from(this.goals.values()),
      experiences: this.experiences.length,
      personality: this.personality,
      capabilityGaps: Array.from(this.capabilityGaps.values()),
      reflections: this.reflections.length,
      cycleCount: this.cycleCount,
    };
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    const state = this.getState();

    return `
# OODA+ 认知循环报告

## 循环状态
- 循环次数: ${state.cycleCount}
- 经验数量: ${state.experiences}
- 反思数量: ${state.reflections}

## 目标状态
${state.goals.map(g => `- ${g.title} (${g.level}): ${g.progress}%`).join('\n')}

## 情感状态
- 好奇心: ${state.personality.curiosity}
- 信心: ${state.personality.confidence}
- 谨慎: ${state.personality.caution}
- 挫败感: ${state.personality.frustration}
- 满意度: ${state.personality.satisfaction}

## 能力差距
${state.capabilityGaps.map(g => `- ${g.area}: ${g.currentLevel}/${g.targetLevel}`).join('\n')}
    `.trim();
  }
}

// ==================== 全局实例 ====================

let globalOODA: OODACognitiveLoop | null = null;

export function getGlobalOODA(): OODACognitiveLoop {
  if (!globalOODA) {
    globalOODA = new OODACognitiveLoop();
  }
  return globalOODA;
}

export function resetGlobalOODA(): void {
  globalOODA = null;
}
