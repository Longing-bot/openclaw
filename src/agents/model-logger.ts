/**
 * OpenClaw 模型日志记录器
 * 
 * 记录模型使用日志：
 * 1. 请求日志
 * 2. 响应日志
 * 3. 错误日志
 * 4. 性能日志
 */

export interface ModelLog {
  timestamp: Date;
  type: 'request' | 'response' | 'error' | 'performance';
  provider: string;
  model: string;
  data: any;
}

export class ModelLogger {
  private logs: ModelLog[] = [];
  private maxLogs: number = 1000;

  constructor() {
    console.log('[ModelLogger] 初始化完成');
  }

  /**
   * 记录请求
   */
  logRequest(provider: string, model: string, request: any): void {
    this.addLog({
      timestamp: new Date(),
      type: 'request',
      provider,
      model,
      data: request,
    });
  }

  /**
   * 记录响应
   */
  logResponse(provider: string, model: string, response: any): void {
    this.addLog({
      timestamp: new Date(),
      type: 'response',
      provider,
      model,
      data: response,
    });
  }

  /**
   * 记录错误
   */
  logError(provider: string, model: string, error: any): void {
    this.addLog({
      timestamp: new Date(),
      type: 'error',
      provider,
      model,
      data: error,
    });
  }

  /**
   * 记录性能
   */
  logPerformance(provider: string, model: string, metrics: any): void {
    this.addLog({
      timestamp: new Date(),
      type: 'performance',
      provider,
      model,
      data: metrics,
    });
  }

  /**
   * 添加日志
   */
  private addLog(log: ModelLog): void {
    this.logs.push(log);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * 获取日志
   */
  getLogs(type?: ModelLog['type'], count: number = 100): ModelLog[] {
    let filtered = this.logs;
    if (type) {
      filtered = filtered.filter(l => l.type === type);
    }
    return filtered.slice(-count);
  }

  /**
   * 获取统计
   */
  getStats(): {
    totalLogs: number;
    requestCount: number;
    responseCount: number;
    errorCount: number;
  } {
    const requestCount = this.logs.filter(l => l.type === 'request').length;
    const responseCount = this.logs.filter(l => l.type === 'response').length;
    const errorCount = this.logs.filter(l => l.type === 'error').length;

    return {
      totalLogs: this.logs.length,
      requestCount,
      responseCount,
      errorCount,
    };
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }
}

let globalModelLogger: ModelLogger | null = null;

export function getGlobalModelLogger(): ModelLogger {
  if (!globalModelLogger) {
    globalModelLogger = new ModelLogger();
  }
  return globalModelLogger;
}
