/**
 * OpenClaw 模型路由系统
 * 
 * 智能路由请求到最合适的模型：
 * 1. 根据任务类型路由
 * 2. 根据性能要求路由
 * 3. 根据成本限制路由
 * 4. 根据可用性路由
 */

export interface RouteRule {
  pattern: RegExp | string;
  model: string;
  priority: number;
  conditions?: {
    maxTokens?: number;
    maxCost?: number;
    maxLatency?: number;
    requiredCapabilities?: string[];
  };
}

export class ModelRouter {
  private routes: RouteRule[] = [];
  private defaultModel: string = 'gpt-4.1-mini';

  constructor() {
    this.initializeDefaultRoutes();
  }

  /**
   * 初始化默认路由
   */
  private initializeDefaultRoutes(): void {
    // 代码相关任务
    this.addRoute({
      pattern: /代码|code|编程|程序|函数/i,
      model: 'deepseek-coder',
      priority: 10,
    });

    // 推理任务
    this.addRoute({
      pattern: /推理|reason|分析|逻辑|证明/i,
      model: 'o3-mini',
      priority: 10,
    });

    // 创意任务
    this.addRoute({
      pattern: /创意|creative|写作|故事|诗歌/i,
      model: 'claude-opus-4',
      priority: 10,
    });

    // 简单问答
    this.addRoute({
      pattern: /什么|怎么|为什么|如何|？/i,
      model: 'gpt-4.1-mini',
      priority: 5,
    });

    // 总结任务
    this.addRoute({
      pattern: /总结|summary|概括|提炼/i,
      model: 'gpt-4.1-nano',
      priority: 5,
    });

    // 翻译任务
    this.addRoute({
      pattern: /翻译|translate|英文|中文/i,
      model: 'gpt-4.1-mini',
      priority: 5,
    });

    console.log('[ModelRouter] 初始化完成');
  }

  /**
   * 添加路由
   */
  addRoute(route: RouteRule): void {
    this.routes.push(route);
    this.routes.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 路由请求
   */
  route(input: string, context?: any): string {
    for (const route of this.routes) {
      if (this.matchesPattern(input, route.pattern)) {
        // 检查条件
        if (this.checkConditions(route.conditions, context)) {
          return route.model;
        }
      }
    }

    return this.defaultModel;
  }

  /**
   * 检查模式匹配
   */
  private matchesPattern(input: string, pattern: RegExp | string): boolean {
    if (typeof pattern === 'string') {
      return input.includes(pattern);
    }
    return pattern.test(input);
  }

  /**
   * 检查条件
   */
  private checkConditions(conditions: RouteRule['conditions'], context: any): boolean {
    if (!conditions) return true;

    // 检查 token 限制
    if (conditions.maxTokens && context?.tokens > conditions.maxTokens) {
      return false;
    }

    // 检查成本限制
    if (conditions.maxCost && context?.cost > conditions.maxCost) {
      return false;
    }

    return true;
  }

  /**
   * 设置默认模型
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
  }

  /**
   * 获取路由列表
   */
  getRoutes(): Array<{ pattern: string; model: string; priority: number }> {
    return this.routes.map(r => ({
      pattern: r.pattern.toString(),
      model: r.model,
      priority: r.priority,
    }));
  }

  /**
   * 获取统计
   */
  getStats(): { routeCount: number; defaultModel: string } {
    return {
      routeCount: this.routes.length,
      defaultModel: this.defaultModel,
    };
  }
}

let globalModelRouter: ModelRouter | null = null;

export function getGlobalModelRouter(): ModelRouter {
  if (!globalModelRouter) {
    globalModelRouter = new ModelRouter();
  }
  return globalModelRouter;
}
