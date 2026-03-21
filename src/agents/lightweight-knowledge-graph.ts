/**
 * OpenClaw 轻量级知识图谱系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的实体-关系模型
 * 2. 快速查询
 * 3. 低内存占用
 * 4. 持久化存储
 */

// ==================== 类型定义 ====================

export interface Entity {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

export interface Relation {
  id: string;
  from: string; // entity id
  to: string; // entity id
  type: string;
  properties: Record<string, any>;
}

export interface Query {
  entity?: string;
  relation?: string;
  type?: string;
  limit?: number;
}

// ==================== 轻量级知识图谱 ====================

export class LightweightKnowledgeGraph {
  private entities: Map<string, Entity> = new Map();
  private relations: Map<string, Relation> = new Map();
  private entityIndex: Map<string, Set<string>> = new Map(); // type -> entity ids

  constructor() {
    console.log('[KnowledgeGraph] 初始化完成');
  }

  /**
   * 添加实体
   */
  addEntity(entity: Omit<Entity, 'id'>): string {
    const id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newEntity: Entity = { ...entity, id };

    this.entities.set(id, newEntity);

    // 更新索引
    if (!this.entityIndex.has(entity.type)) {
      this.entityIndex.set(entity.type, new Set());
    }
    this.entityIndex.get(entity.type)!.add(id);

    return id;
  }

  /**
   * 添加关系
   */
  addRelation(relation: Omit<Relation, 'id'>): string {
    const id = `relation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRelation: Relation = { ...relation, id };

    this.relations.set(id, newRelation);
    return id;
  }

  /**
   * 查询实体
   */
  queryEntities(query: Query): Entity[] {
    let results = Array.from(this.entities.values());

    // 按类型过滤
    if (query.type) {
      const entityIds = this.entityIndex.get(query.type);
      if (entityIds) {
        results = results.filter(e => entityIds.has(e.id));
      } else {
        return [];
      }
    }

    // 按名称过滤
    if (query.entity) {
      const searchTerm = query.entity.toLowerCase();
      results = results.filter(e => e.name.toLowerCase().includes(searchTerm));
    }

    // 限制结果数量
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * 查询关系
   */
  queryRelations(query: Query): Relation[] {
    let results = Array.from(this.relations.values());

    // 按类型过滤
    if (query.relation) {
      results = results.filter(r => r.type === query.relation);
    }

    // 按实体过滤
    if (query.entity) {
      const entities = this.queryEntities({ entity: query.entity });
      const entityIds = new Set(entities.map(e => e.id));
      results = results.filter(r => entityIds.has(r.from) || entityIds.has(r.to));
    }

    // 限制结果数量
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * 获取实体关系
   */
  getEntityRelations(entityId: string): {
    outgoing: Relation[];
    incoming: Relation[];
  } {
    const outgoing: Relation[] = [];
    const incoming: Relation[] = [];

    for (const relation of this.relations.values()) {
      if (relation.from === entityId) {
        outgoing.push(relation);
      }
      if (relation.to === entityId) {
        incoming.push(relation);
      }
    }

    return { outgoing, incoming };
  }

  /**
   * 获取实体邻居
   */
  getEntityNeighbors(entityId: string, depth: number = 1): Entity[] {
    const visited = new Set<string>();
    const neighbors: Entity[] = [];
    const queue: { id: string; level: number }[] = [{ id: entityId, level: 0 }];

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;

      if (visited.has(id) || level > depth) continue;
      visited.add(id);

      const entity = this.entities.get(id);
      if (entity && id !== entityId) {
        neighbors.push(entity);
      }

      if (level < depth) {
        const { outgoing, incoming } = this.getEntityRelations(id);

        for (const rel of outgoing) {
          if (!visited.has(rel.to)) {
            queue.push({ id: rel.to, level: level + 1 });
          }
        }

        for (const rel of incoming) {
          if (!visited.has(rel.from)) {
            queue.push({ id: rel.from, level: level + 1 });
          }
        }
      }
    }

    return neighbors;
  }

  /**
   * 搜索路径
   */
  findPath(fromId: string, toId: string, maxDepth: number = 3): string[] | null {
    const visited = new Set<string>();
    const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      if (id === toId) {
        return path;
      }

      if (visited.has(id) || path.length > maxDepth) continue;
      visited.add(id);

      const { outgoing } = this.getEntityRelations(id);
      for (const rel of outgoing) {
        if (!visited.has(rel.to)) {
          queue.push({ id: rel.to, path: [...path, rel.to] });
        }
      }
    }

    return null;
  }

  /**
   * 合并实体
   */
  mergeEntities(id1: string, id2: string): string {
    const entity1 = this.entities.get(id1);
    const entity2 = this.entities.get(id2);

    if (!entity1 || !entity2) {
      throw new Error('实体不存在');
    }

    // 合并属性
    const mergedEntity: Entity = {
      id: id1,
      name: entity1.name,
      type: entity1.type,
      properties: { ...entity1.properties, ...entity2.properties },
    };

    this.entities.set(id1, mergedEntity);

    // 更新关系
    for (const relation of this.relations.values()) {
      if (relation.from === id2) {
        relation.from = id1;
      }
      if (relation.to === id2) {
        relation.to = id1;
      }
    }

    // 删除第二个实体
    this.entities.delete(id2);
    this.entityIndex.get(entity2.type)?.delete(id2);

    return id1;
  }

  /**
   * 导出数据
   */
  export(): { entities: Entity[]; relations: Relation[] } {
    return {
      entities: Array.from(this.entities.values()),
      relations: Array.from(this.relations.values()),
    };
  }

  /**
   * 导入数据
   */
  import(data: { entities: Entity[]; relations: Relation[] }): void {
    for (const entity of data.entities) {
      this.entities.set(entity.id, entity);

      if (!this.entityIndex.has(entity.type)) {
        this.entityIndex.set(entity.type, new Set());
      }
      this.entityIndex.get(entity.type)!.add(entity.id);
    }

    for (const relation of data.relations) {
      this.relations.set(relation.id, relation);
    }
  }

  /**
   * 获取统计
   */
  getStats(): {
    entityCount: number;
    relationCount: number;
    typeCount: number;
  } {
    return {
      entityCount: this.entities.size,
      relationCount: this.relations.size,
      typeCount: this.entityIndex.size,
    };
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    const stats = this.getStats();

    return `
# 知识图谱报告

## 统计
- 实体: ${stats.entityCount}
- 关系: ${stats.relationCount}
- 类型: ${stats.typeCount}

## 实体类型
${Array.from(this.entityIndex.entries()).map(([type, ids]) => `- ${type}: ${ids.size}`).join('\n')}

## 最近实体
${Array.from(this.entities.values())
  .slice(-5)
  .map(e => `- ${e.name} (${e.type})`)
  .join('\n')}
    `.trim();
  }
}

// ==================== 全局实例 ====================

let globalKnowledgeGraph: LightweightKnowledgeGraph | null = null;

export function getGlobalKnowledgeGraph(): LightweightKnowledgeGraph {
  if (!globalKnowledgeGraph) {
    globalKnowledgeGraph = new LightweightKnowledgeGraph();
  }
  return globalKnowledgeGraph;
}

export function resetGlobalKnowledgeGraph(): void {
  globalKnowledgeGraph = null;
}
