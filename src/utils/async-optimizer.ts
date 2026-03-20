/**
 * 异步优化器
 * 用于优化OpenClaw的异步处理
 */

export class AsyncOptimizer {
  private static instance: AsyncOptimizer;
  private pendingTasks = new Map<string, Promise<any>>();
  private taskQueue: Array<{ id: string; task: () => Promise<any> }> = [];
  private maxConcurrency: number;
  private activeTasks = 0;

  private constructor(maxConcurrency: number = 10) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * 获取单例实例
   */
  static getInstance(maxConcurrency: number = 10): AsyncOptimizer {
    if (!AsyncOptimizer.instance) {
      AsyncOptimizer.instance = new AsyncOptimizer(maxConcurrency);
    }
    return AsyncOptimizer.instance;
  }

  /**
   * 优化异步任务执行
   */
  async optimizeTask<T>(taskId: string, task: () => Promise<T>): Promise<T> {
    // 检查是否已有相同任务在执行
    if (this.pendingTasks.has(taskId)) {
      return this.pendingTasks.get(taskId) as Promise<T>;
    }

    // 创建新任务
    const promise = this.executeTask(taskId, task);
    this.pendingTasks.set(taskId, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingTasks.delete(taskId);
    }
  }

  /**
   * 执行任务
   */
  private async executeTask<T>(taskId: string, task: () => Promise<T>): Promise<T> {
    // 等待并发槽位
    while (this.activeTasks >= this.maxConcurrency) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.activeTasks++;
    try {
      return await task();
    } finally {
      this.activeTasks--;
    }
  }

  /**
   * 优化批量任务执行
   */
  async optimizeBatchTasks<T>(
    tasks: Array<{ id: string; task: () => Promise<T> }>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchPromises = batch.map(({ id, task }) => this.optimizeTask(id, task));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 优化任务队列
   */
  async optimizeTaskQueue<T>(
    taskId: string,
    task: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        id: taskId,
        task: async () => {
          try {
            const result = await task();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        }
      });

      this.processTaskQueue();
    });
  }

  /**
   * 处理任务队列
   */
  private async processTaskQueue(): Promise<void> {
    if (this.activeTasks >= this.maxConcurrency || this.taskQueue.length === 0) {
      return;
    }

    const item = this.taskQueue.shift();
    if (!item) return;

    this.activeTasks++;
    try {
      await item.task();
    } finally {
      this.activeTasks--;
      this.processTaskQueue();
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    pendingTasks: number;
    activeTasks: number;
    queuedTasks: number;
    maxConcurrency: number;
  } {
    return {
      pendingTasks: this.pendingTasks.size,
      activeTasks: this.activeTasks,
      queuedTasks: this.taskQueue.length,
      maxConcurrency: this.maxConcurrency,
    };
  }

  /**
   * 清除所有
   */
  clearAll(): void {
    this.pendingTasks.clear();
    this.taskQueue = [];
    this.activeTasks = 0;
  }
}

// 导出单例
export const asyncOptimizer = AsyncOptimizer.getInstance();
