/**
 * OpenClaw 轻量级事件系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的事件处理
 * 2. 快速事件分发
 * 3. 低计算开销
 */

export interface Event {
  type: string;
  data: any;
  timestamp: Date;
}

export type EventHandler = (event: Event) => void;

export class LightweightEventSystem {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventHistory: Event[] = [];
  private maxHistory: number = 100;

  constructor() {
    console.log('[EventSystem] 初始化完成');
  }

  /**
   * 订阅事件
   */
  on(type: string, handler: EventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  /**
   * 取消订阅
   */
  off(type: string, handler: EventHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 发布事件
   */
  emit(type: string, data: any): void {
    const event: Event = {
      type,
      data,
      timestamp: new Date(),
    };

    // 添加到历史
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // 调用处理器
    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`[EventSystem] 事件处理失败: ${type}`, error);
        }
      }
    }
  }

  /**
   * 获取事件历史
   */
  getHistory(count: number = 10): Event[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * 获取统计
   */
  getStats(): { eventTypes: number; handlerCount: number; historyCount: number } {
    let handlerCount = 0;
    for (const handlers of this.handlers.values()) {
      handlerCount += handlers.length;
    }
    return {
      eventTypes: this.handlers.size,
      handlerCount,
      historyCount: this.eventHistory.length,
    };
  }
}

let globalEventSystem: LightweightEventSystem | null = null;

export function getGlobalEventSystem(): LightweightEventSystem {
  if (!globalEventSystem) {
    globalEventSystem = new LightweightEventSystem();
  }
  return globalEventSystem;
}
