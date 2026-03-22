/**
 * OpenClaw 轻量级日志系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的日志记录
 * 2. 快速写入
 * 3. 低计算开销
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
}

export class LightweightLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private minLevel: LogLevel = 'info';

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  /**
   * 记录日志
   */
  log(level: LogLevel, message: string, data?: any): void {
    if (this.shouldLog(level)) {
      const entry: LogEntry = {
        level,
        message,
        timestamp: new Date(),
        data,
      };

      this.logs.push(entry);

      // 限制数量
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }

      // 输出到控制台
      this.output(entry);
    }
  }

  /**
   * 调试
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * 信息
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * 警告
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * 错误
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * 检查是否应该记录
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * 输出日志
   */
  private output(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.data || '');
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data || '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case 'error':
        console.error(prefix, entry.message, entry.data || '');
        break;
    }
  }

  /**
   * 获取日志
   */
  getLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 获取统计
   */
  getStats(): { logCount: number; byLevel: Record<string, number> } {
    const byLevel: Record<string, number> = {};
    for (const log of this.logs) {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
    }
    return { logCount: this.logs.length, byLevel };
  }
}

let globalLogger: LightweightLogger | null = null;

export function getGlobalLogger(): LightweightLogger {
  if (!globalLogger) {
    globalLogger = new LightweightLogger();
  }
  return globalLogger;
}
