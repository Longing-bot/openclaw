/**
 * 存储优化器
 * 用于优化OpenClaw的数据存储
 */

export class StorageOptimizer {
  private static instance: StorageOptimizer;
  private readCache = new Map<string, any>();
  private writeBuffer = new Map<string, any>();
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): StorageOptimizer {
    if (!StorageOptimizer.instance) {
      StorageOptimizer.instance = new StorageOptimizer();
    }
    return StorageOptimizer.instance;
  }

  /**
   * 优化读取操作
   */
  async optimizeRead(key: string, reader: () => Promise<any>): Promise<any> {
    // 检查缓存
    if (this.readCache.has(key)) {
      return this.readCache.get(key);
    }

    // 读取数据
    const data = await reader();
    
    // 缓存数据
    this.readCache.set(key, data);
    
    return data;
  }

  /**
   * 优化写入操作
   */
  optimizeWrite(key: string, data: any, writer: (key: string, data: any) => Promise<void>): void {
    // 添加到写入缓冲区
    this.writeBuffer.set(key, data);

    // 设置刷新定时器
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushWriteBuffer(writer);
      }, 1000); // 1秒批量写入
    }
  }

  /**
   * 刷新写入缓冲区
   */
  private async flushWriteBuffer(writer: (key: string, data: any) => Promise<void>): Promise<void> {
    if (this.writeBuffer.size === 0) return;

    // 清除定时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // 批量写入
    const entries = [...this.writeBuffer.entries()];
    this.writeBuffer.clear();

    for (const [key, data] of entries) {
      try {
        await writer(key, data);
        // 更新读取缓存
        this.readCache.set(key, data);
      } catch (error) {
        console.error(`Failed to write ${key}:`, error);
      }
    }
  }

  /**
   * 优化删除操作
   */
  optimizeDelete(key: string, deleter: (key: string) => Promise<void>): Promise<void> {
    // 从缓存中删除
    this.readCache.delete(key);
    this.writeBuffer.delete(key);

    // 执行删除
    return deleter(key);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    cachedReads: number;
    bufferedWrites: number;
    hasFlushTimer: boolean;
  } {
    return {
      cachedReads: this.readCache.size,
      bufferedWrites: this.writeBuffer.size,
      hasFlushTimer: this.flushTimer !== null,
    };
  }

  /**
   * 清除所有缓存
   */
  clearAllCaches(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.readCache.clear();
    this.writeBuffer.clear();
  }
}

// 导出单例
export const storageOptimizer = StorageOptimizer.getInstance();
