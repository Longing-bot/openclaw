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
  private accessOrder: string[] = []; // LRU 跟踪
  private maxSize: number;
  private ttlMs: number;
  private sessionKeyIndex = new Map<string, Set<string>>(); // 会话到键的索引

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
      // 从访问顺序中移除
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return undefined;
    }

    // 更新访问顺序（移到末尾）
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }

    // 更新命中计数
    entry.hitCount++;
    return entry;
  }

  /**
   * 设置缓存 - 使用 LRU 淘汰策略
   */
  set(
    sessionId: string,
    messages: AgentMessage[],
    estimatedTokens: number,
    tokenBudget?: number,
    model?: string
  ): void {
    const key = this.generateKey(sessionId, tokenBudget, model);

    // 如果已存在，更新访问顺序
    if (this.cache.has(key)) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    } else if (this.cache.size >= this.maxSize) {
      // LRU 淘汰：删除最久未访问的
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        const oldEntry = this.cache.get(lruKey);
        if (oldEntry) {
          // 从会话索引中移除
          const oldSessionId = lruKey.split(':')[0];
          const sessionKeys = this.sessionKeyIndex.get(oldSessionId);
          if (sessionKeys) {
            sessionKeys.delete(lruKey);
            if (sessionKeys.size === 0) {
              this.sessionKeyIndex.delete(oldSessionId);
            }
          }
        }
        this.cache.delete(lruKey);
      }
    }

    // 添加到缓存
    this.cache.set(key, {
      messages,
      estimatedTokens,
      timestamp: Date.now(),
      hitCount: 0,
    });

    // 更新访问顺序
    this.accessOrder.push(key);

    // 更新会话索引
    if (!this.sessionKeyIndex.has(sessionId)) {
      this.sessionKeyIndex.set(sessionId, new Set());
    }
    this.sessionKeyIndex.get(sessionId)!.add(key);
  }

  /**
   * 清除会话的缓存 - 使用索引优化
   */
  invalidateSession(sessionId: string): void {
    const sessionKeys = this.sessionKeyIndex.get(sessionId);
    if (sessionKeys) {
      for (const key of sessionKeys) {
        this.cache.delete(key);
        // 从访问顺序中移除
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
          this.accessOrder.splice(index, 1);
        }
      }
      this.sessionKeyIndex.delete(sessionId);
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
  private static readonly COMPRESSION_PATTERNS = [
    // 压缩重复字符
    { pattern: /(.+)\1{2,}/g, replacement: '$1$1' },
    // 压缩长 URL
    { pattern: /https?:\/\/[^\s]{50,}/g, replacement: (match: string) => match.slice(0, 30) + '...' },
    // 压缩 base64
    { pattern: /data:[^;]+;base64,[A-Za-z0-9+/]{100,}/g, replacement: '[base64-data]' },
    // 压缩长代码块
    { pattern: /```[\s\S]{500,}?```/g, replacement: '[code-block]' },
  ];

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
            return { ...part, text: this.compressText((part as { text: string }).text) };
          } else if (part.type === 'image' && 'url' in part) {
            // 压缩图片 URL
            const url = (part as { url: string }).url;
            if (url.length > 100) {
              return { ...part, url: url.slice(0, 50) + '...' };
            }
          }
          return part;
        }),
      };
    }

    return message;
  }

  /**
   * 智能压缩文本内容
   */
  private static compressText(text: string): string {
    let compressed = text;

    // 应用压缩模式
    for (const { pattern, replacement } of this.COMPRESSION_PATTERNS) {
      if (typeof replacement === 'function') {
        compressed = compressed.replace(pattern, replacement);
      } else {
        compressed = compressed.replace(pattern, replacement);
      }
    }

    // 移除多余的空白
    compressed = compressed.replace(/\s+/g, ' ').trim();

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

  /**
   * 压缩率
   */
  static getCompressionRatio(original: AgentMessage[], compressed: AgentMessage[]): number {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = JSON.stringify(compressed).length;
    return originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0;
  }
}

// ==================== 智能上下文检索 ====================

export class SmartRetriever {
  private messageIndex = new Map<string, Map<string, Set<AgentMessage>>>(); // sessionId -> keyword -> messages (Set去重)
  private messageTimestamps = new Map<AgentMessage, number>(); // 消息时间戳
  private stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  ]);

  /**
   * 索引消息用于快速检索
   */
  indexMessage(sessionId: string, message: AgentMessage): void {
    if (!this.messageIndex.has(sessionId)) {
      this.messageIndex.set(sessionId, new Map());
    }

    const sessionIndex = this.messageIndex.get(sessionId)!;
    const keywords = this.extractKeywords(message);

    // 记录时间戳
    this.messageTimestamps.set(message, Date.now());

    for (const keyword of keywords) {
      if (!sessionIndex.has(keyword)) {
        sessionIndex.set(keyword, new Set());
      }
      sessionIndex.get(keyword)!.add(message);
    }
  }

  /**
   * 智能关键词提取（支持中英文）
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

    // 提取英文单词
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    
    // 提取中文词组（简单按2-4字切分）
    const chineseChars = text.replace(/[^\u4e00-\u9fa5]/g, '');
    const chinesePhrases: string[] = [];
    for (let i = 0; i < chineseChars.length - 1; i++) {
      chinesePhrases.push(chineseChars.slice(i, i + 2));
      if (i < chineseChars.length - 2) {
        chinesePhrases.push(chineseChars.slice(i, i + 3));
      }
    }

    // 提取代码标识符
    const codeIdentifiers = text.match(/[a-zA-Z_][a-zA-Z0-9_]{2,}/g) || [];

    // 合并并过滤停用词
    const allKeywords = [...englishWords, ...chinesePhrases, ...codeIdentifiers]
      .map(w => w.toLowerCase())
      .filter(w => !this.stopWords.has(w) && w.length > 1);

    // 统计词频，取高频词
    const freq = new Map<string, number>();
    for (const word of allKeywords) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }

    // 按频率排序，取前15个
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);
  }

  /**
   * 检索相关消息（带时间衰减和相关性评分）
   */
  retrieve(options: SmartRetrievalOptions): AgentMessage[] {
    const { sessionId, query, maxResults = 5, timeWeight = 0.3, relevanceWeight = 0.7 } = options;
    const sessionIndex = this.messageIndex.get(sessionId);

    if (!sessionIndex) {
      return [];
    }

    const queryKeywords = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1 && !this.stopWords.has(word));

    const now = Date.now();
    const scoredMessages = new Map<AgentMessage, { relevance: number; recency: number }>();

    for (const keyword of queryKeywords) {
      const messages = sessionIndex.get(keyword) || [];
      for (const message of messages) {
        const current = scoredMessages.get(message) || { relevance: 0, recency: 0 };
        
        // 相关性评分：关键词匹配数量
        current.relevance += 1;
        
        // 时间衰减评分：越新越高
        const timestamp = this.messageTimestamps.get(message) || 0;
        const ageMinutes = (now - timestamp) / (1000 * 60);
        current.recency = Math.max(current.recency, Math.exp(-ageMinutes / 60)); // 1小时衰减
        
        scoredMessages.set(message, current);
      }
    }

    // 综合评分排序
    return [...scoredMessages.entries()]
      .map(([message, scores]) => ({
        message,
        score: scores.relevance * relevanceWeight + scores.recency * timeWeight,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.message);
  }

  /**
   * 清除会话索引
   */
  clearSession(sessionId: string): void {
    const sessionIndex = this.messageIndex.get(sessionId);
    if (sessionIndex) {
      // 清理时间戳
      for (const messages of sessionIndex.values()) {
        for (const message of messages) {
          this.messageTimestamps.delete(message);
        }
      }
    }
    this.messageIndex.delete(sessionId);
  }

  /**
   * 获取索引统计
   */
  getStats(sessionId?: string): { keywords: number; messages: number } {
    if (sessionId) {
      const sessionIndex = this.messageIndex.get(sessionId);
      if (!sessionIndex) return { keywords: 0, messages: 0 };
      
      let messageCount = 0;
      for (const messages of sessionIndex.values()) {
        messageCount += messages.size;
      }
      return { keywords: sessionIndex.size, messages: messageCount };
    }

    // 全局统计
    let totalKeywords = 0;
    let totalMessages = 0;
    for (const sessionIndex of this.messageIndex.values()) {
      totalKeywords += sessionIndex.size;
      for (const messages of sessionIndex.values()) {
        totalMessages += messages.size;
      }
    }
    return { keywords: totalKeywords, messages: totalMessages };
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
   * 智能估算消息的 token 数（支持多语言）
   */
  private estimateTokens(messages: AgentMessage[]): number {
    let totalTokens = 0;

    for (const message of messages) {
      const text = typeof message.content === 'string'
        ? message.content
        : Array.isArray(message.content)
          ? message.content
            .filter(p => p.type === 'text')
            .map(p => (p as { text: string }).text)
            .join('')
          : '';

      // 分别计算中文和英文的 token
      const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
      const numbers = (text.match(/\d+/g) || []).length;
      const punctuation = (text.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length;

      // 中文：约 1.5 token/字
      // 英文：约 1.3 token/词
      // 数字：约 2 token/组
      // 标点：约 0.5 token/个
      totalTokens += chineseChars * 1.5 + englishWords * 1.3 + numbers * 2 + punctuation * 0.5;
    }

    return Math.ceil(totalTokens);
  }

  /**
   * 智能裁剪消息到预算内（保留重要消息）
   */
  private trimToBudget(messages: AgentMessage[], tokenBudget: number): AgentMessage[] {
    // 计算每条消息的 token 和重要性
    const scored = messages.map((msg, index) => ({
      message: msg,
      tokens: this.estimateTokens([msg]),
      importance: this.calculateMessageImportance(msg, index, messages.length),
    }));

    // 按重要性排序，但最后一条消息（通常是最新用户输入）必须保留
    const lastMessage = scored.pop();
    scored.sort((a, b) => b.importance - a.importance);

    // 贪心选择
    const result: typeof scored = [];
    let currentTokens = lastMessage ? lastMessage.tokens : 0;

    if (lastMessage && lastMessage.tokens <= tokenBudget) {
      result.push(lastMessage);
    }

    for (const item of scored) {
      if (currentTokens + item.tokens <= tokenBudget) {
        result.push(item);
        currentTokens += item.tokens;
      }
    }

    // 按原始顺序排序
    return result
      .sort((a, b) => messages.indexOf(a.message) - messages.indexOf(b.message))
      .map(item => item.message);
  }

  /**
   * 计算消息重要性
   */
  private calculateMessageImportance(
    message: AgentMessage,
    index: number,
    total: number
  ): number {
    let importance = 0;

    // 位置权重：最新的消息更重要
    importance += (index / total) * 0.3;

    // 系统消息更重要
    if (message.role === 'system') {
      importance += 0.5;
    }

    // 用户输入比助手回复更重要（通常包含关键信息）
    if (message.role === 'user') {
      importance += 0.3;
    }

    // 包含代码的消息更重要
    const text = typeof message.content === 'string' ? message.content : '';
    if (text.includes('```') || text.includes('function') || text.includes('class')) {
      importance += 0.2;
    }

    // 包含错误信息的消息更重要
    if (text.includes('error') || text.includes('Error') || text.includes('错误')) {
      importance += 0.2;
    }

    return importance;
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
