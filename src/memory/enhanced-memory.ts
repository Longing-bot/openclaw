/**
 * SuperClaw 记忆增强系统
 * 
 * 更智能的记忆管理
 */

// ==================== 类型定义 ====================

export interface MemoryItem {
  id: string;
  content: string;
  tags: string[];
  timestamp: number;
  importance: number; // 0-1
  accessCount: number;
  lastAccessed: number;
}

export interface MemoryQuery {
  query: string;
  tags?: string[];
  limit?: number;
  minImportance?: number;
}

// ==================== 记忆系统 ====================

export class EnhancedMemory {
  private memories: Map<string, MemoryItem> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private maxItems: number;

  constructor(maxItems = 1000) {
    this.maxItems = maxItems;
  }

  /**
   * 添加记忆
   */
  add(content: string, tags: string[] = [], importance = 0.5): string {
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    const item: MemoryItem = {
      id,
      content,
      tags,
      timestamp: Date.now(),
      importance,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.memories.set(id, item);

    // 更新标签索引
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(id);
    }

    // 如果超过最大数量，删除最不重要的
    if (this.memories.size > this.maxItems) {
      this.evictLeastImportant();
    }

    return id;
  }

  /**
   * 搜索记忆
   */
  search(query: MemoryQuery): MemoryItem[] {
    const results: MemoryItem[] = [];
    const queryLower = query.query.toLowerCase();

    for (const item of this.memories.values()) {
      // 检查重要性
      if (query.minImportance && item.importance < query.minImportance) {
        continue;
      }

      // 检查标签
      if (query.tags && query.tags.length > 0) {
        const hasTag = query.tags.some(tag => item.tags.includes(tag));
        if (!hasTag) continue;
      }

      // 检查内容匹配
      if (item.content.toLowerCase().includes(queryLower)) {
        results.push(item);
        item.accessCount++;
        item.lastAccessed = Date.now();
      }
    }

    // 按重要性和访问次数排序
    results.sort((a, b) => {
      const scoreA = a.importance * 0.6 + (a.accessCount / 100) * 0.4;
      const scoreB = b.importance * 0.6 + (b.accessCount / 100) * 0.4;
      return scoreB - scoreA;
    });

    return results.slice(0, query.limit || 10);
  }

  /**
   * 获取记忆
   */
  get(id: string): MemoryItem | undefined {
    const item = this.memories.get(id);
    if (item) {
      item.accessCount++;
      item.lastAccessed = Date.now();
    }
    return item;
  }

  /**
   * 删除记忆
   */
  remove(id: string): boolean {
    const item = this.memories.get(id);
    if (item) {
      // 从标签索引中删除
      for (const tag of item.tags) {
        this.tagIndex.get(tag)?.delete(id);
      }
      this.memories.delete(id);
      return true;
    }
    return false;
  }

  /**
   * 获取所有标签
   */
  getTags(): string[] {
    return Array.from(this.tagIndex.keys());
  }

  /**
   * 获取统计信息
   */
  getStats(): { total: number; tags: number; avgImportance: number } {
    let totalImportance = 0;
    for (const item of this.memories.values()) {
      totalImportance += item.importance;
    }

    return {
      total: this.memories.size,
      tags: this.tagIndex.size,
      avgImportance: this.memories.size > 0 ? totalImportance / this.memories.size : 0,
    };
  }

  /**
   * 清理过期记忆
   */
  cleanup(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, item] of this.memories.entries()) {
      if (now - item.lastAccessed > maxAgeMs && item.importance < 0.3) {
        this.remove(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * 驱逐最不重要的记忆
   */
  private evictLeastImportant(): void {
    let leastImportant: MemoryItem | null = null;
    let leastScore = Infinity;

    for (const item of this.memories.values()) {
      const score = item.importance * 0.5 + (item.accessCount / 100) * 0.3 + (1 / (now - item.timestamp + 1)) * 0.2;
      if (score < leastScore) {
        leastScore = score;
        leastImportant = item;
      }
    }

    if (leastImportant) {
      this.remove(leastImportant.id);
    }
  }
}

// ==================== 导出 ====================

export function createEnhancedMemory(maxItems?: number): EnhancedMemory {
  return new EnhancedMemory(maxItems);
}
