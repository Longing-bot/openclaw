/**
 * ContextEngineOptimizer - 上下文引擎优化器
 * 
 * 专注于优化 OpenClaw 的上下文管理，提升：
 * 1. 上下文组装速度
 * 2. 记忆检索效率
 * 3. 消息压缩率
 * 4. 跨会话上下文复用
 */

import type { AgentMessage } from "@mariozechner/pi-agent-core";

// ==================== 类型定义 ====================

export interface ContextCacheEntry {
  messages: AgentMessage[];
  estimatedTokens: number;
  timestamp: number;
  hitCount: number;
}

export interface ContextMetrics {
  assembleCount: number;
  cacheHits: number;
  cacheMisses: number;
  totalTokensProcessed: number;
  averageAssembleTime: number;
  compactionCount: number;
  bytesFreed: number;
}

export interface SmartRetrievalOptions {
  sessionId: string;
  query: string;
  maxResults?: number;
  timeWeight?: number;      // 时间权重 (0-1)
  relevanceWeight?: number; // 相关性权重 (0-1)
}

// ==================== 上下文缓存 ====================

export class ContextCache {
  private cache = new Map<string, ContextCacheEntry>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * 生成缓存键
   */
  private generateKey(sessionId: string, tokenBudget?: number, model?: string): string {
    return `${sessionId}:${tokenBudget || 'default'}:${model || 'default'}`;
  }

  /**
   * 获取缓存的上下文
   */
  get(sessionId: string, tokenBudget?: number, model?: string): ContextCacheEntry | undefined {
    const key = this.generateKey(sessionId, tokenBudget, model);
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // 检查 TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    // 更新命中计数
    entry.hitCount++;
    return entry;
  }

  /**
   * 设置缓存
   */
  set(
    sessionId: string,
    messages: AgentMessage[],
    estimatedTokens: number,
    tokenBudget?: number,
    model?: string
  ): void {
    const key = this.generateKey(sessionId, tokenBudget, model);

    // 如果缓存满了，删除最旧的
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      messages,
      estimatedTokens,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  /**
   * 清除会话的缓存
   */
  invalidateSession(sessionId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; hitRate: number } {
    let totalHits = 0;
    let totalRequests = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount;
      totalRequests += entry.hitCount + 1; // +1 for initial set
    }

    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
    };
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }
}

// ==================== 智能消息压缩 ====================

export class MessageCompressor {
  /**
   * 压缩消息内容
   */
  static compressMessage(message: AgentMessage): AgentMessage {
    if (typeof message.content === 'string') {
      return {
        ...message,
        content: this.compressText(message.content),
      };
    }

    if (Array.isArray(message.content)) {
      return {
        ...message,
        content: message.content.map(part => {
          if (part.type === 'text') {
            return { ...part, text: this.compressText(part.text) };
          }
          return part;
        }),
      };
    }

    return message;
  }

  /**
   * 压缩文本内容
   */
  private static compressText(text: string): string {
    // 移除多余的空白
    let compressed = text.replace(/\s+/g, ' ').trim();

    // 移除重复的标点
    compressed = compressed.replace(/([.!?]){2,}/g, '$1');

    // 压缩长数字序列（保留前几位）
    compressed = compressed.replace(/\d{10,}/g, (match) => match.slice(0, 6) + '...');

    return compressed;
  }

  /**
   * 批量压缩消息
   */
  static compressMessages(messages: AgentMessage[]): AgentMessage[] {
    return messages.map(msg => this.compressMessage(msg));
  }

  /**
   * 估算压缩节省的字节数
   */
  static estimateSavings(original: AgentMessage[], compressed: AgentMessage[]): number {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = JSON.stringify(compressed).length;
    return originalSize - compressedSize;
  }
}

// ==================== 智能上下文检索 ====================

export class SmartRetriever {
  private messageIndex = new Map<string, Map<string, AgentMessage[]>>(); // sessionId -> keyword -> messages

  /**
   * 索引消息用于快速检索
   */
  indexMessage(sessionId: string, message: AgentMessage): void {
    if (!this.messageIndex.has(sessionId)) {
      this.messageIndex.set(sessionId, new Map());
    }

    const sessionIndex = this.messageIndex.get(sessionId)!;
    const keywords = this.extractKeywords(message);

    for (const keyword of keywords) {
      if (!sessionIndex.has(keyword)) {
        sessionIndex.set(keyword, []);
      }
      sessionIndex.get(keyword)!.push(message);
    }
  }

  /**
   * 从消息中提取关键词
   */
  private extractKeywords(message: AgentMessage): string[] {
    const text = typeof message.content === 'string'
      ? message.content
      : Array.isArray(message.content)
        ? message.content
          .filter(p => p.type === 'text')
          .map(p => (p as { text: string }).text)
          .join(' ')
        : '';

    // 简单的关键词提取（实际可以用更复杂的 NLP）
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3); // 过滤短词

    // 去重并返回前 10 个
    return [...new Set(words)].slice(0, 10);
  }

  /**
   * 检索相关消息
   */
  retrieve(options: SmartRetrievalOptions): AgentMessage[] {
    const { sessionId, query, maxResults = 5 } = options;
    const sessionIndex = this.messageIndex.get(sessionId);

    if (!sessionIndex) {
      return [];
    }

    const queryKeywords = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const scoredMessages = new Map<AgentMessage, number>();

    for (const keyword of queryKeywords) {
      const messages = sessionIndex.get(keyword) || [];
      for (const message of messages) {
        const currentScore = scoredMessages.get(message) || 0;
        scoredMessages.set(message, currentScore + 1);
      }
    }

    // 按分数排序并返回 top N
    return [...scoredMessages.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxResults)
      .map(([message]) => message);
  }

  /**
   * 清除会话索引
   */
  clearSession(sessionId: string): void {
    this.messageIndex.delete(sessionId);
  }
}

// ==================== 上下文组装优化器 ====================

export class ContextAssemblerOptimizer {
  private cache: ContextCache;
  private retriever: SmartRetriever;
  private metrics: ContextMetrics;

  constructor(cacheSize = 100, cacheTtlMs = 5 * 60 * 1000) {
    this.cache = new ContextCache(cacheSize, cacheTtlMs);
    this.retriever = new SmartRetriever();
    this.metrics = {
      assembleCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokensProcessed: 0,
      averageAssembleTime: 0,
      compactionCount: 0,
      bytesFreed: 0,
    };
  }

  /**
   * 优化后的上下文组装
   */
  async assemble(
    sessionId: string,
    messages: AgentMessage[],
    tokenBudget?: number,
    model?: string
  ): Promise<{ messages: AgentMessage[]; estimatedTokens: number; fromCache: boolean }> {
    const startTime = Date.now();
    this.metrics.assembleCount++;

    // 尝试从缓存获取
    const cached = this.cache.get(sessionId, tokenBudget, model);
    if (cached) {
      this.metrics.cacheHits++;
      return {
        messages: cached.messages,
        estimatedTokens: cached.estimatedTokens,
        fromCache: true,
      };
    }

    this.metrics.cacheMisses++;

    // 压缩消息
    const compressed = MessageCompressor.compressMessages(messages);
    const bytesSaved = MessageCompressor.estimateSavings(messages, compressed);
    this.metrics.bytesFreed += bytesSaved;

    // 估算 token 数
    const estimatedTokens = this.estimateTokens(compressed);

    // 如果超过预算，裁剪消息
    let finalMessages = compressed;
    if (tokenBudget && estimatedTokens > tokenBudget) {
      finalMessages = this.trimToBudget(compressed, tokenBudget);
      this.metrics.compactionCount++;
    }

    // 更新缓存
    this.cache.set(sessionId, finalMessages, estimatedTokens, tokenBudget, model);

    // 更新指标
    this.metrics.totalTokensProcessed += estimatedTokens;
    const elapsed = Date.now() - startTime;
    this.metrics.averageAssembleTime =
      (this.metrics.averageAssembleTime * (this.metrics.assembleCount - 1) + elapsed) /
      this.metrics.assembleCount;

    return {
      messages: finalMessages,
      estimatedTokens,
      fromCache: false,
    };
  }

  /**
   * 估算消息的 token 数
   */
  private estimateTokens(messages: AgentMessage[]): number {
    let totalChars = 0;
    for (const message of messages) {
      if (typeof message.content === 'string') {
        totalChars += message.content.length;
      } else if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === 'text') {
            totalChars += (part as { text: string }).text.length;
          }
        }
      }
    }
    // 粗略估算：1 token ≈ 4 字符
    return Math.ceil(totalChars / 4);
  }

  /**
   * 裁剪消息到预算内
   */
  private trimToBudget(messages: AgentMessage[], tokenBudget: number): AgentMessage[] {
    const result: AgentMessage[] = [];
    let currentTokens = 0;

    // 从最新的消息开始保留
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = this.estimateTokens([message]);

      if (currentTokens + messageTokens <= tokenBudget) {
        result.unshift(message);
        currentTokens += messageTokens;
      } else {
        break;
      }
    }

    return result;
  }

  /**
   * 索引消息用于检索
   */
  indexForRetrieval(sessionId: string, message: AgentMessage): void {
    this.retriever.indexMessage(sessionId, message);
  }

  /**
   * 检索相关上下文
   */
  retrieveRelevant(sessionId: string, query: string, maxResults = 5): AgentMessage[] {
    return this.retriever.retrieve({ sessionId, query, maxResults });
  }

  /**
   * 使会话缓存失效
   */
  invalidateSession(sessionId: string): void {
    this.cache.invalidateSession(sessionId);
    this.retriever.clearSession(sessionId);
  }

  /**
   * 获取性能指标
   */
  getMetrics(): ContextMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; hitRate: number } {
    return this.cache.getStats();
  }

  /**
   * 重置指标
   */
  resetMetrics(): void {
    this.metrics = {
      assembleCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokensProcessed: 0,
      averageAssembleTime: 0,
      compactionCount: 0,
      bytesFreed: 0,
    };
  }
}

// ==================== 跨会话上下文管理器 ====================

export class CrossSessionContextManager {
  private sessionContexts = new Map<string, Map<string, unknown>>();
  private globalContext = new Map<string, unknown>();

  /**
   * 设置会话级上下文
   */
  setSessionContext<T>(sessionId: string, key: string, value: T): void {
    if (!this.sessionContexts.has(sessionId)) {
      this.sessionContexts.set(sessionId, new Map());
    }
    this.sessionContexts.get(sessionId)!.set(key, value);
  }

  /**
   * 获取会话级上下文
   */
  getSessionContext<T>(sessionId: string, key: string): T | undefined {
    return this.sessionContexts.get(sessionId)?.get(key) as T | undefined;
  }

  /**
   * 设置全局上下文
   */
  setGlobalContext<T>(key: string, value: T): void {
    this.globalContext.set(key, value);
  }

  /**
   * 获取全局上下文
   */
  getGlobalContext<T>(key: string): T | undefined {
    return this.globalContext.get(key) as T | undefined;
  }

  /**
   * 在会话间共享上下文
   */
  shareContext(sourceSessionId: string, targetSessionId: string, key: string): boolean {
    const sourceContext = this.sessionContexts.get(sourceSessionId);
    if (!sourceContext || !sourceContext.has(key)) {
      return false;
    }

    if (!this.sessionContexts.has(targetSessionId)) {
      this.sessionContexts.set(targetSessionId, new Map());
    }

    this.sessionContexts.get(targetSessionId)!.set(key, sourceContext.get(key));
    return true;
  }

  /**
   * 清除会话上下文
   */
  clearSessionContext(sessionId: string): void {
    this.sessionContexts.delete(sessionId);
  }

  /**
   * 获取所有会话 ID
   */
  getSessionIds(): string[] {
    return [...this.sessionContexts.keys()];
  }
}

// ==================== 全局优化器实例 ====================

let globalContextOptimizer: ContextAssemblerOptimizer | null = null;
let globalCrossSessionManager: CrossSessionContextManager | null = null;

export function getGlobalContextOptimizer(): ContextAssemblerOptimizer {
  if (!globalContextOptimizer) {
    globalContextOptimizer = new ContextAssemblerOptimizer();
  }
  return globalContextOptimizer;
}

export function getGlobalCrossSessionManager(): CrossSessionContextManager {
  if (!globalCrossSessionManager) {
    globalCrossSessionManager = new CrossSessionContextManager();
  }
  return globalCrossSessionManager;
}

export function resetGlobalContextOptimizer(): void {
  globalContextOptimizer = null;
  globalCrossSessionManager = null;
}
