/**
 * 日志优化器
 * 用于优化OpenClaw的日志处理
 */

export class LogOptimizer {
  private static instance: LogOptimizer;
  private logBuffer: any[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private logLevels = new Map<string, number>();

  private constructor() {
    this.logLevels.set('error', 0);
    this.logLevels.set('warn', 1);
    this.logLevels.set('info', 2);
    this.logLevels.set('debug', 3);
  }

  /**
   * 获取单例实例
   */
  static getInstance(): LogOptimizer {
    if (!LogOptimizer.instance) {
      LogOptimizer.instance = new LogOptimizer();
    }
    return LogOptimizer.instance;
  }

  /**
   * 优化日志记录
   */
  optimizeLog(level: string, message: string, meta?: any): void {
    // 添加到缓冲区
    this.logBuffer.push({
      timestamp: Date.now(),
      level,
      message,
      meta,
    });

    // 设置刷新定时器
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushLogs();
      }, 1000); // 1秒批量刷新
    }
  }

  /**
   * 刷新日志
   */
  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    // 清除定时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // 批量处理日志
    const logs = [...this.logBuffer];
    this.logBuffer = [];

    // 这里可以添加实际的日志处理逻辑
    // 例如：写入文件、发送到日志服务等
    for (const log of logs) {
      console.log(`[${log.level.toUpperCase()}] ${log.message}`);
    }
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level: string): void {
    // 可以根据需要实现日志级别过滤
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    bufferedLogs: number;
    hasFlushTimer: boolean;
  } {
    return {
      bufferedLogs: this.logBuffer.length,
      hasFlushTimer: this.flushTimer !== null,
    };
  }

  /**
   * 清除所有
   */
  clearAll(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.logBuffer = [];
  }
}

// 导出单例
export const logOptimizer = LogOptimizer.getInstance();
