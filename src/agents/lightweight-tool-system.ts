/**
 * OpenClaw 轻量级工具调用系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的工具描述
 * 2. 最小化的参数验证
 * 3. 快速的工具发现
 * 4. 低开销的执行
 */

// ==================== 类型定义 ====================

export interface ToolDefinition {
  name: string;
  description: string; // 简短描述，<50字
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
    description: string; // 简短描述，<20字
  }[];
}

export interface ToolCall {
  tool: string;
  params: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ==================== 轻量级工具调用系统 ====================

export class LightweightToolSystem {
  private tools: Map<string, {
    definition: ToolDefinition;
    handler: (params: any) => Promise<any>;
  }> = new Map();

  constructor() {
    this.registerBuiltinTools();
  }

  /**
   * 注册内置工具
   */
  private registerBuiltinTools(): void {
    // 搜索工具
    this.register({
      name: 'search',
      description: '搜索信息',
      parameters: [
        { name: 'query', type: 'string', required: true, description: '搜索关键词' },
      ],
    }, async (params) => {
      return { results: [`搜索结果: ${params.query}`] };
    });

    // 读取文件
    this.register({
      name: 'read',
      description: '读取文件内容',
      parameters: [
        { name: 'path', type: 'string', required: true, description: '文件路径' },
      ],
    }, async (params) => {
      return { content: `文件内容: ${params.path}` };
    });

    // 写入文件
    this.register({
      name: 'write',
      description: '写入文件',
      parameters: [
        { name: 'path', type: 'string', required: true, description: '文件路径' },
        { name: 'content', type: 'string', required: true, description: '文件内容' },
      ],
    }, async (params) => {
      return { success: true, path: params.path };
    });

    // 执行命令
    this.register({
      name: 'exec',
      description: '执行命令',
      parameters: [
        { name: 'cmd', type: 'string', required: true, description: '命令' },
      ],
    }, async (params) => {
      return { output: `命令输出: ${params.cmd}` };
    });

    console.log('[ToolSystem] 初始化完成');
  }

  /**
   * 注册工具
   */
  register(definition: ToolDefinition, handler: (params: any) => Promise<any>): void {
    this.tools.set(definition.name, { definition, handler });
  }

  /**
   * 获取工具列表（精简格式）
   */
  getToolList(): string[] {
    const list: string[] = [];
    for (const [name, tool] of this.tools) {
      const params = tool.definition.parameters
        .map(p => `${p.name}${p.required ? '*' : ''}`)
        .join(', ');
      list.push(`${name}(${params}): ${tool.definition.description}`);
    }
    return list;
  }

  /**
   * 解析工具调用
   */
  parseToolCall(text: string): ToolCall | null {
    // 简单的正则解析：toolName(param1=value1, param2=value2)
    const match = text.match(/(\w+)\(([^)]*)\)/);
    if (!match) return null;

    const toolName = match[1];
    const paramsStr = match[2];

    const params: Record<string, any> = {};
    if (paramsStr) {
      const pairs = paramsStr.split(',');
      for (const pair of pairs) {
        const [key, value] = pair.split('=').map(s => s.trim());
        if (key && value) {
          params[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }

    return { tool: toolName, params };
  }

  /**
   * 执行工具调用
   */
  async execute(call: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(call.tool);
    if (!tool) {
      return { success: false, error: `工具不存在: ${call.tool}` };
    }

    try {
      // 简单参数验证
      for (const param of tool.definition.parameters) {
        if (param.required && !(param.name in call.params)) {
          return { success: false, error: `缺少参数: ${param.name}` };
        }
      }

      const result = await tool.handler(call.params);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 生成提示词（精简版）
   */
  generatePrompt(): string {
    const tools = this.getToolList();
    return `
可用工具:
${tools.map(t => `- ${t}`).join('\n')}

调用格式: toolName(param1=value1, param2=value2)
    `.trim();
  }

  /**
   * 获取统计
   */
  getStats(): { toolCount: number } {
    return { toolCount: this.tools.size };
  }
}

// ==================== 全局实例 ====================

let globalToolSystem: LightweightToolSystem | null = null;

export function getGlobalToolSystem(): LightweightToolSystem {
  if (!globalToolSystem) {
    globalToolSystem = new LightweightToolSystem();
  }
  return globalToolSystem;
}

export function resetGlobalToolSystem(): void {
  globalToolSystem = null;
}
