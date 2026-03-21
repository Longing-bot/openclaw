/**
 * OpenClaw 模型任务分解器
 * 
 * 分解复杂任务：
 * 1. 任务拆分
 * 2. 依赖分析
 * 3. 并行优化
 */

export interface Task {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  priority: number;
  estimatedTime: number;
}

export class ModelTaskDecomposer {
  constructor() {
    console.log('[TaskDecomposer] 初始化完成');
  }

  /**
   * 分解任务
   */
  decompose(goal: string): Task[] {
    const tasks: Task[] = [];

    // 简单分解
    const parts = this.splitGoal(goal);

    for (let i = 0; i < parts.length; i++) {
      tasks.push({
        id: `task_${i}`,
        name: parts[i],
        description: `完成: ${parts[i]}`,
        dependencies: i > 0 ? [`task_${i - 1}`] : [],
        priority: parts.length - i,
        estimatedTime: 1000,
      });
    }

    return tasks;
  }

  /**
   * 拆分目标
   */
  private splitGoal(goal: string): string[] {
    // 按标点符号拆分
    const parts = goal.split(/[，。、；！？,;.!?]/);
    return parts.filter(p => p.trim().length > 0).map(p => p.trim());
  }

  /**
   * 分析依赖
   */
  analyzeDependencies(tasks: Task[]): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    for (const task of tasks) {
      dependencies.set(task.id, task.dependencies);
    }

    return dependencies;
  }

  /**
   * 优化并行执行
   */
  optimizeParallel(tasks: Task[]): Task[][] {
    const levels: Task[][] = [];
    const completed = new Set<string>();

    while (completed.size < tasks.length) {
      const level: Task[] = [];

      for (const task of tasks) {
        if (completed.has(task.id)) continue;

        const depsCompleted = task.dependencies.every(d => completed.has(d));
        if (depsCompleted) {
          level.push(task);
        }
      }

      if (level.length === 0) break;

      levels.push(level);
      for (const task of level) {
        completed.add(task.id);
      }
    }

    return levels;
  }
}

let globalTaskDecomposer: ModelTaskDecomposer | null = null;

export function getGlobalTaskDecomposer(): ModelTaskDecomposer {
  if (!globalTaskDecomposer) {
    globalTaskDecomposer = new ModelTaskDecomposer();
  }
  return globalTaskDecomposer;
}
