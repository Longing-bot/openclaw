/**
 * OpenClaw 自主性模块
 * 
 * 核心功能：
 * 1. 自动识别任务优先级
 * 2. 自主设置和调整目标
 * 3. 自主执行任务（无需人工干预）
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdAt: Date;
  deadline?: Date;
  dependencies?: string[];
  estimatedTime?: number; // 分钟
  actualTime?: number;
  result?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  tasks: Task[];
  progress: number; // 0-100
  createdAt: Date;
  deadline?: Date;
}

export class AutonomyEngine {
  private tasks: Map<string, Task> = new Map();
  private goals: Map<string, Goal> = new Map();
  private taskQueue: string[] = [];
  private isExecuting: boolean = false;
  private maxConcurrentTasks: number = 3;
  private currentTasks: string[] = [];

  constructor() {
    this.startExecutionLoop();
  }

  /**
   * 添加任务
   */
  addTask(task: Omit<Task, 'id' | 'createdAt' | 'status'>): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: Task = {
      ...task,
      id,
      status: 'pending',
      createdAt: new Date(),
    };
    
    this.tasks.set(id, newTask);
    this.taskQueue.push(id);
    this.sortTaskQueue();
    
    return id;
  }

  /**
   * 添加目标
   */
  addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'status' | 'progress'>): string {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGoal: Goal = {
      ...goal,
      id,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };
    
    this.goals.set(id, newGoal);
    
    // 自动为每个目标创建任务
    if (goal.tasks && goal.tasks.length > 0) {
      goal.tasks.forEach(task => {
        this.addTask({
          ...task,
          // 关联到目标
        });
      });
    }
    
    return id;
  }

  /**
   * 排序任务队列（按优先级和截止日期）
   */
  private sortTaskQueue(): void {
    this.taskQueue.sort((a, b) => {
      const taskA = this.tasks.get(a)!;
      const taskB = this.tasks.get(b)!;
      
      // 优先级权重
      const priorityWeight = {
        'critical': 4,
        'high': 3,
        'medium': 2,
        'low': 1,
      };
      
      const weightA = priorityWeight[taskA.priority];
      const weightB = priorityWeight[taskB.priority];
      
      if (weightA !== weightB) {
        return weightB - weightA; // 高优先级在前
      }
      
      // 如果优先级相同，按截止日期排序
      if (taskA.deadline && taskB.deadline) {
        return taskA.deadline.getTime() - taskB.deadline.getTime();
      }
      
      // 没有截止日期的排在后面
      if (taskA.deadline) return -1;
      if (taskB.deadline) return 1;
      
      return 0;
    });
  }

  /**
   * 开始执行循环
   */
  private startExecutionLoop(): void {
    setInterval(() => {
      if (!this.isExecuting && this.currentTasks.length < this.maxConcurrentTasks) {
        this.executeNextTask();
      }
    }, 1000); // 每秒检查一次
  }

  /**
   * 执行下一个任务
   */
  private async executeNextTask(): Promise<void> {
    if (this.taskQueue.length === 0) {
      return;
    }
    
    // 检查依赖
    const taskId = this.taskQueue.find(id => {
      const task = this.tasks.get(id)!;
      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }
      return task.dependencies.every(depId => {
        const depTask = this.tasks.get(depId);
        return depTask && depTask.status === 'completed';
      });
    });
    
    if (!taskId) {
      return; // 没有可执行的任务
    }
    
    const task = this.tasks.get(taskId)!;
    
    // 从队列中移除
    this.taskQueue = this.taskQueue.filter(id => id !== taskId);
    
    // 更新状态
    task.status = 'in-progress';
    this.currentTasks.push(taskId);
    
    // 执行任务（这里只是模拟，实际执行逻辑由外部调用）
    console.log(`[Autonomy] 开始执行任务: ${task.title}`);
    
    // 模拟任务执行时间
    setTimeout(() => {
      this.completeTask(taskId, '任务完成');
    }, (task.estimatedTime || 5) * 1000); // 转换为毫秒
  }

  /**
   * 完成任务
   */
  completeTask(taskId: string, result: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }
    
    task.status = 'completed';
    task.result = result;
    task.actualTime = Date.now() - task.createdAt.getTime();
    
    // 从当前任务列表中移除
    this.currentTasks = this.currentTasks.filter(id => id !== taskId);
    
    // 更新关联的目标进度
    this.updateGoalProgress();
    
    console.log(`[Autonomy] 任务完成: ${task.title}`);
  }

  /**
   * 更新目标进度
   */
  private updateGoalProgress(): void {
    this.goals.forEach(goal => {
      const tasks = Array.from(this.tasks.values()).filter(task => 
        goal.tasks.some(goalTask => goalTask.id === task.id)
      );
      
      if (tasks.length === 0) {
        return;
      }
      
      const completedTasks = tasks.filter(task => task.status === 'completed');
      goal.progress = Math.round((completedTasks.length / tasks.length) * 100);
      
      if (goal.progress === 100) {
        goal.status = 'completed';
        console.log(`[Autonomy] 目标完成: ${goal.title}`);
      } else if (goal.progress > 0) {
        goal.status = 'in-progress';
      }
    });
  }

  /**
   * 获取下一个可执行的任务
   */
  getNextTask(): Task | null {
    if (this.taskQueue.length === 0) {
      return null;
    }
    
    const taskId = this.taskQueue[0];
    return this.tasks.get(taskId) || null;
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      totalTasks: this.tasks.size,
      pendingTasks: Array.from(this.tasks.values()).filter(t => t.status === 'pending').length,
      inProgressTasks: this.currentTasks.length,
      completedTasks: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length,
      totalGoals: this.goals.size,
      activeGoals: Array.from(this.goals.values()).filter(g => g.status === 'in-progress').length,
      completedGoals: Array.from(this.goals.values()).filter(g => g.status === 'completed').length,
    };
  }

  /**
   * 自主识别任务
   * 根据当前状态和目标，自动识别需要执行的任务
   */
  autonomousTaskIdentification(): void {
    // 分析当前状态
    const status = this.getStatus();
    
    // 如果没有待执行的任务，自动创建
    if (status.pendingTasks === 0) {
      this.createAutonomousTasks();
    }
    
    // 如果目标进度慢，调整优先级
    this.adjustTaskPriorities();
  }

  /**
   * 创建自主任务
   */
  private createAutonomousTasks(): void {
    // 示例：创建日常任务
    this.addTask({
      title: '检查系统状态',
      description: '检查 OpenClaw 系统的运行状态',
      priority: 'medium',
      estimatedTime: 5,
    });
    
    this.addTask({
      title: '更新知识库',
      description: '从最近的经验中学习，更新知识库',
      priority: 'low',
      estimatedTime: 10,
    });
    
    this.addTask({
      title: '优化性能',
      description: '分析系统性能，提出优化建议',
      priority: 'high',
      estimatedTime: 15,
    });
  }

  /**
   * 调整任务优先级
   */
  private adjustTaskPriorities(): void {
    // 分析目标进度
    this.goals.forEach(goal => {
      if (goal.status === 'in-progress' && goal.progress < 50) {
        // 如果目标进度慢，提高相关任务的优先级
        goal.tasks.forEach(task => {
          const taskObj = this.tasks.get(task.id);
          if (taskObj && taskObj.status === 'pending') {
            // 提高优先级
            if (taskObj.priority === 'low') {
              taskObj.priority = 'medium';
            } else if (taskObj.priority === 'medium') {
              taskObj.priority = 'high';
            }
          }
        });
      }
    });
    
    // 重新排序队列
    this.sortTaskQueue();
  }
}

// 全局实例
let globalAutonomyEngine: AutonomyEngine | null = null;

export function getGlobalAutonomyEngine(): AutonomyEngine {
  if (!globalAutonomyEngine) {
    globalAutonomyEngine = new AutonomyEngine();
  }
  return globalAutonomyEngine;
}
