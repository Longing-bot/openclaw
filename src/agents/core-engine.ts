/**
 * OpenClaw SuperClaw 核心引擎 (优化版)
 * 
 * 使用统一基础架构，减少重复代码
 */

import {
  BaseSystem,
  Cache,
  PriorityQueue,
  LockManager,
  EventEmitter,
  now,
  generateId
} from './superclaw-base.js';

// ==================== 状态机 ====================

type StateHandler = () => void | Promise<void>;

export class StateMachine {
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
    
    const nextState = this.transitions.get(this.currentState)?.get(event);
    if (!nextState) return false;
    
    this.currentState = nextState;
    const handler = this.states.get(nextState);
    if (handler) await handler();
    
    return true;
  }

  setState(name: string): void {
    this.currentState = name;
  }

  getState(): string | null {
    return this.currentState;
  }

  clear(): void {
    this.states.clear();
    this.transitions.clear();
    this.currentState = null;
  }
}

// ==================== 中间件系统 ====================

type MiddlewareFn = (ctx: any, next: () => Promise<void>) => Promise<void>;

export class MiddlewareSystem {
  private middlewares: MiddlewareFn[] = [];

  use(middleware: MiddlewareFn): void {
    this.middlewares.push(middleware);
  }

  async execute(ctx: any): Promise<void> {
    const executeMiddleware = async (index: number): Promise<void> => {
      if (index >= this.middlewares.length) return;
      await this.middlewares[index](ctx, () => executeMiddleware(index + 1));
    };
    await executeMiddleware(0);
  }

  clear(): void {
    this.middlewares = [];
  }
}

// ==================== 核心引擎 ====================

export class SuperClawCoreEngine extends BaseSystem {
  readonly name = 'core-engine';
  
  public cache: Cache;
  public queue: PriorityQueue;
  public locks: LockManager;
  public events: EventEmitter;
  public stateMachine: StateMachine;
  public middleware: MiddlewareSystem;

  constructor() {
    super();
    this.cache = new Cache();
    this.queue = new PriorityQueue();
    this.locks = new LockManager();
    this.events = new EventEmitter();
    this.stateMachine = new StateMachine();
    this.middleware = new MiddlewareSystem();
    
    // 定期清理
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    this.cache.cleanup();
    this.locks.cleanup();
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      cacheSize: this.cache.size,
      queueSize: this.queue.size,
      state: this.stateMachine.getState(),
    };
  }

  clear(): void {
    this.cache.clear();
    this.queue.clear();
    this.locks.clear();
    this.events.clear();
    this.stateMachine.clear();
    this.middleware.clear();
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
