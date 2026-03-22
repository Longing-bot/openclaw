/**
 * OpenClaw 轻量级重试系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的重试逻辑
 * 2. 快速重试
 * 3. 低计算开销
 */

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff: number;
}

export class LightweightRetrySystem {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      delay: 1000,
      backoff: 2,
      ...config,
    };
  }

  /**
   * 执行带重试的操作
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.maxAttempts) {
          const delay = this.config.delay * Math.pow(this.config.backoff, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * 获取配置
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

let globalRetrySystem: LightweightRetrySystem | null = null;

export function getGlobalRetrySystem(): LightweightRetrySystem {
  if (!globalRetrySystem) {
    globalRetrySystem = new LightweightRetrySystem();
  }
  return globalRetrySystem;
}
