/**
 * OpenClaw Web Agent Bridge
 * 
 * 学习 OpenLink 后内化的原生实现
 * 让网页版 AI 能访问本地文件系统和执行命令
 * 配合零 Token 方案使用
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
  status: 'success' | 'error';
  output?: string;
  error?: string;
  startTime: number;
  endTime: number;
}

// ==================== 安全沙箱 ====================

class SecuritySandbox {
  private rootDir: string;
  private blockedCommands: Set<string>;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.blockedCommands = new Set([
      'rm -rf',
      'sudo',
      'chmod 777',
      'dd if=',
      'mkfs',
      'shutdown',
      'reboot',
    ]);
  }

  /**
   * 验证路径安全
   */
  validatePath(path: string): string | null {
    const resolved = this.resolvePath(path);
    if (!resolved.startsWith(this.rootDir)) {
      return '路径超出工作目录范围';
    }
    return null;
  }

  /**
   * 解析路径
   */
  resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    return `${this.rootDir}/${path}`;
  }

  /**
   * 验证命令安全
   */
  validateCommand(command: string): string | null {
    for (const blocked of this.blockedCommands) {
      if (command.includes(blocked)) {
        return `命令包含被禁止的操作: ${blocked}`;
      }
    }
    return null;
  }
}

// ==================== 工具实现 ====================

class ToolExecutor {
  private sandbox: SecuritySandbox;

  constructor(rootDir: string) {
    this.sandbox = new SecuritySandbox(rootDir);
  }

  /**
   * 执行命令
   */
  async exec_cmd(args: { command: string }): Promise<ToolResult> {
    const startTime = Date.now();
    
    const error = this.sandbox.validateCommand(args.command);
    if (error) {
      return { status: 'error', error, startTime, endTime: Date.now() };
    }

    // 这里需要调用实际的命令执行
    // 在 Node.js 环境中可以使用 child_process
    return {
      status: 'success',
      output: `[模拟执行] ${args.command}`,
      startTime,
      endTime: Date.now(),
    };
  }

  /**
   * 读取文件
   */
  async read_file(args: { path: string; offset?: number; limit?: number }): Promise<ToolResult> {
    const startTime = Date.now();
    
    const error = this.sandbox.validatePath(args.path);
    if (error) {
      return { status: 'error', error, startTime, endTime: Date.now() };
    }

    // 这里需要调用实际的文件读取
    return {
      status: 'success',
      output: `[模拟读取] ${args.path}`,
      startTime,
      endTime: Date.now(),
    };
  }

  /**
   * 写入文件
   */
  async write_file(args: { path: string; content: string; append?: boolean }): Promise<ToolResult> {
    const startTime = Date.now();
    
    const error = this.sandbox.validatePath(args.path);
    if (error) {
      return { status: 'error', error, startTime, endTime: Date.now() };
    }

    // 这里需要调用实际的文件写入
    return {
      status: 'success',
      output: `[模拟写入] ${args.path}`,
      startTime,
      endTime: Date.now(),
    };
  }

  /**
   * 列出目录
   */
  async list_dir(args: { path?: string; query?: string }): Promise<ToolResult> {
    const startTime = Date.now();
    
    const path = args.path || '.';
    const error = this.sandbox.validatePath(path);
    if (error) {
      return { status: 'error', error, startTime, endTime: Date.now() };
    }

    // 这里需要调用实际的目录列表
    return {
      status: 'success',
      output: `[模拟列表] ${path}`,
      startTime,
      endTime: Date.now(),
    };
  }

  /**
   * 搜索文件
   */
  async glob(args: { pattern: string; path?: string }): Promise<ToolResult> {
    const startTime = Date.now();
    
    const path = args.path || '.';
    const error = this.sandbox.validatePath(path);
    if (error) {
      return { status: 'error', error, startTime, endTime: Date.now() };
    }

    // 这里需要调用实际的文件搜索
    return {
      status: 'success',
      output: `[模拟搜索] ${args.pattern} in ${path}`,
      startTime,
      endTime: Date.now(),
    };
  }

  /**
   * 正则搜索
   */
  async grep(args: { pattern: string; path?: string; recursive?: boolean }): Promise<ToolResult> {
    const startTime = Date.now();
    
    const path = args.path || '.';
    const error = this.sandbox.validatePath(path);
    if (error) {
      return { status: 'error', error, startTime, endTime: Date.now() };
    }

    // 这里需要调用实际的正则搜索
    return {
      status: 'success',
      output: `[模拟搜索] ${args.pattern} in ${path}`,
      startTime,
      endTime: Date.now(),
    };
  }

  /**
   * 编辑文件
   */
  async edit(args: { path: string; old_string: string; new_string: string; replace_all?: boolean }): Promise<ToolResult> {
    const startTime = Date.now();
    
    const error = this.sandbox.validatePath(args.path);
    if (error) {
      return { status: 'error', error, startTime, endTime: Date.now() };
    }

    // 这里需要调用实际的文件编辑
    return {
      status: 'success',
      output: `[模拟编辑] ${args.path}`,
      startTime,
      endTime: Date.now(),
    };
  }

  /**
   * 获取网页内容
   */
  async web_fetch(args: { url: string; extract_mode?: string }): Promise<ToolResult> {
    const startTime = Date.now();

    // 这里需要调用实际的网页获取
    return {
      status: 'success',
      output: `[模拟获取] ${args.url}`,
      startTime,
      endTime: Date.now(),
    };
  }
}

// ==================== 工具注册器 ====================

export class WebAgentBridge {
  private executor: ToolExecutor;
  private tools: Map<string, ToolDefinition>;

  constructor(rootDir: string) {
    this.executor = new ToolExecutor(rootDir);
    this.tools = new Map();
    this.registerDefaultTools();
  }

  /**
   * 注册默认工具
   */
  private registerDefaultTools(): void {
    const defaultTools: ToolDefinition[] = [
      {
        name: 'exec_cmd',
        description: '执行 Shell 命令',
        parameters: { command: 'string (required) - 要执行的命令' },
      },
      {
        name: 'read_file',
        description: '读取文件内容',
        parameters: {
          path: 'string (required) - 文件路径',
          offset: 'number (optional) - 起始行',
          limit: 'number (optional) - 读取行数',
        },
      },
      {
        name: 'write_file',
        description: '写入文件内容',
        parameters: {
          path: 'string (required) - 文件路径',
          content: 'string (required) - 文件内容',
          append: 'boolean (optional) - 是否追加',
        },
      },
      {
        name: 'list_dir',
        description: '列出目录内容',
        parameters: {
          path: 'string (optional) - 目录路径',
          query: 'string (optional) - 过滤关键词',
        },
      },
      {
        name: 'glob',
        description: '按文件名模式搜索文件',
        parameters: {
          pattern: 'string (required) - 搜索模式',
          path: 'string (optional) - 搜索目录',
        },
      },
      {
        name: 'grep',
        description: '正则搜索文件内容',
        parameters: {
          pattern: 'string (required) - 正则表达式',
          path: 'string (optional) - 搜索目录',
          recursive: 'boolean (optional) - 是否递归',
        },
      },
      {
        name: 'edit',
        description: '编辑文件内容',
        parameters: {
          path: 'string (required) - 文件路径',
          old_string: 'string (required) - 要替换的文本',
          new_string: 'string (required) - 替换后的文本',
          replace_all: 'boolean (optional) - 是否替换全部',
        },
      },
      {
        name: 'web_fetch',
        description: '获取网页内容',
        parameters: {
          url: 'string (required) - 网页 URL',
          extract_mode: 'string (optional) - 提取模式',
        },
      },
    ];

    for (const tool of defaultTools) {
      this.tools.set(tool.name, tool);
    }
  }

  /**
   * 获取工具定义列表
   */
  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * 生成工具描述（供网页 AI 使用）
   */
  generateToolDescription(): string {
    const tools = this.getToolDefinitions();
    let description = '# 可用工具\n\n';

    for (const tool of tools) {
      description += `## ${tool.name}\n`;
      description += `${tool.description}\n\n`;
      description += '参数:\n';
      for (const [param, desc] of Object.entries(tool.parameters)) {
        description += `- ${param}: ${desc}\n`;
      }
      description += '\n';
    }

    return description;
  }

  /**
   * 执行工具调用
   */
  async executeTool(call: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      return {
        status: 'error',
        error: `未知工具: ${call.name}`,
        startTime: Date.now(),
        endTime: Date.now(),
      };
    }

    // 调用对应的执行方法
    switch (call.name) {
      case 'exec_cmd':
        return this.executor.exec_cmd(call.args);
      case 'read_file':
        return this.executor.read_file(call.args);
      case 'write_file':
        return this.executor.write_file(call.args);
      case 'list_dir':
        return this.executor.list_dir(call.args);
      case 'glob':
        return this.executor.glob(call.args);
      case 'grep':
        return this.executor.grep(call.args);
      case 'edit':
        return this.executor.edit(call.args);
      case 'web_fetch':
        return this.executor.web_fetch(call.args);
      default:
        return {
          status: 'error',
          error: `未实现的工具: ${call.name}`,
          startTime: Date.now(),
          endTime: Date.now(),
        };
    }
  }
}

// ==================== 导出 ====================

export function createWebAgentBridge(rootDir: string): WebAgentBridge {
  return new WebAgentBridge(rootDir);
}
