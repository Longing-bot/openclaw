/**
 * OpenClaw 模型并行执行器
 * 
 * 并行执行多个模型请求：
 * 1. 并行调用多个模型
 * 2. 结果合并
 * 3. 性能优化
 * 4. 负载均衡
 */

export interface ParallelRequest {
  id: string;
  provider: string;
  model: string;
  messages: any[];
  priority: number;
}

export interface ParallelResult {
  id: string;
  provider: string;
  model: string;
  response: string;
  duration: number;
  success: boolean;
}

export class ModelParallelExecutor {
  private maxConcurrency: number = 5;
  private activeRequests: number = 0;
  private queue: ParallelRequest[] = [];

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
    console.log('[ParallelExecutor] 初始化完成');
  }

  /**
   * 并行执行
   */
  async executeParallel(
    requests: ParallelRequest[],
    handler: (request: ParallelRequest) => Promise<string>
  ): Promise<ParallelResult[]> {
    const results: ParallelResult[] = [];

    // 按优先级排序
    const sorted = [...requests].sort((a, b) => b.priority - a.priority);

    // 分批执行
    const batches = this.createBatches(sorted, this.maxConcurrency);

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(async (request) => {
          const startTime = Date.now();
          try {
            const response = await handler(request);
            return {
              id: request.id,
              provider: request.provider,
              model: request.model,
              response,
              duration: Date.now() - startTime,
              success: true,
            };
          } catch (error) {
            return {
              id: request.id,
              provider: request.provider,
              model: request.model,
              response: '',
              duration: Date.now() - startTime,
              success: false,
            };
          }
        })
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 创建批次
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 合并结果
   */
  mergeResults(results: ParallelResult[]): string {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) {
      return '所有请求都失败了';
    }

    // 选择最快的成功结果
    const fastest = successful.reduce((a, b) => a.duration < b.duration ? a : b);
    return fastest.response;
  }

  /**
   * 投票选择最佳结果
   */
  voteResults(results: ParallelResult[]): string {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) {
      return '所有请求都失败了';
    }

    // 简单投票：选择最常见的响应
    const responseCounts = new Map<string, number>();
    for (const result of successful) {
      const count = responseCounts.get(result.response) || 0;
      responseCounts.set(result.response, count + 1);
    }

    let maxCount = 0;
    let bestResponse = '';
    for (const [response, count] of responseCounts) {
      if (count > maxCount) {
        maxCount = count;
        bestResponse = response;
      }
    }

    return bestResponse;
  }

  /**
   * 获取统计
   */
  getStats(): { maxConcurrency: number; activeRequests: number; queueLength: number } {
    return {
      maxConcurrency: this.maxConcurrency,
      activeRequests: this.activeRequests,
      queueLength: this.queue.length,
    };
  }
}

let globalParallelExecutor: ModelParallelExecutor | null = null;

export function getGlobalParallelExecutor(): ModelParallelExecutor {
  if (!globalParallelExecutor) {
    globalParallelExecutor = new ModelParallelExecutor();
  }
  return globalParallelExecutor;
}
