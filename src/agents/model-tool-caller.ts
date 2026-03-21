/**
 * OpenClaw 模型工具调用器
 * 
 * 管理工具调用：
 * 1. 工具注册
 * 2. 工具调用
 * 3. 结果处理
 */

export interface Tool {
  name: string;
  description: string;
  parameters: any;
  handler: (params: any) => Promise<any>;
}

export class ModelToolCaller {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    console.log('[ToolCaller] 初始化完成');
  }

  /**
   * 注册工具
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * 调用工具
   */
  async call(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`工具不存在: ${name}`);
    }

    return tool.handler(params);
  }

  /**
   * 获取工具列表
   */
  getTools(): Array<{ name: string; description: string }> {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
    }));
  }

  /**
   * 获取工具定义
   */
  getToolDefinitions(): any[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }
}

let globalToolCaller: ModelToolCaller | null = null;

export function getGlobalToolCaller(): ModelToolCaller {
  if (!globalToolCaller) {
    globalToolCaller = new ModelToolCaller();
  }
  return globalToolCaller;
}
