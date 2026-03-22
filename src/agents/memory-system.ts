import { BaseSystem, now, generateId, ManagedArray } from "./superclaw-base.js";
/**
 * OpenClaw SuperClaw 记忆系统 (优化版)
 * 
 * 设计原则：轻量化、高效率、低开销
 */

// ==================== 工具函数 ====================
// ==================== 知识图谱 ====================

interface KnowledgeNode {
  id: string;
  type: string;
  properties: Record<string, any>;
  connections: Set<string>;
}

export class MemoryKnowledgeGraph {
  private nodes = new Map<string, KnowledgeNode>();
  private typeIndex = new Map<string, Set<string>>();

  addNode(id: string, type: string, properties: Record<string, any> = {}): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        type,
        properties,
        connections: new Set(),
      });
      
      // 更新类型索引
      if (!this.typeIndex.has(type)) {
        this.typeIndex.set(type, new Set());
      }
      this.typeIndex.get(type)!.add(id);
    }
  }

  connect(fromId: string, toId: string): void {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    if (from && to) {
      from.connections.add(toId);
      to.connections.add(fromId);
    }
  }

  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  query(type?: string, properties?: Record<string, any>): KnowledgeNode[] {
    // 使用类型索引优化查询
    if (type && this.typeIndex.has(type)) {
      const nodeIds = this.typeIndex.get(type)!;
      const results: KnowledgeNode[] = [];
      
      for (const id of nodeIds) {
        const node = this.nodes.get(id)!;
        if (properties) {
          let matches = true;
          for (const [key, value] of Object.entries(properties)) {
            if (node.properties[key] !== value) {
              matches = false;
              break;
            }
          }
          if (!matches) continue;
        }
        results.push(node);
      }
      
      return results;
    }
    
    // 回退到全表扫描
    const results: KnowledgeNode[] = [];
    
    for (const node of this.nodes.values()) {
      if (type && node.type !== type) continue;
      
      if (properties) {
        let matches = true;
        for (const [key, value] of Object.entries(properties)) {
          if (node.properties[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }
      
      results.push(node);
    }
    
    return results;
  }

  getRelated(id: string, depth: number = 1): KnowledgeNode[] {
    const visited = new Set<string>();
    const result: KnowledgeNode[] = [];
    
    const traverse = (nodeId: string, currentDepth: number) => {
      if (visited.has(nodeId) || currentDepth > depth) return;
      visited.add(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (!node) return;
      
      if (currentDepth > 0) {
        result.push(node);
      }
      
      for (const connectedId of node.connections) {
        traverse(connectedId, currentDepth + 1);
      }
    };
    
    traverse(id, 0);
    return result;
  }

  clear(): void {
    this.nodes.clear();
    this.typeIndex.clear();
  }

  get size(): number {
    return this.nodes.size;
  }
}

// ==================== 向量存储 ====================

interface VectorEntry {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
}

export class MemoryVectorStore {
  private entries = new Map<string, VectorEntry>();
  private dimensions: number;

  constructor(dimensions: number = 128) {
    this.dimensions = dimensions;
  }

  add(id: string, vector: number[], metadata: Record<string, any> = {}): void {
    if (vector.length !== this.dimensions) {
      throw new Error(`Vector must have ${this.dimensions} dimensions`);
    }
    this.entries.set(id, { id, vector, metadata });
  }

  search(query: number[], limit: number = 10): Array<{ id: string; score: number; metadata: any }> {
    if (query.length !== this.dimensions) {
      throw new Error(`Query vector must have ${this.dimensions} dimensions`);
    }
    
    const results: Array<{ id: string; score: number; metadata: any }> = [];
    
    // 预计算查询向量的模长
    let queryNorm = 0;
    for (let i = 0; i < query.length; i++) {
      queryNorm += query[i] * query[i];
    }
    queryNorm = Math.sqrt(queryNorm);
    
    for (const entry of this.entries.values()) {
      // 优化的余弦相似度计算
      let dotProduct = 0;
      let entryNorm = 0;
      
      for (let i = 0; i < query.length; i++) {
        dotProduct += query[i] * entry.vector[i];
        entryNorm += entry.vector[i] * entry.vector[i];
      }
      
      const score = dotProduct / (queryNorm * Math.sqrt(entryNorm));
      results.push({ id: entry.id, score, metadata: entry.metadata });
    }
    
    // 使用部分排序优化
    if (results.length > limit) {
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    }
    
    return results.sort((a, b) => b.score - a.score);
  }

  remove(id: string): boolean {
    return this.entries.delete(id);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

// ==================== 学习系统 ====================

interface LearningPattern {
  id: string;
  pattern: string;
  outcome: string;
  confidence: number;
  occurrences: number;
}

export class MemoryLearningSystem {
  private patterns: LearningPattern[] = [];

  learn(pattern: string, outcome: string, success: boolean): void {
    const existing = this.patterns.find(p => p.pattern === pattern);
    
    if (existing) {
      existing.occurrences++;
      existing.confidence = existing.confidence * 0.9 + (success ? 0.1 : 0);
      if (success) {
        existing.outcome = outcome;
      }
    } else {
      this.patterns.push({
        id: generateId('pattern'),
        pattern,
        outcome,
        confidence: success ? 0.5 : 0.3,
        occurrences: 1,
      });
    }
  }

  predict(context: string): LearningPattern | null {
    const matching = this.patterns
      .filter(p => context.includes(p.pattern) || p.pattern.includes(context))
      .sort((a, b) => b.confidence - a.confidence);
    
    return matching[0] || null;
  }

  getTopPatterns(limit: number = 10): LearningPattern[] {
    return [...this.patterns]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  clear(): void {
    this.patterns = [];
  }
}

// ==================== 上下文管理器 ====================

interface ContextEntry {
  id: string;
  content: string;
  timestamp: number;
  importance: number;
  tags: string[];
}

export class MemoryContextManager {
  private contexts = new Map<string, ContextEntry>();
  private maxSize = 100;

  set(id: string, content: string, importance: number = 0.5, tags: string[] = []): void {
    this.contexts.set(id, {
      id,
      content,
      timestamp: now(),
      importance,
      tags,
    });

    if (this.contexts.size > this.maxSize) {
      this.evictLeastImportant();
    }
  }

  get(id: string): string | undefined {
    return this.contexts.get(id)?.content;
  }

  search(query: string, limit: number = 5): ContextEntry[] {
    const results: ContextEntry[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const entry of this.contexts.values()) {
      if (entry.content.toLowerCase().includes(lowerQuery) ||
          entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        results.push(entry);
      }
    }
    
    return results
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  private evictLeastImportant(): void {
    let leastImportant: string | null = null;
    let lowestImportance = Infinity;

    for (const [id, entry] of this.contexts) {
      if (entry.importance < lowestImportance) {
        lowestImportance = entry.importance;
        leastImportant = id;
      }
    }

    if (leastImportant) {
      this.contexts.delete(leastImportant);
    }
  }

  clear(): void {
    this.contexts.clear();
  }

  get size(): number {
    return this.contexts.size;
  }
}

// ==================== 对话管理器 ====================

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  turns: ConversationTurn[];
  startedAt: number;
  lastActiveAt: number;
}

export class MemoryConversationManager {
  private conversations = new Map<string, Conversation>();

  createConversation(id: string): Conversation {
    const conversation: Conversation = {
      id,
      turns: [],
      startedAt: now(),
      lastActiveAt: now(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  addTurn(conversationId: string, role: 'user' | 'assistant', content: string): void {
    let conversation = this.conversations.get(conversationId);
    if (!conversation) {
      conversation = this.createConversation(conversationId);
    }

    conversation.turns.push({
      role,
      content,
      timestamp: now(),
    });
    conversation.lastActiveAt = now();

    if (conversation.turns.length > 50) {
      conversation.turns.shift();
    }
  }

  getHistory(conversationId: string, limit: number = 10): ConversationTurn[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];
    
    return conversation.turns.slice(-limit);
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  clearConversation(id: string): void {
    this.conversations.delete(id);
  }

  clear(): void {
    this.conversations.clear();
  }
}

// ==================== 会话管理器 ====================

interface Session {
  id: string;
  data: Map<string, any>;
  createdAt: number;
  expiresAt: number;
}

export class MemorySessionManager {
  private sessions = new Map<string, Session>();
  private defaultTTL = 3600000; // 1小时

  createSession(id: string, ttl?: number): Session {
    const session: Session = {
      id,
      data: new Map(),
      createdAt: now(),
      expiresAt: now() + (ttl ?? this.defaultTTL),
    };
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    if (now() > session.expiresAt) {
      this.sessions.delete(id);
      return undefined;
    }
    
    return session;
  }

  set(sessionId: string, key: string, value: any): void {
    let session = this.getSession(sessionId);
    if (!session) {
      session = this.createSession(sessionId);
    }
    session.data.set(key, value);
  }

  get(sessionId: string, key: string): any {
    const session = this.getSession(sessionId);
    return session?.data.get(key);
  }

  deleteSession(id: string): void {
    this.sessions.delete(id);
  }

  cleanup(): number {
    const time = now();
    let cleaned = 0;
    
    for (const [id, session] of this.sessions) {
      if (time > session.expiresAt) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  clear(): void {
    this.sessions.clear();
  }
}

// ==================== 统一记忆系统 ====================

export class SuperClawMemorySystem {
  public knowledgeGraph: MemoryKnowledgeGraph;
  public vectorStore: MemoryVectorStore;
  public learning: MemoryLearningSystem;
  public context: MemoryContextManager;
  public conversation: MemoryConversationManager;
  public session: MemorySessionManager;

  constructor() {
    this.knowledgeGraph = new MemoryKnowledgeGraph();
    this.vectorStore = new MemoryVectorStore();
    this.learning = new MemoryLearningSystem();
    this.context = new MemoryContextManager();
    this.conversation = new MemoryConversationManager();
    this.session = new MemorySessionManager();
    
    // 定期清理
    setInterval(() => this.cleanup(), 300000);
  }

  private cleanup(): void {
    this.session.cleanup();
  }

  remember(content: string, importance: number = 0.5, tags: string[] = []): string {
    const id = generateId('memory');
    this.context.set(id, content, importance, tags);
    return id;
  }

  recall(query: string): string[] {
    return this.context.search(query).map(entry => entry.content);
  }

  learn(pattern: string, outcome: string, success: boolean): void {
    this.learning.learn(pattern, outcome, success);
  }

  predict(context: string): string | null {
    const prediction = this.learning.predict(context);
    return prediction?.outcome || null;
  }

  getStats(): Record<string, any> {
    return {
      knowledgeNodes: this.knowledgeGraph.size,
      vectorEntries: this.vectorStore.size,
      contextEntries: this.context.size,
      learnedPatterns: this.learning.getTopPatterns(5).length,
    };
  }

  clear(): void {
    this.knowledgeGraph.clear();
    this.vectorStore.clear();
    this.learning.clear();
    this.context.clear();
    this.conversation.clear();
    this.session.clear();
  }
}

// ==================== 全局实例 ====================

let globalMemorySystem: SuperClawMemorySystem | null = null;

export function getGlobalMemorySystem(): SuperClawMemorySystem {
  if (!globalMemorySystem) {
    globalMemorySystem = new SuperClawMemorySystem();
  }
  return globalMemorySystem;
}

export function resetGlobalMemorySystem(): void {
  globalMemorySystem = null;
}
