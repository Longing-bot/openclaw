/**
 * AgentOptimizer - 代理运行时优化器
 * 
 * 专注于优化 OpenClaw 代理的运行时性能：
 * 1. 会话管理优化
 * 2. 模型调用优化
 * 3. 工具调用优化
 * 4. 流式响应优化
 */

import type { AgentMessage } from "@mariozechner/pi-agent-core";

// ==================== 类型定义 ====================

export interface AgentMetrics {
  sessionLoads: number;
  sessionLoadTime: number;
  modelCalls: number;
  modelCallTime: number;
  toolCalls: number;
  toolCallTime: number;
  streamChunks: number;
  streamTime: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface SessionPoolEntry {
  sessionId: string;
  messages: AgentMessage[];
  lastAccess: number;
  hitCount: number;
}

export interface ModelCallCache {
  prompt: string;
  model: string;
  response: string;
  timestamp: number;
  tokens: number;
}

// ==================== 会话池优化器 ====================

export class SessionPoolOptimizer {
  private pool = new Map<string, SessionPoolEntry>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 50, ttlMs = 10 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * 获取会话
   */
  get(sessionId: string): SessionPoolEntry | undefined {
    const entry = this.pool.get(sessionId);

    if (!entry) {
      return undefined;
    }

    // 检查 TTL
    if (Date.now() - entry.lastAccess > this.ttlMs) {
      this.pool.delete(sessionId);
      return undefined;
    }

    // 更新访问信息
    entry.lastAccess = Date.now();
    entry.hitCount++;

    return entry;
  }

  /**
   * 设置会话
   */
  set(sessionId: string, messages: AgentMessage[]): void {
    // 如果池满了，删除最旧的
    if (this.pool.size >= this.maxSize) {
      const oldestKey = this.findOldestSession();
      if (oldestKey) {
        this.pool.delete(oldestKey);
      }
    }

    this.pool.set(sessionId, {
      sessionId,
      messages,
      lastAccess: Date.now(),
      hitCount: 0,
    });
  }

  /**
   * 找到最旧的会话
   */
  private findOldestSession(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.pool) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * 删除会话
   */
  delete(sessionId: string): void {
    this.pool.delete(sessionId);
  }

  /**
   * 获取池统计
   */
  getStats(): { size: number; hitRate: number } {
    let totalHits = 0;
    let totalRequests = 0;

    for (const entry of this.pool.values()) {
      totalHits += entry.hitCount;
      totalRequests += entry.hitCount + 1;
    }

    return {
      size: this.pool.size,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
    };
  }

  /**
   * 清空池
   */
  clear(): void {
    this.pool.clear();
  }
}

// ==================== 模型调用缓存 ====================

export class ModelCallCacheOptimizer {
  private cache = new Map<string, ModelCallCache>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 1000, ttlMs = 30 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * 生成缓存键
   */
  private generateKey(prompt: string, model: string): string {
    // 使用提示的哈希作为键
    const hash = this.hashString(prompt);
    return `${model}:${hash}`;
  }

  /**
   * 简单字符串哈希
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * 获取缓存的响应
   */
  get(prompt: string, model: string): ModelCallCache | undefined {
    const key = this.generateKey(prompt, model);
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // 检查 TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    return entry;
  }

  /**
   * 缓存响应
   */
  set(prompt: string, model: string, response: string, tokens: number): void {
    const key = this.generateKey(prompt, model);

    // 如果缓存满了，删除最旧的
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      prompt,
      model,
      response,
      timestamp: Date.now(),
      tokens,
    });
  }

  /**
   * 清除模型的缓存
   */
  invalidateModel(model: string): void {
    for (const [key, entry] of this.cache) {
      if (entry.model === model) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; hitRate: number; totalTokens: number } {
    let totalTokens = 0;
    for (const entry of this.cache.values()) {
      totalTokens += entry.tokens;
    }

    return {
      size: this.cache.size,
      hitRate: 0, // 需要外部跟踪
      totalTokens,
    };
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }
}

// ==================== 工具调用优化器 ====================

export class ToolCallOptimizer {
  private callHistory = new Map<string, { count: number; totalTime: number; lastCall: number }>();
  private parallelThreshold = 3; // 并行调用阈值

  /**
   * 记录工具调用
   */
  recordCall(toolName: string, duration: number): void {
    const existing = this.callHistory.get(toolName) || { count: 0, totalTime: 0, lastCall: 0 };
    existing.count++;
    existing.totalTime += duration;
    existing.lastCall = Date.now();
    this.callHistory.set(toolName, existing);
  }

  /**
   * 获取工具性能统计
   */
  getToolStats(toolName: string): { avgTime: number; callCount: number } | undefined {
    const stats = this.callHistory.get(toolName);
    if (!stats) {
      return undefined;
    }

    return {
      avgTime: stats.totalTime / stats.count,
      callCount: stats.count,
    };
  }

  /**
   * 判断是否应该并行调用
   */
  shouldParallelize(toolNames: string[]): boolean {
    // 如果有多个快速工具，建议并行
    let fastToolCount = 0;
    for (const toolName of toolNames) {
      const stats = this.callHistory.get(toolName);
      if (stats && stats.totalTime / stats.count < 1000) { // < 1秒
        fastToolCount++;
      }
    }
    return fastToolCount >= this.parallelThreshold;
  }

  /**
   * 获取最慢的工具
   */
  getSlowestTools(limit = 5): Array<{ name: string; avgTime: number }> {
    return [...this.callHistory.entries()]
      .map(([name, stats]) => ({
        name,
        avgTime: stats.totalTime / stats.count,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }

  /**
   * 清除历史
   */
  clear(): void {
    this.callHistory.clear();
  }
}

// ==================== 流式响应优化器 ====================

export class StreamOptimizer {
  private chunkBuffer: string[] = [];
  private bufferSize: number;
  private flushInterval: number;
  private lastFlush: number = Date.now();

  constructor(bufferSize = 10, flushIntervalMs = 50) {
    this.bufferSize = bufferSize;
    this.flushInterval = flushIntervalMs;
  }

  /**
   * 添加块到缓冲区
   */
  addChunk(chunk: string): string | null {
    this.chunkBuffer.push(chunk);

    // 检查是否需要刷新
    if (this.shouldFlush()) {
      return this.flush();
    }

    return null;
  }

  /**
   * 判断是否应该刷新
   */
  private shouldFlush(): boolean {
    return (
      this.chunkBuffer.length >= this.bufferSize ||
      Date.now() - this.lastFlush >= this.flushInterval
    );
  }

  /**
   * 刷新缓冲区
   */
  flush(): string {
    const combined = this.chunkBuffer.join('');
    this.chunkBuffer = [];
    this.lastFlush = Date.now();
    return combined;
  }

  /**
   * 强制刷新
   */
  forceFlush(): string {
    return this.flush();
  }

  /**
   * 获取缓冲区状态
   */
  getBufferState(): { size: number; lastFlush: number } {
    return {
      size: this.chunkBuffer.length,
      lastFlush: this.lastFlush,
    };
  }
}

// ==================== 综合代理优化器 ====================

export class AgentRuntimeOptimizer {
  private sessionPool: SessionPoolOptimizer;
  private modelCache: ModelCallCacheOptimizer;
  private toolOptimizer: ToolCallOptimizer;
  private streamOptimizer: StreamOptimizer;
  private metrics: AgentMetrics;

  constructor() {
    this.sessionPool = new SessionPoolOptimizer();
    this.modelCache = new ModelCallCacheOptimizer();
    this.toolOptimizer = new ToolCallOptimizer();
    this.streamOptimizer = new StreamOptimizer();
    this.metrics = {
      sessionLoads: 0,
      sessionLoadTime: 0,
      modelCalls: 0,
      modelCallTime: 0,
      toolCalls: 0,
      toolCallTime: 0,
      streamChunks: 0,
      streamTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * 获取会话池
   */
  getSessionPool(): SessionPoolOptimizer {
    return this.sessionPool;
  }

  /**
   * 获取模型缓存
   */
  getModelCache(): ModelCallCacheOptimizer {
    return this.modelCache;
  }

  /**
   * 获取工具优化器
   */
  getToolOptimizer(): ToolCallOptimizer {
    return this.toolOptimizer;
  }

  /**
   * 获取流优化器
   */
  getStreamOptimizer(): StreamOptimizer {
    return this.streamOptimizer;
  }

  /**
   * 记录会话加载
   */
  recordSessionLoad(duration: number): void {
    this.metrics.sessionLoads++;
    this.metrics.sessionLoadTime += duration;
  }

  /**
   * 记录模型调用
   */
  recordModelCall(duration: number, cached: boolean): void {
    this.metrics.modelCalls++;
    this.metrics.modelCallTime += duration;
    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * 记录工具调用
   */
  recordToolCall(toolName: string, duration: number): void {
    this.metrics.toolCalls++;
    this.metrics.toolCallTime += duration;
    this.toolOptimizer.recordCall(toolName, duration);
  }

  /**
   * 记录流式块
   */
  recordStreamChunk(duration: number): void {
    this.metrics.streamChunks++;
    this.metrics.streamTime += duration;
  }

  /**
   * 获取性能指标
   */
  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取所有统计
   */
  getAllStats(): {
    sessionPool: { size: number; hitRate: number };
    modelCache: { size: number; hitRate: number; totalTokens: number };
    toolStats: Array<{ name: string; avgTime: number }>;
    metrics: AgentMetrics;
  } {
    return {
      sessionPool: this.sessionPool.getStats(),
      modelCache: this.modelCache.getStats(),
      toolStats: this.toolOptimizer.getSlowestTools(5),
      metrics: this.getMetrics(),
    };
  }

  /**
   * 重置指标
   */
  resetMetrics(): void {
    this.metrics = {
      sessionLoads: 0,
      sessionLoadTime: 0,
      modelCalls: 0,
      modelCallTime: 0,
      toolCalls: 0,
      toolCallTime: 0,
      streamChunks: 0,
      streamTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * 清理所有缓存
   */
  clearAll(): void {
    this.sessionPool.clear();
    this.modelCache.clear();
    this.toolOptimizer.clear();
    this.resetMetrics();
  }
}

// ==================== 全局实例 ====================

let globalAgentOptimizer: AgentRuntimeOptimizer | null = null;

export function getGlobalAgentOptimizer(): AgentRuntimeOptimizer {
  if (!globalAgentOptimizer) {
    globalAgentOptimizer = new AgentRuntimeOptimizer();
  }
  return globalAgentOptimizer;
}

export function resetGlobalAgentOptimizer(): void {
  globalAgentOptimizer = null;
}
