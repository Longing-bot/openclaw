/**
 * 渠道优化器
 * 用于优化OpenClaw的消息渠道处理
 */

export class ChannelOptimizer {
  private static instance: ChannelOptimizer;
  private messageBuffer = new Map<string, any[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private connectionStatus = new Map<string, boolean>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ChannelOptimizer {
    if (!ChannelOptimizer.instance) {
      ChannelOptimizer.instance = new ChannelOptimizer();
    }
    return ChannelOptimizer.instance;
  }

  /**
   * 优化消息发送
   */
  async optimizeMessageSend(
    channelId: string,
    message: any,
    sender: (msg: any) => Promise<any>
  ): Promise<any> {
    // 添加到缓冲区
    if (!this.messageBuffer.has(channelId)) {
      this.messageBuffer.set(channelId, []);
    }
    this.messageBuffer.get(channelId)!.push(message);

    // 设置批量发送定时器
    if (!this.batchTimers.has(channelId)) {
      const timer = setTimeout(() => {
        this.flushMessageBuffer(channelId, sender);
      }, 100); // 100ms批量发送
      this.batchTimers.set(channelId, timer);
    }

    return Promise.resolve();
  }

  /**
   * 刷新消息缓冲区
   */
  private async flushMessageBuffer(
    channelId: string,
    sender: (msg: any) => Promise<any>
  ): Promise<void> {
    const buffer = this.messageBuffer.get(channelId);
    if (!buffer || buffer.length === 0) return;

    // 清除定时器
    const timer = this.batchTimers.get(channelId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(channelId);
    }

    // 批量发送
    const messages = [...buffer];
    this.messageBuffer.set(channelId, []);

    for (const message of messages) {
      try {
        await sender(message);
      } catch (error) {
        console.error(`Failed to send message to ${channelId}:`, error);
      }
    }
  }

  /**
   * 优化连接管理
   */
  optimizeConnection(channelId: string, connector: () => Promise<any>): Promise<any> {
    // 检查连接状态
    if (this.connectionStatus.get(channelId)) {
      return Promise.resolve();
    }

    // 建立连接
    return connector().then(() => {
      this.connectionStatus.set(channelId, true);
    });
  }

  /**
   * 优化断开连接
   */
  optimizeDisconnection(channelId: string, disconnector: () => Promise<any>): Promise<any> {
    // 检查连接状态
    if (!this.connectionStatus.get(channelId)) {
      return Promise.resolve();
    }

    // 断开连接
    return disconnector().then(() => {
      this.connectionStatus.set(channelId, false);
      
      // 清理缓冲区
      this.messageBuffer.delete(channelId);
      this.batchTimers.delete(channelId);
    });
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    bufferedMessages: number;
    activeConnections: number;
    batchTimers: number;
  } {
    let bufferedMessages = 0;
    for (const buffer of this.messageBuffer.values()) {
      bufferedMessages += buffer.length;
    }

    let activeConnections = 0;
    for (const status of this.connectionStatus.values()) {
      if (status) activeConnections++;
    }

    return {
      bufferedMessages,
      activeConnections,
      batchTimers: this.batchTimers.size,
    };
  }

  /**
   * 清除所有
   */
  clearAll(): void {
    // 清除所有定时器
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }

    this.messageBuffer.clear();
    this.batchTimers.clear();
    this.connectionStatus.clear();
  }
}

// 导出单例
export const channelOptimizer = ChannelOptimizer.getInstance();
