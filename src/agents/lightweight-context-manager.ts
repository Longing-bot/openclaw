/**
 * OpenClaw 轻量级上下文管理器
 * 
 * 专为小参数模型优化：
 * 1. 简化的上下文压缩
 * 2. 快速上下文切换
 * 3. 低计算开销
 */

export interface Context {
  id: string;
  data: any;
  size: number;
  priority: number;
  createdAt: Date;
}

export class LightweightContextManager {
  private contexts: Map<string, Context> = new Map();
  private maxSize: number = 10000; // 最大 token 数
  private currentSize: number = 0;

  constructor() {
    console.log('[ContextManager] 初始化完成');
  }

  /**
   * 添加上下文
   */
  add(data: any, priority: number = 1): string {
    const id = `ctx_${Date.now()}`;
    const size = this.estimateSize(data);

    // 检查空间
    if (this.currentSize + size > this.maxSize) {
      this.evictLowPriority(size);
    }

    const context: Context = {
      id,
      data,
      size,
      priority,
      createdAt: new Date(),
    };

    this.contexts.set(id, context);
    this.currentSize += size;

    return id;
  }

  /**
   * 获取上下文
   */
  get(id: string): any | null {
    const context = this.contexts.get(id);
    return context ? context.data : null;
  }

  /**
   * 删除上下文
   */
  delete(id: string): void {
    const context = this.contexts.get(id);
    if (context) {
      this.currentSize -= context.size;
      this.contexts.delete(id);
    }
  }

  /**
   * 压缩上下文
   */
  compress(): void {
    const contexts = Array.from(this.contexts.values());
    contexts.sort((a, b) => a.priority - b.priority);

    let size = 0;
    for (const context of contexts) {
      if (size + context.size > this.maxSize * 0.8) {
        this.delete(context.id);
      } else {
        size += context.size;
      }
    }
  }

  /**
   * 淘汰低优先级
   */
  private evictLowPriority(requiredSize: number): void {
    const contexts = Array.from(this.contexts.values());
    contexts.sort((a, b) => a.priority - b.priority);

    let freed = 0;
    for (const context of contexts) {
      if (freed >= requiredSize) break;
      freed += context.size;
      this.delete(context.id);
    }
  }

  /**
   * 估算大小
   */
  private estimateSize(data: any): number {
    // 简化估算
    const str = JSON.stringify(data);
    return Math.ceil(str.length / 4); // 假设 4 字符 = 1 token
  }

  /**
   * 获取统计
   */
  getStats(): { contextCount: number; currentSize: number; maxSize: number } {
    return {
      contextCount: this.contexts.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
    };
  }
}

let globalContextManager: LightweightContextManager | null = null;

export function getGlobalContextManager(): LightweightContextManager {
  if (!globalContextManager) {
    globalContextManager = new LightweightContextManager();
  }
  return globalContextManager;
}
