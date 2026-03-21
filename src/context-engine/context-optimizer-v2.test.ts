import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContextCache,
  SmartRetriever,
  ContextAssemblerOptimizer,
} from './context-optimizer.js';
import type { AgentMessage } from '@mariozechner/pi-agent-core';

describe('ContextCache LRU', () => {
  let cache: ContextCache;

  beforeEach(() => {
    cache = new ContextCache(3, 10000); // 最多3个缓存
  });

  it('should evict LRU entry when full', () => {
    const msg1: AgentMessage[] = [{ role: 'user', content: 'msg1' }];
    const msg2: AgentMessage[] = [{ role: 'user', content: 'msg2' }];
    const msg3: AgentMessage[] = [{ role: 'user', content: 'msg3' }];
    const msg4: AgentMessage[] = [{ role: 'user', content: 'msg4' }];

    cache.set('session1', msg1, 10);
    cache.set('session2', msg2, 20);
    cache.set('session3', msg3, 30);

    // 缓存满了，应该淘汰 session1
    cache.set('session4', msg4, 40);

    expect(cache.get('session1')).toBeUndefined();
    expect(cache.get('session2')).toBeDefined();
    expect(cache.get('session3')).toBeDefined();
    expect(cache.get('session4')).toBeDefined();
  });

  it('should update LRU order on access', () => {
    const msg1: AgentMessage[] = [{ role: 'user', content: 'msg1' }];
    const msg2: AgentMessage[] = [{ role: 'user', content: 'msg2' }];
    const msg3: AgentMessage[] = [{ role: 'user', content: 'msg3' }];
    const msg4: AgentMessage[] = [{ role: 'user', content: 'msg4' }];

    cache.set('session1', msg1, 10);
    cache.set('session2', msg2, 20);
    cache.set('session3', msg3, 30);

    // 访问 session1，更新其 LRU 顺序
    cache.get('session1');

    // 添加新缓存，应该淘汰 session2（最久未访问）
    cache.set('session4', msg4, 40);

    expect(cache.get('session1')).toBeDefined(); // 因为刚访问过
    expect(cache.get('session2')).toBeUndefined(); // 被淘汰
    expect(cache.get('session3')).toBeDefined();
    expect(cache.get('session4')).toBeDefined();
  });

  it('should invalidate session using index', () => {
    cache.set('session1', [], 10);
    cache.set('session1:x', [], 20);
    cache.set('session2', [], 30);

    cache.invalidateSession('session1');

    expect(cache.get('session1')).toBeUndefined();
    expect(cache.get('session1:x')).toBeUndefined();
    expect(cache.get('session2')).toBeDefined();
  });
});

describe('SmartRetriever', () => {
  let retriever: SmartRetriever;

  beforeEach(() => {
    retriever = new SmartRetriever();
  });

  it('should extract Chinese keywords', () => {
    const msg: AgentMessage = {
      role: 'user',
      content: '这是一个测试消息，用于验证中文关键词提取',
    };

    retriever.indexMessage('session1', msg);
    const results = retriever.retrieve({ sessionId: 'session1', query: '测试' });

    expect(results.length).toBeGreaterThan(0);
  });

  it('should extract English keywords', () => {
    const msg: AgentMessage = {
      role: 'user',
      content: 'This is a test message for keyword extraction',
    };

    retriever.indexMessage('session1', msg);
    const results = retriever.retrieve({ sessionId: 'session1', query: 'test' });

    expect(results.length).toBeGreaterThan(0);
  });

  it('should extract code identifiers', () => {
    const msg: AgentMessage = {
      role: 'user',
      content: 'function myFunction() { return contextOptimizer; }',
    };

    retriever.indexMessage('session1', msg);
    const results = retriever.retrieve({ sessionId: 'session1', query: 'myFunction' });

    expect(results.length).toBeGreaterThan(0);
  });

  it('should respect time decay', async () => {
    const oldMsg: AgentMessage = { role: 'user', content: 'old test message' };
    const newMsg: AgentMessage = { role: 'user', content: 'new test message' };

    retriever.indexMessage('session1', oldMsg);
    await new Promise(resolve => setTimeout(resolve, 100));
    retriever.indexMessage('session1', newMsg);

    const results = retriever.retrieve({
      sessionId: 'session1',
      query: 'test',
      maxResults: 2,
      timeWeight: 0.8,
      relevanceWeight: 0.2,
    });

    // 新消息应该排在前面
    expect(results[0]).toEqual(newMsg);
  });

  it('should return stats', () => {
    retriever.indexMessage('session1', { role: 'user', content: 'test message one' });
    retriever.indexMessage('session1', { role: 'user', content: 'test message two' });
    retriever.indexMessage('session2', { role: 'user', content: 'another session' });

    const stats = retriever.getStats('session1');
    expect(stats.keywords).toBeGreaterThan(0);
    expect(stats.messages).toBe(2);
  });
});

describe('ContextAssemblerOptimizer', () => {
  let optimizer: ContextAssemblerOptimizer;

  beforeEach(() => {
    optimizer = new ContextAssemblerOptimizer(10, 5000);
  });

  it('should trim messages by importance', async () => {
    const messages: AgentMessage[] = [
      { role: 'system', content: 'System prompt' }, // 高重要性
      { role: 'user', content: 'Short' },
      { role: 'assistant', content: 'Reply' },
      { role: 'user', content: 'Another question with error information' },
    ];

    const result = await optimizer.assemble('session1', messages, 20);

    // System 消息应该被保留
    expect(result.messages.some(m => m.role === 'system')).toBe(true);
  });

  it('should track metrics correctly', async () => {
    const messages: AgentMessage[] = [{ role: 'user', content: 'test' }];

    await optimizer.assemble('session1', messages);
    await optimizer.assemble('session1', messages); // cache hit
    await optimizer.assemble('session2', messages); // cache miss

    const metrics = optimizer.getMetrics();
    expect(metrics.assembleCount).toBe(3);
    expect(metrics.cacheHits).toBe(1);
    expect(metrics.cacheMisses).toBe(2);
  });

  it('should provide cache stats', async () => {
    const messages: AgentMessage[] = [{ role: 'user', content: 'test' }];

    await optimizer.assemble('session1', messages);
    await optimizer.assemble('session2', messages);

    const stats = optimizer.getCacheStats();
    expect(stats.size).toBe(2);
  });
});
