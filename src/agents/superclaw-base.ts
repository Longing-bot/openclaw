/**
 * OpenClaw SuperClaw 基础架构
 * 
 * 统一所有系统的公共模式，减少重复代码
 * 设计原则：轻量化、高效率、低开销
 */

// ==================== 工具函数 ====================

export const now = () => Date.now();
export const generateId = (prefix: string) => `${prefix}_${now()}_${Math.random().toString(36).slice(2, 9)}`;

// ==================== 接口定义 ====================

export interface Clearable {
  clear(): void;
}

export interface StatsProvider {
  getStats(): Record<string, any>;
}

export interface SuperClawSystem extends Clearable, StatsProvider {
  readonly name: string;
}

// ==================== 基础类 ====================

export abstract class BaseSystem implements SuperClawSystem {
  abstract readonly name: string;
  
  abstract clear(): void;
  abstract getStats(): Record<string, any>;
}

// ==================== 全局实例管理器 ====================

export class GlobalInstanceManager<T> {
  private instances = new Map<string, T>();
  
  get(key: string, factory: () => T): T {
    if (!this.instances.has(key)) {
      this.instances.set(key, factory());
    }
    return this.instances.get(key)!;
  }
  
  has(key: string): boolean {
    return this.instances.has(key);
  }
  
  set(key: string, instance: T): void {
    this.instances.set(key, instance);
  }
  
  delete(key: string): boolean {
    return this.instances.delete(key);
  }
  
  clear(): void {
    this.instances.clear();
  }
  
  get size(): number {
    return this.instances.size;
  }
}

// ==================== 通用数据结构 ====================

export class ManagedMap<K, V> extends Map<K, V> {
  private maxSize: number;
  
  constructor(maxSize = 1000) {
    super();
    this.maxSize = maxSize;
  }
  
  set(key: K, value: V): this {
    // LRU 淘汰
    if (this.size >= this.maxSize) {
      const oldestKey = this.keys().next().value;
      if (oldestKey !== undefined) {
        this.delete(oldestKey);
      }
    }
    return super.set(key, value);
  }
}

export class ManagedArray<T> extends Array<T> {
  private maxSize: number;
  
  constructor(maxSize = 1000) {
    super();
    this.maxSize = maxSize;
  }
  
  push(...items: T[]): number {
    const result = super.push(...items);
    
    // 超出大小时移除最旧的
    while (this.length > this.maxSize) {
      this.shift();
    }
    
    return result;
  }
}

// ==================== 事件发射器 ====================

type EventHandler = (data: any) => void | Promise<void>;

export class EventEmitter {
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
    
    const executeHandler = (handler: EventHandler) => {
      try {
        const result = handler(data);
        if (result instanceof Promise) promises.push(result);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    };
    
    handlers?.forEach(executeHandler);
    onceHandlers?.forEach(executeHandler);
    onceHandlers?.clear();
    
    if (promises.length > 0) await Promise.all(promises);
  }

  clear(): void {
    this.handlers.clear();
    this.onceHandlers.clear();
  }
}

// ==================== 定时器管理器 ====================

export class TimerManager {
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private intervals = new Set<ReturnType<typeof setInterval>>();

  setTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  setInterval(fn: () => void, interval: number): ReturnType<typeof setInterval> {
    const intervalId = setInterval(fn, interval);
    this.intervals.add(intervalId);
    return intervalId;
  }

  clearTimeout(timer: ReturnType<typeof setTimeout>): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  clearInterval(intervalId: ReturnType<typeof setInterval>): void {
    clearInterval(intervalId);
    this.intervals.delete(intervalId);
  }

  clearAll(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    for (const intervalId of this.intervals) {
      clearInterval(intervalId);
    }
    this.timers.clear();
    this.intervals.clear();
  }
}

// ==================== 统计收集器 ====================

export class StatsCollector {
  private stats = new Map<string, any>();

  set(key: string, value: any): void {
    this.stats.set(key, value);
  }

  get(key: string, defaultValue?: any): any {
    return this.stats.get(key) ?? defaultValue;
  }

  increment(key: string, delta = 1): number {
    const current = this.get(key, 0) as number;
    const newValue = current + delta;
    this.set(key, newValue);
    return newValue;
  }

  decrement(key: string, delta = 1): number {
    return this.increment(key, -delta);
  }

  recordTiming(key: string, duration: number): void {
    const timings = this.get(key, []) as number[];
    timings.push(duration);
    
    // 只保留最近 100 个
    if (timings.length > 100) {
      timings.shift();
    }
    
    this.set(key, timings);
  }

  getAverage(key: string): number {
    const timings = this.get(key, []) as number[];
    if (timings.length === 0) return 0;
    return timings.reduce((a, b) => a + b, 0) / timings.length;
  }

  getAll(): Record<string, any> {
    return Object.fromEntries(this.stats);
  }

  clear(): void {
    this.stats.clear();
  }
}

// ==================== 缓存系统 ====================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

export class Cache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(defaultTTL = 300000, maxSize = 1000) {
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    entry.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    // LRU 淘汰
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      value,
      expiresAt: now() + (ttl ?? this.defaultTTL),
      hits: 0,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  cleanup(): number {
    const time = now();
    let cleaned = 0;
    for (const [key, entry] of this.cache) {
      if (time > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

// ==================== 优先级队列 ====================

interface QueueItem<T> {
  data: T;
  priority: number;
  addedAt: number;
}

export class PriorityQueue<T = any> {
  private items: QueueItem<T>[] = [];

  enqueue(data: T, priority = 0): void {
    const item = { data, priority, addedAt: now() };
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

export class LockManager {
  private locks = new Map<string, { owner: string; expiresAt: number }>();

  acquire(key: string, owner: string, ttl = 30000): boolean {
    const existing = this.locks.get(key);
    if (existing && now() < existing.expiresAt) {
      return false;
    }
    
    this.locks.set(key, { owner, expiresAt: now() + ttl });
    return true;
  }

  release(key: string, owner: string): boolean {
    const lock = this.locks.get(key);
    if (!lock || lock.owner !== owner) return false;
    this.locks.delete(key);
    return true;
  }

  isLocked(key: string): boolean {
    const lock = this.locks.get(key);
    if (!lock) return false;
    if (now() > lock.expiresAt) {
      this.locks.delete(key);
      return false;
    }
    return true;
  }

  cleanup(): number {
    const time = now();
    let cleaned = 0;
    for (const [key, lock] of this.locks) {
      if (time > lock.expiresAt) {
        this.locks.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }

  clear(): void {
    this.locks.clear();
  }
}

// ==================== 导出 ====================

export const globalInstanceManager = new GlobalInstanceManager<any>();
export const globalTimers = new TimerManager();
