/**
 * OpenClaw 轻量级向量存储
 * 
 * 专为小参数模型优化：
 * 1. 简化的向量计算
 * 2. 快速相似度搜索
 * 3. 低内存占用
 */

export class LightweightVectorStore {
  private vectors: Map<string, { embedding: number[]; metadata: any }> = new Map();

  constructor() {
    console.log('[VectorStore] 初始化完成');
  }

  /**
   * 添加向量
   */
  add(id: string, embedding: number[], metadata: any = {}): void {
    this.vectors.set(id, { embedding, metadata });
  }

  /**
   * 搜索相似向量
   */
  search(queryEmbedding: number[], limit: number = 5): Array<{ id: string; score: number; metadata: any }> {
    const results: Array<{ id: string; score: number; metadata: any }> = [];

    for (const [id, { embedding, metadata }] of this.vectors) {
      const score = this.cosineSimilarity(queryEmbedding, embedding);
      results.push({ id, score, metadata });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 删除向量
   */
  delete(id: string): void {
    this.vectors.delete(id);
  }

  /**
   * 获取统计
   */
  getStats(): { count: number } {
    return { count: this.vectors.size };
  }
}

let globalVectorStore: LightweightVectorStore | null = null;

export function getGlobalVectorStore(): LightweightVectorStore {
  if (!globalVectorStore) {
    globalVectorStore = new LightweightVectorStore();
  }
  return globalVectorStore;
}
