/**
 * OpenClaw 网页版 AI 本地执行桥接
 * 
 * 比 OpenLink 更简单的方案：
 * - 不需要 Chrome 扩展
 * - 不需要 Go 服务器
 * - 直接通过 API 桥接
 */

// ==================== 类型定义 ====================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, string>;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

// ==================== 工具定义 ====================

export const WEB_AI_TOOLS: ToolDefinition[] = [
  {
    name: 'exec_cmd',
    description: '执行 Shell 命令',
    parameters: {
      command: 'string (required) - 要执行的命令',
    },
  },
  {
    name: 'read_file',
    description: '读取文件内容',
    parameters: {
      path: 'string (required) - 文件路径',
      offset: 'number (optional) - 起始行号',
      limit: 'number (optional) - 读取行数',
    },
  },
  {
    name: 'write_file',
    description: '写入文件内容',
    parameters: {
      path: 'string (required) - 文件路径',
      content: 'string (required) - 文件内容',
      mode: 'string (optional) - 写入模式: overwrite/append',
    },
  },
  {
    name: 'list_dir',
    description: '列出目录内容',
    parameters: {
      path: 'string (optional) - 目录路径，默认当前目录',
    },
  },
  {
    name: 'grep',
    description: '搜索文件内容',
    parameters: {
      pattern: 'string (required) - 搜索模式',
      path: 'string (optional) - 搜索路径',
      recursive: 'boolean (optional) - 递归搜索',
    },
  },
  {
    name: 'web_fetch',
    description: '获取网页内容',
    parameters: {
      url: 'string (required) - 网页 URL',
      maxChars: 'number (optional) - 最大字符数',
    },
  },
  {
    name: 'edit',
    description: '编辑文件内容',
    parameters: {
      path: 'string (required) - 文件路径',
      oldText: 'string (required) - 要替换的文本',
      newText: 'string (required) - 新文本',
    },
  },
];

// ==================== 工具执行器 ====================

export class WebAIToolExecutor {
  private workspaceRoot: string;

  constructor(workspaceRoot: string = '/root/.openclaw/workspace') {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * 获取工具定义列表
   */
  getToolDefinitions(): ToolDefinition[] {
    return WEB_AI_TOOLS;
  }

  /**
   * 生成工具描述（用于注入到网页 AI 的系统提示词）
   */
  generateToolDescription(): string {
    let description = '# 可用工具\n\n';
    description += '你可以使用以下工具来操作本地文件系统和执行命令：\n\n';

    for (const tool of WEB_AI_TOOLS) {
      description += `## ${tool.name}\n`;
      description += `${tool.description}\n\n`;
      description += '**参数：**\n';
      for (const [param, desc] of Object.entries(tool.parameters)) {
        description += `- \`${param}\`: ${desc}\n`;
      }
      description += '\n';
    }

    description += '## 工具调用格式\n\n';
    description += '使用 XML 格式调用工具：\n\n';
    description += '```xml\n';
    description += '<tool name="工具名">\n';
    description += '  <parameter name="参数名">参数值