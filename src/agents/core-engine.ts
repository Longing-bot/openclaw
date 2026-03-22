/**
 * OpenClaw SuperClaw 核心引擎
 * 
 * 合并自：
 * - lightweight-cache.ts
 * - lightweight-queue.ts
 * - lightweight-lock-manager.ts
 * - lightweight-state-machine.ts
 * - lightweight-event-system.ts
 * - lightweight-middleware-system.ts
 * 
 * 设计原则：轻量化、高效率、低开销
 */

// ==================== 缓存系统 ====================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

export class LightweightCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTL = 300000) { // 5分钟
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    entry.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? this.defaultTTL),
      hits: 0,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }

  get size(): number {
    return this.cache.size;
  }
}

// ==================== 队列系统 ====================

interface QueueItem<T> {
  data: T;
  priority: number;
  addedAt: number;
}

export class LightweightQueue<T = any> {
  private items: QueueItem<T>[] = [];

  enqueue(data: T, priority = 0): void {
    const item = { data, priority, addedAt: Date.now() };
    const index = this.items.findIndex(i => i.priority < priority);
    if (index === -1) {
      this.items.push(item);
    } else {
      this.items.splice(index, 0, item);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.data;
  }

  peek(): T | undefined {
    return this.items[0]?.data;
  }

  get size(): number {
    return this.items.length;
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }
}

// ==================== 锁管理器 ====================

export class LightweightLockManager {
  private locks = new Map<string, { owner: string; expiresAt: number }>();

  acquire(key: string, owner: string, ttl = 30000): boolean {
    const existing = this.locks.get(key);
    if (existing && Date.now() < existing.expiresAt) {
      return false;
    }
    
    this.locks.set(key, {
      owner,
      expiresAt: Date.now() + ttl,
    });
    return true;
  }

  release(key: string, owner: string): boolean {
    const lock = this.locks.get(key);
    if (!lock || lock.owner !== owner) {
      return false;
    }
    this.locks.delete(key);
    return true;
  }

  isLocked(key: string): boolean {
    const lock = this.locks.get(key);
    if (!lock) return false;
    if (Date.now() > lock.expiresAt) {
      this.locks.delete(key);
      return false;
    }
    return true;
  }

  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, lock] of this.locks) {
      if (now > lock.expiresAt) {
        this.locks.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
}

// ==================== 状态机 ====================

type StateHandler = () => void | Promise<void>;

export class LightweightStateMachine {
  private states = new Map<string, StateHandler>();
  private transitions = new Map<string, Map<string, string>>();
  private currentState: string | null = null;

  addState(name: string, handler: StateHandler): void {
    this.states.set(name, handler);
    if (!this.transitions.has(name)) {
      this.transitions.set(name, new Map());
    }
  }

  addTransition(from: string, event: string, to: string): void {
    if (!this.transitions.has(from)) {
      this.transitions.set(from, new Map());
    }
    this.transitions.get(from)!.set(event, to);
  }

  async transition(event: string): Promise<boolean> {
    if (!this.currentState) return false;
    
    const stateTransitions = this.transitions.get(this.currentState);
    if (!stateTransitions) return false;
    
    const nextState = stateTransitions.get(event);
    if (!nextState) return false;
    
    this.currentState = nextState;
    const handler = this.states.get(nextState);
    if (handler) {
      await handler();
    }
    
    return true;
  }

  setState(name: string): void {
    this.currentState = name;
  }

  getState(): string | null {
    return this.currentState;
  }
}

// ==================== 事件系统 ====================

type EventHandler = (data: any) => void | Promise<void>;

export class LightweightEventSystem {
  private handlers = new Map<string, Set<EventHandler>>();
  private onceHandlers = new Map<string, Set<EventHandler>>();

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    
    return () => this.off(event, handler);
  }

  once(event: string, handler: EventHandler): () => void {
    if (!this.onceHandlers.has(event)) {
      this.onceHandlers.set(event, new Set());
    }
    this.onceHandlers.get(event)!.add(handler);
    
    return () => this.onceHandlers.get(event)?.delete(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
    this.onceHandlers.get(event)?.delete(handler);
  }

  async emit(event: string, data?: any): Promise<void> {
    const handlers = this.handlers.get(event);
    const onceHandlers = this.onceHandlers.get(event);
    
    const promises: Promise<void>[] = [];
    
    if (handlers) {
      for (const handler of handlers) {
        try {
          const result = handler(data);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          console.error(`Event handler error for ${event}:`, error);
        }
      }
    }
    
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        try {
          const result = handler(data);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          console.error(`Once event handler error for ${event}:`, error);
        }
      }
      onceHandlers.clear();
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
}

// ==================== 中间件系统 ====================

type MiddlewareFn = (ctx: any, next: () => Promise<void>) => Promise<void>;

export class LightweightMiddlewareSystem {
  private middlewares: MiddlewareFn[] = [];

  use(middleware: MiddlewareFn): void {
    this.middlewares.push(middleware);
  }

  async execute(ctx: any): Promise<void> {
    const executeMiddleware = async (index: number): Promise<void> => {
      if (index >= this.middlewares.length) {
        return;
      }
      
      const middleware = this.middlewares[index];
      await middleware(ctx, () => executeMiddleware(index + 1));
    };
    
    await executeMiddleware(0);
  }

  clear(): void {
    this.middlewares = [];
  }
}

// ==================== 统一核心引擎 ====================

export class SuperClawCoreEngine {
  public cache: LightweightCache;
  public queue: LightweightQueue;
  public locks: LightweightLockManager;
  public stateMachine: LightweightStateMachine;
  public events: LightweightEventSystem;
  public middleware: LightweightMiddlewareSystem;

  constructor() {
    this.cache = new LightweightCache();
    this.queue = new LightweightQueue();
    this.locks = new LightweightLockManager();
    this.stateMachine = new LightweightStateMachine();
    this.events = new LightweightEventSystem();
    this.middleware = new LightweightMiddlewareSystem();
    
    // 定期清理
    setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
  }

  private cleanup(): void {
    this.cache.cleanup();
    this.locks.cleanup();
  }

  getStats(): Record<string, any> {
    return {
      cacheSize: this.cache.size,
      queueSize: this.queue.size,
      state: this.stateMachine.getState(),
    };
  }
}

// ==================== 全局实例 ====================

let globalCoreEngine: SuperClawCoreEngine | null = null;

export function getGlobalCoreEngine(): SuperClawCoreEngine {
  if (!globalCoreEngine) {
    globalCoreEngine = new SuperClawCoreEngine();
  }
  return globalCoreEngine;
}

export function resetGlobalCoreEngine(): void {
  globalCoreEngine = null;
}
