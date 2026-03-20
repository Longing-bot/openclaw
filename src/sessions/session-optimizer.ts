/**
 * 会话优化器
 * 用于优化OpenClaw的会话管理
 */

export class SessionOptimizer {
  private static instance: SessionOptimizer;
  private sessionCache = new Map<string, any>();
  private messageQueue = new Map<string, any[]>();
  private processingLocks = new Map<string, boolean>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): SessionOptimizer {
    if (!SessionOptimizer.instance) {
      SessionOptimizer.instance = new SessionOptimizer();
    }
    return SessionOptimizer.instance;
  }

  /**
   * 优化会话加载
   */
  async optimizeSessionLoad(sessionId: string, loader: () => Promise<any>): Promise<any> {
    // 检查缓存
    if (this.sessionCache.has(sessionId)) {
      return this.sessionCache.get(sessionId);
    }

    // 加载会话
    const session = await loader();
    
    // 缓存会话
    this.sessionCache.set(sessionId, session);
    
    return session;
  }

  /**
   * 优化消息处理
   */
  async optimizeMessageProcessing(sessionId: string, message: any, processor: (msg: any) => Promise<any>): Promise<any> {
    // 添加到队列
    if (!this.messageQueue.has(sessionId)) {
      this.messageQueue.set(sessionId, []);
    }
    this.messageQueue.get(sessionId)!.push(message);

    // 检查是否正在处理
    if (this.processingLocks.get(sessionId)) {
      return Promise.resolve();
    }

    // 开始处理
    this.processingLocks.set(sessionId, true);
    
    try {
      while (this.messageQueue.get(sessionId)!.length > 0) {
        const msg = this.messageQueue.get(sessionId)!.shift();
        await processor(msg);
      }
    } finally {
      this.processingLocks.set(sessionId, false);
    }
  }

  /**
   * 优化会话清理
   */
  optimizeSessionCleanup(sessionId: string): void {
    this.sessionCache.delete(sessionId);
    this.messageQueue.delete(sessionId);
    this.processingLocks.delete(sessionId);
  }

  /**
   * 获取会话统计
   */
  getSessionStats(): {
    cachedSessions: number;
    queuedMessages: number;
    processingLocks: number;
  } {
    let queuedMessages = 0;
    for (const queue of this.messageQueue.values()) {
      queuedMessages += queue.length;
    }

    return {
      cachedSessions: this.sessionCache.size,
      queuedMessages,
      processingLocks: this.processingLocks.size,
    };
  }

  /**
   * 清除所有缓存
   */
  clearAllCaches(): void {
    this.sessionCache.clear();
    this.messageQueue.clear();
    this.processingLocks.clear();
  }
}

// 导出单例
export const sessionOptimizer = SessionOptimizer.getInstance();
