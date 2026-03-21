/**
 * OpenClaw 模型批处理器
 * 
 * 批量处理请求：
 * 1. 批量嵌入
 * 2. 批量生成
 * 3. 批量评估
 */

export interface BatchRequest<T> {
  id: string;
  data: T;
  priority: number;
}

export interface BatchResult<T> {
  id: string;
  result: T;
  success: boolean;
  error?: string;
}

export class ModelBatchProcessor {
  private batchSize: number = 10;
  private batchDelay: number = 100; // ms

  constructor(batchSize: number = 10) {
    this.batchSize = batchSize;
    console.log('[BatchProcessor] 初始化完成');
  }

  /**
   * 批量处理
   */
  async processBatch<T, R>(
    requests: BatchRequest<T>[],
    handler: (batch: T[]) => Promise<R[]>
  ): Promise<BatchResult<R>[]> {
    const results: BatchResult<R>[] = [];

    // 按优先级排序
    const sorted = [...requests].sort((a, b) => b.priority - a.priority);

    // 分批处理
    for (let i = 0; i < sorted.length; i += this.batchSize) {
      const batch = sorted.slice(i, i + this.batchSize);
      const batchData = batch.map(r => r.data);

      try {
        const batchResults = await handler(batchData);

        for (let j = 0; j < batch.length; j++) {
          results.push({
            id: batch[j].id,
            result: batchResults[j],
            success: true,
          });
        }
      } catch (error) {
        for (const request of batch) {
          results.push({
            id: request.id,
            result: null as any,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // 批次间延迟
      if (i + this.batchSize < sorted.length) {
        await new Promise(resolve => setTimeout(resolve, this.batchDelay));
      }
    }

    return results;
  }

  /**
   * 批量嵌入
   */
  async batchEmbed(
    texts: string[],
    embedder: (text: string) => Promise<number[]>
  ): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      const batchResults = await Promise.all(batch.map(embedder));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 设置批处理大小
   */
  setBatchSize(size: number): void {
    this.batchSize = size;
  }

  /**
   * 设置批处理延迟
   */
  setBatchDelay(delay: number): void {
    this.batchDelay = delay;
  }
}

let globalBatchProcessor: ModelBatchProcessor | null = null;

export function getGlobalBatchProcessor(): ModelBatchProcessor {
  if (!globalBatchProcessor) {
    globalBatchProcessor = new ModelBatchProcessor();
  }
  return globalBatchProcessor;
}
