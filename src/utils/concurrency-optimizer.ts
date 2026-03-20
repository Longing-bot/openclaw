/**
 * 并发优化器
 * 用于优化OpenClaw的并发处理
 */

export class ConcurrencyOptimizer {
  private static instance: ConcurrencyOptimizer;
  private semaphore: Map<string, { available: number; waiting: Array<() => void> }> = new Map();
  private locks = new Map<string, boolean>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ConcurrencyOptimizer {
    if (!ConcurrencyOptimizer.instance) {
      ConcurrencyOptimizer.instance = new ConcurrencyOptimizer();
    }
    return ConcurrencyOptimizer.instance;
  }

  /**
   * 优化信号量
   */
  async acquireSemaphore(key: string, maxConcurrency: number = 5): Promise<void> {
    if (!this.semaphore.has(key)) {
      this.semaphore.set(key, { available: maxConcurrency, waiting: [] });
    }

    const sem = this.semaphore.get(key)!;
    
    if (sem.available > 0) {
      sem.available--;
      return Promise.resolve();
    }

    // 等待信号量释放
    return new Promise((resolve) => {
      sem.waiting.push(resolve);
    });
  }

  /**
   * 释放信号量
   */
  releaseSemaphore(key: string): void {
    const sem = this.semaphore.get(key);
    if (!sem) return;

    if (sem.waiting.length > 0) {
      const resolve = sem.waiting.shift()!;
      resolve();
    } else {
      sem.available++;
    }
  }

  /**
   * 优化锁
   */
  async acquireLock(key: string, timeoutMs: number = 5000): Promise<boolean> {
    if (this.locks.get(key)) {
      return false;
    }

    this.locks.set(key, true);
    
    // 设置超时
    const timeout = setTimeout(() => {
      this.locks.delete(key);
    }, timeoutMs);
    
    this.timeouts.set(key, timeout);
    
    return true;
  }

  /**
   * 释放锁
   */
  releaseLock(key: string): void {
    this.locks.delete(key);
    
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  /**
   * 优化并发执行
   */
  async optimizeConcurrency<T>(
    tasks: (() => Promise<T>)[],
    maxConcurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<any>[] = [];

    for (const task of tasks) {
      const promise = task().then((result) => {
        results.push(result);
        executing.splice(executing.indexOf(promise), 1);
      });

      executing.push(promise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    semaphoreKeys: number;
    lockedKeys: number;
    timeoutKeys: number;
  } {
    return {
      semaphoreKeys: this.semaphore.size,
      lockedKeys: this.locks.size,
      timeoutKeys: this.timeouts.size,
    };
  }

  /**
   * 清除所有
   */
  clearAll(): void {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.semaphore.clear();
    this.locks.clear();
    this.timeouts.clear();
  }
}

// 导出单例
export const concurrencyOptimizer = ConcurrencyOptimizer.getInstance();
