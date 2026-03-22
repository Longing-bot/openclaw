/**
 * OpenClaw 轻量级中间件系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的中间件管道
 * 2. 快速处理
 * 3. 低计算开销
 */

export type Middleware = (context: any, next: () => Promise<any>) => Promise<any>;

export class LightweightMiddlewareSystem {
  private middlewares: Middleware[] = [];

  constructor() {
    console.log('[MiddlewareSystem] 初始化完成');
  }

  /**
   * 添加中间件
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * 执行中间件管道
   */
  async execute(context: any): Promise<any> {
    let index = 0;

    const next = async (): Promise<any> => {
      if (index >= this.middlewares.length) {
        return context;
      }

      const middleware = this.middlewares[index++];
      return middleware(context, next);
    };

    return next();
  }

  /**
   * 获取中间件数量
   */
  getCount(): number {
    return this.middlewares.length;
  }
}

let globalMiddlewareSystem: LightweightMiddlewareSystem | null = null;

export function getGlobalMiddlewareSystem(): LightweightMiddlewareSystem {
  if (!globalMiddlewareSystem) {
    globalMiddlewareSystem = new LightweightMiddlewareSystem();
  }
  return globalMiddlewareSystem;
}
