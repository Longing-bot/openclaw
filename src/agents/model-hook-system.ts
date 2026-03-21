/**
 * OpenClaw 模型钩子系统
 * 
 * 扩展模型行为：
 * 1. 前置钩子
 * 2. 后置钩子
 * 3. 错误钩子
 */

export type HookType = 'before' | 'after' | 'error';

export interface Hook {
  name: string;
  type: HookType;
  handler: (context: any) => Promise<any>;
}

export class ModelHookSystem {
  private hooks: Map<HookType, Hook[]> = new Map();

  constructor() {
    this.hooks.set('before', []);
    this.hooks.set('after', []);
    this.hooks.set('error', []);
    console.log('[HookSystem] 初始化完成');
  }

  /**
   * 注册钩子
   */
  register(hook: Hook): void {
    const hooks = this.hooks.get(hook.type);
    if (hooks) {
      hooks.push(hook);
    }
  }

  /**
   * 执行钩子
   */
  async execute(type: HookType, context: any): Promise<any> {
    const hooks = this.hooks.get(type) || [];

    for (const hook of hooks) {
      try {
        context = await hook.handler(context);
      } catch (error) {
        console.error(`[HookSystem] 钩子执行失败: ${hook.name}`, error);
      }
    }

    return context;
  }

  /**
   * 获取钩子列表
   */
  getHooks(type?: HookType): Hook[] {
    if (type) {
      return this.hooks.get(type) || [];
    }

    const all: Hook[] = [];
    for (const hooks of this.hooks.values()) {
      all.push(...hooks);
    }
    return all;
  }
}

let globalHookSystem: ModelHookSystem | null = null;

export function getGlobalHookSystem(): ModelHookSystem {
  if (!globalHookSystem) {
    globalHookSystem = new ModelHookSystem();
  }
  return globalHookSystem;
}
