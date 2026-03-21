import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContextCache,
  MessageCompressor,
  SmartRetriever,
  ContextAssemblerOptimizer,
  CrossSessionContextManager,
} from './context-optimizer.js';
import type { AgentMessage } from '@mariozechner/pi-agent-core';

describe('ContextCache', () => {
  let cache: ContextCache;

  beforeEach(() => {
    cache = new ContextCache(10, 1000);
  });

  it('should cache and retrieve context', () => {
    const messages: AgentMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];

    cache.set('session1', messages, 100);
    const result = cache.get('session1');

    expect(result).toBeDefined();
    expect(result?.messages).toEqual(messages);
    expect(result?.estimatedTokens).toBe(100);
  });

  it('should return undefined for expired cache', async () => {
    const messages: AgentMessage[] = [{ role: 'user', content: 'Hello' }];
    cache.set('session1', messages, 50);

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    const result = cache.get('session1');
    expect(result).toBeUndefined();
  });

  it('should invalidate session cache', () => {
    const messages: AgentMessage[] = [{ role: 'user', content: 'Hello' }];
    cache.set('session1', messages, 50);
    cache.invalidateSession('session1');

    const result = cache.get('session1');
    expect(result).toBeUndefined();
  });

  it('should track hit count', () => {
    const messages: AgentMessage[] = [{ role: 'user', content: 'Hello' }];
    cache.set('session1', messages, 50);

    cache.get('session1');
    cache.get('session1');
    cache.get('session1');

    const stats = cache.getStats();
    expect(stats.hitRate).toBeGreaterThan(0);
  });
});

describe('MessageCompressor', () => {
  it('should compress text messages', () => {
    const message: AgentMessage = {
      role: 'user',
      content: 'Hello    world!!!   This   is   a   test...',
    };

    const compressed = MessageCompressor.compressMessage(message);
    expect(compressed.content).toBe('Hello world!!! This is a test...');
  });

  it('should compress array content', () => {
    const message: AgentMessage = {
      role: 'user',
      content: [
        { type: 'text', text: 'Hello    world!!!' },
        { type: 'text', text: 'Another   text...' },
      ],
    };

    const compressed = MessageCompressor.compressMessage(message);
    expect(Array.isArray(compressed.content)).toBe(true);
  });

  it('should estimate savings', () => {
    const original: AgentMessage[] = [
      { role: 'user', content: 'Hello    world!!!' },
    ];
    const compressed: AgentMessage[] = [
      { role: 'user', content: 'Hello world!!!' },
    ];

    const savings = MessageCompressor.estimateSavings(original, compressed);
    expect(savings).toBeGreaterThan(0);
  });
});

describe('SmartRetriever', () => {
  let retriever: SmartRetriever;

  beforeEach(() => {
    retriever = new SmartRetriever();
  });

  it('should index and retrieve messages', () => {
    const message1: AgentMessage = {
      role: 'user',
      content: 'Tell me about machine learning algorithms',
    };
    const message2: AgentMessage = {
      role: 'assistant',
      content: 'Machine learning is a subset of artificial intelligence',
    };

    retriever.indexMessage('session1', message1);
    retriever.indexMessage('session1', message2);

    const results = retriever.retrieve({
      sessionId: 'session1',
      query: 'machine learning',
      maxResults: 5,
    });

    expect(results.length).toBeGreaterThan(0);
  });

  it('should return empty array for unknown session', () => {
    const results = retriever.retrieve({
      sessionId: 'unknown',
      query: 'test',
    });

    expect(results).toEqual([]);
  });

  it('should clear session index', () => {
    const message: AgentMessage = {
      role: 'user',
      content: 'Test message',
    };

    retriever.indexMessage('session1', message);
    retriever.clearSession('session1');

    const results = retriever.retrieve({
      sessionId: 'session1',
      query: 'test',
    });

    expect(results).toEqual([]);
  });
});

describe('ContextAssemblerOptimizer', () => {
  let optimizer: ContextAssemblerOptimizer;

  beforeEach(() => {
    optimizer = new ContextAssemblerOptimizer(10, 5000);
  });

  it('should assemble context from cache', async () => {
    const messages: AgentMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ];

    // First call - cache miss
    const result1 = await optimizer.assemble('session1', messages);
    expect(result1.fromCache).toBe(false);

    // Second call - cache hit
    const result2 = await optimizer.assemble('session1', messages);
    expect(result2.fromCache).toBe(true);
  });

  it('should trim messages to budget', async () => {
    const messages: AgentMessage[] = Array(100).fill(null).map((_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`.repeat(100),
    }));

    const result = await optimizer.assemble('session1', messages, 50);
    expect(result.messages.length).toBeLessThan(messages.length);
  });

  it('should track metrics', async () => {
    const messages: AgentMessage[] = [
      { role: 'user', content: 'Test' },
    ];

    await optimizer.assemble('session1', messages);
    await optimizer.assemble('session2', messages);

    const metrics = optimizer.getMetrics();
    expect(metrics.assembleCount).toBe(2);
    expect(metrics.cacheMisses).toBe(2);
  });

  it('should index messages for retrieval', () => {
    const message: AgentMessage = {
      role: 'user',
      content: 'This is a test message about optimization',
    };

    optimizer.indexForRetrieval('session1', message);
    const results = optimizer.retrieveRelevant('session1', 'optimization');

    expect(results.length).toBeGreaterThan(0);
  });

  it('should invalidate session', async () => {
    const messages: AgentMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    await optimizer.assemble('session1', messages);
    optimizer.invalidateSession('session1');

    const metrics = optimizer.getCacheStats();
    expect(metrics.size).toBe(0);
  });
});

describe('CrossSessionContextManager', () => {
  let manager: CrossSessionContextManager;

  beforeEach(() => {
    manager = new CrossSessionContextManager();
  });

  it('should set and get session context', () => {
    manager.setSessionContext('session1', 'key1', 'value1');
    const result = manager.getSessionContext('session1', 'key1');

    expect(result).toBe('value1');
  });

  it('should set and get global context', () => {
    manager.setGlobalContext('globalKey', { data: 'test' });
    const result = manager.getGlobalContext('globalKey');

    expect(result).toEqual({ data: 'test' });
  });

  it('should share context between sessions', () => {
    manager.setSessionContext('session1', 'sharedKey', 'sharedValue');
    const success = manager.shareContext('session1', 'session2', 'sharedKey');

    expect(success).toBe(true);
    expect(manager.getSessionContext('session2', 'sharedKey')).toBe('sharedValue');
  });

  it('should return false when sharing non-existent context', () => {
    const success = manager.shareContext('session1', 'session2', 'nonExistent');
    expect(success).toBe(false);
  });

  it('should clear session context', () => {
    manager.setSessionContext('session1', 'key1', 'value1');
    manager.clearSessionContext('session1');

    const result = manager.getSessionContext('session1', 'key1');
    expect(result).toBeUndefined();
  });

  it('should get all session ids', () => {
    manager.setSessionContext('session1', 'key1', 'value1');
    manager.setSessionContext('session2', 'key2', 'value2');

    const ids = manager.getSessionIds();
    expect(ids).toContain('session1');
    expect(ids).toContain('session2');
  });
});
