/**
 * 内存优化工具
 * 用于监控和优化OpenClaw的内存使用
 */

export class MemoryOptimizer {
  private objectPools: Map<string, any[]> = new Map();
  private weakRefs: Map<string, WeakRef<any>> = new Map();
  private registry: FinalizationRegistry<string>;

  constructor() {
    this.registry = new FinalizationRegistry((key) => {
      console.log(`Object ${key} was garbage collected`);
      this.weakRefs.delete(key);
    });
  }

  /**
   * 创建对象池
   */
  createPool<T>(name: string, factory: () => T, initialSize: number = 10): void {
    const pool: T[] = [];
    for (let i = 0; i < initialSize; i++) {
      pool.push(factory());
    }
    this.objectPools.set(name, pool);
  }

  /**
   * 从池中获取对象
   */
  acquire<T>(poolName: string, factory: () => T): T {
    const pool = this.objectPools.get(poolName);
    if (pool && pool.length > 0) {
      return pool.pop() as T;
    }
    return factory();
  }

  /**
   * 释放对象到池中
   */
  release<T>(poolName: string, obj: T, maxSize: number = 100): void {
    const pool = this.objectPools.get(poolName);
    if (pool && pool.length < maxSize) {
      pool.push(obj);
    }
  }

  /**
   * 注册弱引用
   */
  registerWeakRef<T extends object>(key: string, obj: T): void {
    const weakRef = new WeakRef(obj);
    this.weakRefs.set(key, weakRef);
    this.registry.register(obj, key);
  }

  /**
   * 获取弱引用对象
   */
  getWeakRef<T>(key: string): T | undefined {
    const weakRef = this.weakRefs.get(key);
    return weakRef?.deref() as T | undefined;
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * 强制垃圾回收（仅用于调试）
   */
  forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }
}

// 全局实例
export const memoryOptimizer = new MemoryOptimizer();
