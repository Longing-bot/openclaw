/**
 * OpenClaw 持久化记忆系统
 * 
 * 内化自 Engram 项目：
 * https://github.com/Gentleman-Programming/engram
 * 
 * 核心概念：
 * 1. 持久化记忆 - 使用文件系统存储
 * 2. 全文搜索 - 支持内容检索
 * 3. 会话管理 - 会话开始/结束
 * 4. 记忆同步 - 跨会话同步
 */

import fs from 'fs/promises';
import path from 'path';

// ==================== 类型定义 ====================

export interface Memory {
  id: string;
  title: string;
  content: string;
  type: 'observation' | 'learning' | 'decision' | 'reflection' | 'goal';
  tags: string[];
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface Session {
  id: string;
  startTime: Date;
  endTime?: Date;
  memories: string[]; // memory IDs
  summary?: string;
}

export interface SearchResult {
  memory: Memory;
  score: number;
  highlights: string[];
}

// ==================== 持久化记忆系统 ====================

export class PersistentMemorySystem {
  private memoryDir: string;
  private memories: Map<string, Memory> = new Map();
  private sessions: Map<string, Session> = new Map();
  private currentSessionId: string | null = null;

  constructor(memoryDir: string = path.join(process.env.HOME || '~', '.openclaw', 'memory')) {
    this.memoryDir = memoryDir;
    this.initialize();
  }

  /**
   * 初始化
   */
  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.memoryDir, { recursive: true });
      await this.loadMemories();
      await this.loadSessions();
      console.log('[MemorySystem] 初始化完成');
    } catch (error) {
      console.error('[MemorySystem] 初始化失败:', error);
    }
  }

  /**
   * 加载记忆
   */
  private async loadMemories(): Promise<void> {
    try {
      const files = await fs.readdir(this.memoryDir);
      const memoryFiles = files.filter(f => f.endsWith('.json'));

      for (const file of memoryFiles) {
        const content = await fs.readFile(path.join(this.memoryDir, file), 'utf-8');
        const memory = JSON.parse(content) as Memory;
        this.memories.set(memory.id, memory);
      }

      console.log(`[MemorySystem] 加载了 ${this.memories.size} 条记忆`);
    } catch (error) {
      console.error('[MemorySystem] 加载记忆失败:', error);
    }
  }

  /**
   * 加载会话
   */
  private async loadSessions(): Promise<void> {
    try {
      const sessionsDir = path.join(this.memoryDir, 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });

      const files = await fs.readdir(sessionsDir);
      const sessionFiles = files.filter(f => f.endsWith('.json'));

      for (const file of sessionFiles) {
        const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
        const session = JSON.parse(content) as Session;
        this.sessions.set(session.id, session);
      }

      console.log(`[MemorySystem] 加载了 ${this.sessions.size} 个会话`);
    } catch (error) {
      console.error('[MemorySystem] 加载会话失败:', error);
    }
  }

  /**
   * 开始会话
   */
  startSession(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: Session = {
      id: sessionId,
      startTime: new Date(),
      memories: [],
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    this.saveSession(session);

    console.log(`[MemorySystem] 开始会话: ${sessionId}`);
    return sessionId;
  }

  /**
   * 结束会话
   */
  async endSession(summary?: string): Promise<void> {
    if (!this.currentSessionId) {
      console.warn('[MemorySystem] 没有活跃会话');
      return;
    }

    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.endTime = new Date();
      session.summary = summary;
      await this.saveSession(session);
    }

    console.log(`[MemorySystem] 结束会话: ${this.currentSessionId}`);
    this.currentSessionId = null;
  }

  /**
   * 保存记忆
   */
  async saveMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newMemory: Memory = {
      ...memory,
      id,
      createdAt: now,
      updatedAt: now,
      sessionId: this.currentSessionId || 'unknown',
    };

    this.memories.set(id, newMemory);
    await this.saveMemoryToFile(newMemory);

    // 添加到当前会话
    if (this.currentSessionId) {
      const session = this.sessions.get(this.currentSessionId);
      if (session) {
        session.memories.push(id);
        await this.saveSession(session);
      }
    }

    console.log(`[MemorySystem] 保存记忆: ${memory.title}`);
    return id;
  }

  /**
   * 更新记忆
   */
  async updateMemory(id: string, updates: Partial<Memory>): Promise<void> {
    const memory = this.memories.get(id);
    if (!memory) {
      console.warn(`[MemorySystem] 记忆不存在: ${id}`);
      return;
    }

    const updatedMemory: Memory = {
      ...memory,
      ...updates,
      updatedAt: new Date(),
    };

    this.memories.set(id, updatedMemory);
    await this.saveMemoryToFile(updatedMemory);

    console.log(`[MemorySystem] 更新记忆: ${id}`);
  }

  /**
   * 删除记忆
   */
  async deleteMemory(id: string): Promise<void> {
    const memory = this.memories.get(id);
    if (!memory) {
      console.warn(`[MemorySystem] 记忆不存在: ${id}`);
      return;
    }

    this.memories.delete(id);

    // 删除文件
    const filePath = path.join(this.memoryDir, `${id}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`[MemorySystem] 删除文件失败: ${filePath}`, error);
    }

    console.log(`[MemorySystem] 删除记忆: ${id}`);
  }

  /**
   * 搜索记忆
   */
  search(query: string, options: {
    type?: Memory['type'];
    tags?: string[];
    limit?: number;
  } = {}): SearchResult[] {
    const { type, tags, limit = 10 } = options;

    const results: SearchResult[] = [];

    for (const memory of this.memories.values()) {
      // 类型过滤
      if (type && memory.type !== type) continue;

      // 标签过滤
      if (tags && tags.length > 0) {
        const hasTag = tags.some(tag => memory.tags.includes(tag));
        if (!hasTag) continue;
      }

      // 内容匹配
      const contentLower = memory.content.toLowerCase();
      const titleLower = memory.title.toLowerCase();
      const queryLower = query.toLowerCase();

      let score = 0;
      const highlights: string[] = [];

      // 标题匹配
      if (titleLower.includes(queryLower)) {
        score += 10;
        highlights.push(memory.title);
      }

      // 内容匹配
      if (contentLower.includes(queryLower)) {
        score += 5;
        // 提取高亮片段
        const index = contentLower.indexOf(queryLower);
        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(contentLower.length, index + query.length + 50);
          const snippet = memory.content.substring(start, end);
          highlights.push(`...${snippet}...`);
        }
      }

      // 标签匹配
      for (const tag of memory.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 3;
        }
      }

      if (score > 0) {
        results.push({
          memory,
          score,
          highlights,
        });
      }
    }

    // 排序并限制结果
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 获取记忆
   */
  getMemory(id: string): Memory | undefined {
    return this.memories.get(id);
  }

  /**
   * 获取所有记忆
   */
  getAllMemories(): Memory[] {
    return Array.from(this.memories.values());
  }

  /**
   * 获取会话记忆
   */
  getSessionMemories(sessionId: string): Memory[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.memories
      .map(id => this.memories.get(id))
      .filter((m): m is Memory => m !== undefined);
  }

  /**
   * 获取当前会话记忆
   */
  getCurrentSessionMemories(): Memory[] {
    if (!this.currentSessionId) return [];
    return this.getSessionMemories(this.currentSessionId);
  }

  /**
   * 保存记忆到文件
   */
  private async saveMemoryToFile(memory: Memory): Promise<void> {
    const filePath = path.join(this.memoryDir, `${memory.id}.json`);
    try {
      await fs.writeFile(filePath, JSON.stringify(memory, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[MemorySystem] 保存记忆失败: ${filePath}`, error);
    }
  }

  /**
   * 保存会话
   */
  private async saveSession(session: Session): Promise<void> {
    const sessionsDir = path.join(this.memoryDir, 'sessions');
    await fs.mkdir(sessionsDir, { recursive: true });

    const filePath = path.join(sessionsDir, `${session.id}.json`);
    try {
      await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[MemorySystem] 保存会话失败: ${filePath}`, error);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalMemories: number;
    totalSessions: number;
    memoriesByType: Record<string, number>;
    currentSession: string | null;
  } {
    const memoriesByType: Record<string, number> = {};
    for (const memory of this.memories.values()) {
      memoriesByType[memory.type] = (memoriesByType[memory.type] || 0) + 1;
    }

    return {
      totalMemories: this.memories.size,
      totalSessions: this.sessions.size,
      memoriesByType,
      currentSession: this.currentSessionId,
    };
  }

  /**
   * 导出记忆
   */
  async exportMemories(filePath: string): Promise<void> {
    const memories = Array.from(this.memories.values());
    await fs.writeFile(filePath, JSON.stringify(memories, null, 2), 'utf-8');
    console.log(`[MemorySystem] 导出 ${memories.length} 条记忆到 ${filePath}`);
  }

  /**
   * 导入记忆
   */
  async importMemories(filePath: string): Promise<number> {
    const content = await fs.readFile(filePath, 'utf-8');
    const memories = JSON.parse(content) as Memory[];

    let imported = 0;
    for (const memory of memories) {
      if (!this.memories.has(memory.id)) {
        this.memories.set(memory.id, memory);
        await this.saveMemoryToFile(memory);
        imported++;
      }
    }

    console.log(`[MemorySystem] 导入 ${imported} 条记忆`);
    return imported;
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    const stats = this.getStats();

    return `
# 持久化记忆系统报告

## 统计信息
- 总记忆数: ${stats.totalMemories}
- 总会话数: ${stats.totalSessions}
- 当前会话: ${stats.currentSession || '无'}

## 记忆类型分布
${Object.entries(stats.memoriesByType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

## 最近记忆
${Array.from(this.memories.values())
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  .slice(0, 5)
  .map(m => `- ${m.title} (${m.type})`)
  .join('\n')}
    `.trim();
  }
}

// ==================== 全局实例 ====================

let globalMemorySystem: PersistentMemorySystem | null = null;

export function getGlobalMemorySystem(): PersistentMemorySystem {
  if (!globalMemorySystem) {
    globalMemorySystem = new PersistentMemorySystem();
  }
  return globalMemorySystem;
}

export function resetGlobalMemorySystem(): void {
  globalMemorySystem = null;
}
