/**
 * 消息优化器
 * 用于优化OpenClaw的消息处理
 */

export class MessageOptimizer {
  private static instance: MessageOptimizer;
  private messageQueue = new Map<string, any[]>();
  private processingLocks = new Map<string, boolean>();
  private messageCache = new Map<string, any>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): MessageOptimizer {
    if (!MessageOptimizer.instance) {
      MessageOptimizer.instance = new MessageOptimizer();
    }
    return MessageOptimizer.instance;
  }

  /**
   * 优化消息处理
   */
  async optimizeMessageProcessing(
    channelId: string,
    message: any,
    processor: (msg: any) => Promise<any>
  ): Promise<any> {
    // 添加到队列
    if (!this.messageQueue.has(channelId)) {
      this.messageQueue.set(channelId, []);
    }
    this.messageQueue.get(channelId)!.push(message);

    // 检查是否正在处理
    if (this.processingLocks.get(channelId)) {
      return Promise.resolve();
    }

    // 开始处理
    this.processingLocks.set(channelId, true);
    
    try {
      while (this.messageQueue.get(channelId)!.length > 0) {
        const msg = this.messageQueue.get(channelId)!.shift();
        await processor(msg);
      }
    } finally {
      this.processingLocks.set(channelId, false);
    }
  }

  /**
   * 优化消息缓存
   */
  optimizeMessageCache(messageId: string, message: any): void {
    this.messageCache.set(messageId, message);
  }

  /**
   * 获取缓存消息
   */
  getCachedMessage(messageId: string): any | undefined {
    return this.messageCache.get(messageId);
  }

  /**
   * 优化消息批处理
   */
  async optimizeBatchProcessing(
    messages: any[],
    processor: (msg: any) => Promise<any>,
    batchSize: number = 10
  ): Promise<any[]> {
    const results: any[] = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(msg => processor(msg));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    queuedMessages: number;
    processingChannels: number;
    cachedMessages: number;
  } {
    let queuedMessages = 0;
    for (const queue of this.messageQueue.values()) {
      queuedMessages += queue.length;
    }

    let processingChannels = 0;
    for (const processing of this.processingLocks.values()) {
      if (processing) processingChannels++;
    }

    return {
      queuedMessages,
      processingChannels,
      cachedMessages: this.messageCache.size,
    };
  }

  /**
   * 清除所有
   */
  clearAll(): void {
    this.messageQueue.clear();
    this.processingLocks.clear();
    this.messageCache.clear();
  }
}

// 导出单例
export const messageOptimizer = MessageOptimizer.getInstance();
