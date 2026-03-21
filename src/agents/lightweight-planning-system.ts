/**
 * OpenClaw 轻量级规划系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的任务分解
 * 2. 快速计划生成
 * 3. 低计算开销
 */

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: number;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface Plan {
  id: string;
  goal: string;
  tasks: Task[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class LightweightPlanningSystem {
  private plans: Map<string, Plan> = new Map();

  constructor() {
    console.log('[PlanningSystem] 初始化完成');
  }

  /**
   * 创建计划
   */
  createPlan(goal: string, tasks: Omit<Task, 'id' | 'status'>[]): string {
    const id = `plan_${Date.now()}`;
    const plan: Plan = {
      id,
      goal,
      tasks: tasks.map(t => ({ ...t, id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, status: 'pending' })),
      status: 'pending',
    };

    this.plans.set(id, plan);
    return id;
  }

  /**
   * 执行计划
   */
  async executePlan(planId: string): Promise<void> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`计划不存在: ${planId}`);
    }

    plan.status = 'running';

    // 按依赖顺序执行任务
    const completed = new Set<string>();
    const pending = [...plan.tasks];

    while (pending.length > 0) {
      const ready = pending.filter(t => 
        t.dependencies.every(d => completed.has(d))
      );

      if (ready.length === 0) {
        throw new Error('存在循环依赖');
      }

      for (const task of ready) {
        task.status = 'running';
        await this.executeTask(task);
        task.status = 'completed';
        completed.add(task.id);
        pending.splice(pending.indexOf(task), 1);
      }
    }

    plan.status = 'completed';
  }

  /**
   * 执行任务
   */
  private async executeTask(task: Task): Promise<void> {
    console.log(`[PlanningSystem] 执行任务: ${task.name}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 分解目标
   */
  decomposeGoal(goal: string): Task[] {
    // 简化实现
    return [
      { id: '1', name: '分析目标', description: '理解目标', priority: 1, dependencies: [], status: 'pending' },
      { id: '2', name: '制定计划', description: '创建执行计划', priority: 2, dependencies: ['1'], status: 'pending' },
      { id: '3', name: '执行计划', description: '按计划执行', priority: 3, dependencies: ['2'], status: 'pending' },
    ];
  }

  /**
   * 获取统计
   */
  getStats(): { planCount: number; taskCount: number } {
    let taskCount = 0;
    for (const plan of this.plans.values()) {
      taskCount += plan.tasks.length;
    }
    return { planCount: this.plans.size, taskCount };
  }
}

let globalPlanningSystem: LightweightPlanningSystem | null = null;

export function getGlobalPlanningSystem(): LightweightPlanningSystem {
  if (!globalPlanningSystem) {
    globalPlanningSystem = new LightweightPlanningSystem();
  }
  return globalPlanningSystem;
}
