/**
 * OpenClaw 轻量级锁管理器
 * 
 * 专为小参数模型优化：
 * 1. 简化的锁管理
 * 2. 快速锁获取
 * 3. 低计算开销
 */

export class LightweightLockManager {
  private locks: Map<string, { holder: string; acquiredAt: Date }> = new Map();

  constructor() {
    console.log('[LockManager] 初始化完成');
  }

  /**
   * 获取锁
   */
  acquire(resource: string, holder: string, timeout: number = 5000): boolean {
    const existing = this.locks.get(resource);

    if (existing) {
      // 检查是否超时
      if (Date.now() - existing.acquiredAt.getTime() > timeout) {
        this.locks.delete(resource);
      } else {
        return false;
      }
    }

    this.locks.set(resource, {
      holder,
      acquiredAt: new Date(),
    });

    return true;
  }

  /**
   * 释放锁
   */
  release(resource: string, holder: string): boolean {
    const lock = this.locks.get(resource);
    if (lock && lock.holder === holder) {
      this.locks.delete(resource);
      return true;
    }
    return false;
  }

  /**
   * 检查锁
   */
  isLocked(resource: string): boolean {
    return this.locks.has(resource);
  }

  /**
   * 获取统计
   */
  getStats(): { lockCount: number } {
    return { lockCount: this.locks.size };
  }
}

let globalLockManager: LightweightLockManager | null = null;

export function getGlobalLockManager(): LightweightLockManager {
  if (!globalLockManager) {
    globalLockManager = new LightweightLockManager();
  }
  return globalLockManager;
}
