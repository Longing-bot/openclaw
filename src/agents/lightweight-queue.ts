/**
 * OpenClaw 轻量级队列系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的任务队列
 * 2. 快速处理
 * 3. 低计算开销
 */

export interface QueueTask {
  id: string;
  priority: number;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

export class LightweightQueue {
  private queue: QueueTask[] = [];
  private processing: boolean = false;

  constructor() {
    console.log('[Queue] 初始化完成');
  }

  /**
   * 入队
   */
  enqueue(data: any, priority: number = 1): string {
    const id = `task_${Date.now()}`;
    const task: QueueTask = {
      id,
      priority,
      data,
      status: 'pending',
      createdAt: new Date(),
    };

    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority);

    return id;
  }

  /**
   * 出队
   */
  dequeue(): QueueTask | null {
    if (this.queue.length === 0) return null;

    const task = this.queue.shift()!;
    task.status = 'processing';
    return task;
  }

  /**
   * 完成任务
   */
  complete(id: string): void {
    const task = this.queue.find(t => t.id === id);
    if (task) {
      task.status = 'completed';
    }
  }

  /**
   * 获取队列状态
   */
  getStatus(): { pending: number; processing: number; completed: number } {
    const pending = this.queue.filter(t => t.status === 'pending').length;
    const processing = this.queue.filter(t => t.status === 'processing').length;
    const completed = this.queue.filter(t => t.status === 'completed').length;
    return { pending, processing, completed };
  }
}

let globalQueue: LightweightQueue | null = null;

export function getGlobalQueue(): LightweightQueue {
  if (!globalQueue) {
    globalQueue = new LightweightQueue();
  }
  return globalQueue;
}
