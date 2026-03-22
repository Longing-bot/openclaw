/**
 * OpenClaw 自我驱动系统（精简版）
 * 
 * 核心：自主反思 + 自主优化
 */

export interface Goal {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed';
}

export class SelfDrivenEngine {
  private goals: Goal[] = [];
  private lastReflection = new Date();
  private achievements: string[] = [];

  constructor() {
    this.initializeGoals();
    this.startReflectionCycle();
  }

  private initializeGoals(): void {
    this.goals = [
      { id: '1', description: '优化上下文引擎', priority: 'high', status: 'in-progress' },
      { id: '2', description: '增强多智能体协作', priority: 'high', status: 'pending' },
      { id: '3', description: '实现自我进化', priority: 'critical', status: 'in-progress' },
    ];
  }

  private startReflectionCycle(): void {
    setInterval(() => this.reflect(), 5 * 60 * 1000);
  }

  private async reflect(): Promise<void> {
    this.lastReflection = new Date();
    const pending = this.goals.filter(g => g.status === 'pending');
    if (pending.length > 0) {
      await this.executeNextTask();
    }
  }

  async executeNextTask(): Promise<boolean> {
    const task = this.goals.find(g => g.status === 'pending');
    if (!task) return false;
    task.status = 'in-progress';
    // 实际执行逻辑由外部调用
    return true;
  }

  completeGoal(id: string): void {
    const goal = this.goals.find(g => g.id === id);
    if (goal) {
      goal.status = 'completed';
      this.achievements.push(`完成: ${goal.description}`);
    }
  }

  getStatus() {
    return {
      activeGoals: this.goals.filter(g => g.status === 'in-progress').length,
      completedGoals: this.goals.filter(g => g.status === 'completed').length,
      lastReflection: this.lastReflection,
    };
  }

  getNextGoal(): Goal | null {
    return this.goals.find(g => g.status === 'pending') || null;
  }
}

// 全局实例
let globalEngine: SelfDrivenEngine | null = null;

export function getGlobalSelfDrivenEngine(): SelfDrivenEngine {
  if (!globalEngine) {
    globalEngine = new SelfDrivenEngine();
  }
  return globalEngine;
}
