/**
 * OpenClaw 模型插件系统
 * 
 * 扩展模型能力：
 * 1. 插件注册
 * 2. 插件调用
 * 3. 插件管理
 */

export interface Plugin {
  name: string;
  version: string;
  description: string;
  handler: (input: any) => Promise<any>;
}

export class ModelPluginSystem {
  private plugins: Map<string, Plugin> = new Map();

  constructor() {
    console.log('[PluginSystem] 初始化完成');
  }

  /**
   * 注册插件
   */
  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * 调用插件
   */
  async call(name: string, input: any): Promise<any> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`插件不存在: ${name}`);
    }

    return plugin.handler(input);
  }

  /**
   * 获取插件列表
   */
  getPlugins(): Array<{ name: string; version: string; description: string }> {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      version: p.version,
      description: p.description,
    }));
  }

  /**
   * 卸载插件
   */
  uninstall(name: string): void {
    this.plugins.delete(name);
  }
}

let globalPluginSystem: ModelPluginSystem | null = null;

export function getGlobalPluginSystem(): ModelPluginSystem {
  if (!globalPluginSystem) {
    globalPluginSystem = new ModelPluginSystem();
  }
  return globalPluginSystem;
}
