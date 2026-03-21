/**
 * OpenClaw 模型记忆管理器
 * 
 * 管理模型记忆：
 * 1. 短期记忆
 * 2. 长期记忆
 * 3. 工作记忆
 */

export interface MemoryEntry {
  id: string;
  type: 'short' | 'long' | 'working';
  content: string;
  importance: number;
  timestamp: Date;
}

export class ModelMemoryManager {
  private memories: Map<string, MemoryEntry> = new Map();
  private maxShortTerm: number = 10;
  private maxLongTerm: number = 1000;

  constructor() {
    console.log('[MemoryManager] 初始化完成');
  }

  /**
   * 添加记忆
   */
  add(type: MemoryEntry['type'], content: string, importance: number = 1): string {
    const id = `memory_${Date.now()}`;
    const entry: MemoryEntry = {
      id,
      type,
      content,
      importance,
      timestamp: new Date(),
    };

    this.memories.set(id, entry);
    this.cleanup();

    return id;
  }

  /**
   * 查询记忆
   */
  query(query: string, type?: MemoryEntry['type']): MemoryEntry[] {
    const results: MemoryEntry[] = [];

    for (const memory of this.memories.values()) {
      if (type && memory.type !== type) continue;

      if (memory.content.toLowerCase().includes(query.toLowerCase())) {
        results.push(memory);
      }
    }

    return results.sort((a, b) => b.importance - a.importance);
  }

  /**
   * 清理记忆
   */
  private cleanup(): void {
    // 清理短期记忆
    const shortTerm = Array.from(this.memories.values())
      .filter(m => m.type === 'short')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    while (shortTerm.length > this.maxShortTerm) {
      const oldest = shortTerm.shift()!;
      this.memories.delete(oldest.id);
    }

    // 清理长期记忆
    const longTerm = Array.from(this.memories.values())
      .filter(m => m.type === 'long')
      .sort((a, b) => a.importance - b.importance);

    while (longTerm.length > this.maxLongTerm) {
      const leastImportant = longTerm.shift()!;
      this.memories.delete(leastImportant.id);
    }
  }

  /**
   * 获取统计
   */
  getStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    for (const memory of this.memories.values()) {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
    }
    return { total: this.memories.size, byType };
  }
}

let globalMemoryManager: ModelMemoryManager | null = null;

export function getGlobalMemoryManager(): ModelMemoryManager {
  if (!globalMemoryManager) {
    globalMemoryManager = new ModelMemoryManager();
  }
  return globalMemoryManager;
}
