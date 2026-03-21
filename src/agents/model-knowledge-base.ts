/**
 * OpenClaw 模型知识库
 * 
 * 存储和管理知识：
 * 1. 事实存储
 * 2. 规则存储
 * 3. 经验存储
 */

export interface Knowledge {
  id: string;
  type: 'fact' | 'rule' | 'experience';
  content: string;
  source: string;
  confidence: number;
  timestamp: Date;
}

export class ModelKnowledgeBase {
  private knowledge: Map<string, Knowledge> = new Map();

  constructor() {
    console.log('[KnowledgeBase] 初始化完成');
  }

  /**
   * 添加知识
   */
  add(knowledge: Omit<Knowledge, 'id' | 'timestamp'>): string {
    const id = `knowledge_${Date.now()}`;
    const entry: Knowledge = {
      ...knowledge,
      id,
      timestamp: new Date(),
    };

    this.knowledge.set(id, entry);
    return id;
  }

  /**
   * 查询知识
   */
  query(query: string, type?: Knowledge['type']): Knowledge[] {
    const results: Knowledge[] = [];

    for (const knowledge of this.knowledge.values()) {
      if (type && knowledge.type !== type) continue;

      if (knowledge.content.toLowerCase().includes(query.toLowerCase())) {
        results.push(knowledge);
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 更新知识
   */
  update(id: string, updates: Partial<Knowledge>): void {
    const knowledge = this.knowledge.get(id);
    if (knowledge) {
      Object.assign(knowledge, updates);
    }
  }

  /**
   * 删除知识
   */
  delete(id: string): void {
    this.knowledge.delete(id);
  }

  /**
   * 获取统计
   */
  getStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    for (const knowledge of this.knowledge.values()) {
      byType[knowledge.type] = (byType[knowledge.type] || 0) + 1;
    }
    return { total: this.knowledge.size, byType };
  }
}

let globalKnowledgeBase: ModelKnowledgeBase | null = null;

export function getGlobalKnowledgeBase(): ModelKnowledgeBase {
  if (!globalKnowledgeBase) {
    globalKnowledgeBase = new ModelKnowledgeBase();
  }
  return globalKnowledgeBase;
}
