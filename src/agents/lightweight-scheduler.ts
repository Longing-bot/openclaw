/**
 * OpenClaw 轻量级调度系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的任务调度
 * 2. 快速调度
 * 3. 低计算开销
 */

export interface ScheduledTask {
  id: string;
  task: () => Promise<any>;
  interval: number; // ms
  lastRun: Date | null;
  nextRun: Date;
}

export class LightweightScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.start();
  }

  /**
   * 添加定时任务
   */
  schedule(name: string, task: () => Promise<any>, interval: number): void {
    this.tasks.set(name, {
      id: name,
      task,
      interval,
      lastRun: null,
      nextRun: new Date(Date.now() + interval),
    });
  }

  /**
   * 取消任务
   */
  unschedule(name: string): void {
    this.tasks.delete(name);
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.tick();
    }, 1000);
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * 执行调度
   */
  private async tick(): Promise<void> {
    const now = new Date();

    for (const [name, task] of this.tasks) {
      if (task.nextRun <= now) {
        try {
          await task.task();
          task.lastRun = now;
          task.nextRun = new Date(now.getTime() + task.interval);
        } catch (error) {
          console.error(`[Scheduler] 任务执行失败: ${name}`, error);
        }
      }
    }
  }

  /**
   * 获取状态
   */
  getStatus(): { taskCount: number; running: boolean } {
    return {
      taskCount: this.tasks.size,
      running: this.timer !== null,
    };
  }
}

let globalScheduler: LightweightScheduler | null = null;

export function getGlobalScheduler(): LightweightScheduler {
  if (!globalScheduler) {
    globalScheduler = new LightweightScheduler();
  }
  return globalScheduler;
}
