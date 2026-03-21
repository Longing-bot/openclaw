/**
 * OpenClaw 内置浏览器桥接
 * 
 * 利用 OpenClaw 自带的 browser 工具控制浏览器
 * 在网页 AI 中注入本地执行能力
 * 
 * 不需要 Chrome 扩展，不需要 Go 服务器
 */

// ==================== 类型定义 ====================

export interface InjectedTool {
  name: string;
  description: string;
  parameters: Record<string, string>;
}

export interface ToolExecutionRequest {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ToolExecutionResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

// ==================== 注入到网页的 JavaScript 代码 ====================

/**
 * 注入到网页的 SDK 代码
 * 让网页 AI 可以调用本地工具
 */
export function generateInjectedScript(port: number = 18789): string {
  return `
(function() {
  // 防止重复注入
  if (window.__openclawBridge) return;
  
  const GATEWAY_URL = 'http://127.0.0.1:${port}';
  
  // 工具定义
  const TOOLS = {
    exec_cmd: {
      name: 'exec_cmd',
      description: '执行 Shell 命令',
      parameters: { command: 'string (required)' }
    },
    read_file: {
      name: 'read_file',
      description: '读取文件内容',
      parameters: { path: 'string (required)', offset: 'number (optional)', limit: 'number (optional)' }
    },
    write_file: {
      name: 'write_file',
      description: '写入文件内容',
      parameters: { path: 'string (required)', content: 'string (required)' }
    },
    list_dir: {
      name: 'list_dir',
      description: '列出目录内容',
      parameters: { path: 'string (optional)' }
    },
    grep: {
      name: 'grep',
      description: '搜索文件内容',
      parameters: { pattern: 'string (required)', path: 'string (optional)' }
    },
    web_fetch: {
      name: 'web_fetch',
      description: '获取网页内容',
      parameters: { url: 'string (required)', maxChars: 'number (optional)' }
    }
  };

  // 桥接对象
  window.__openclawBridge = {
    tools: TOOLS,
    
    // 调用工具
    async callTool(name, args) {
      try {
        const response = await fetch(GATEWAY_URL + '/api/tool/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, args })
        });
        return await response.json();
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
    
    // 快捷方法
    async exec(command) {
      return this.callTool('exec_cmd', { command });
    },
    
    async readFile(path) {
      return this.callTool('read_file', { path });
    },
    
    async writeFile(path, content) {
      return this.callTool('write_file', { path, content });
    },
    
    async listDir(path = '.') {
      return this.callTool('list_dir', { path });
    },
    
    async grep(pattern, path = '.') {
      return this.callTool('grep', { pattern, path });
    },
    
    async fetchUrl(url) {
      return this.callTool('web_fetch', { url });
    },
    
    // 获取工具描述（用于注入到 AI 的系统提示词）
    getToolPrompt() {
      let prompt = '# 可用工具\\n\\n';
      prompt += '你可以使用以下工具来操作本地文件系统：\\n\\n';
      
      for (const [name, tool] of Object.entries(TOOLS)) {
        prompt += '## ' + name + '\\n';
        prompt += tool.description + '\\n\\n';
        prompt += '参数：\\n';
        for (const [param, desc] of Object.entries(tool.parameters)) {
          prompt += '- ' + param + ': ' + desc + '\\n';
        }
        prompt += '\\n';
      }
      
      prompt += '## 调用格式\\n\\n';
      prompt += '使用 JavaScript 调用：\\n\\n';
      prompt += '\`\`\`javascript\\n';
      prompt += '// 执行命令\\n';
      prompt += 'await window.__openclawBridge.exec("ls -la");\\n\\n';
      prompt += '// 读取文件\\n';
      prompt += 'await window.__openclawBridge.readFile("/path/to/file");\\n\\n';
      prompt += '// 写入文件\\n';
      prompt += 'await window.__openclawBridge.writeFile("/path/to/file", "content");\\n';
      prompt += '\`\`\`\\n';
      
      return prompt;
    }
  };
  
  console.log('🦞 OpenClaw Bridge 已加载');
  console.log('可用工具:', Object.keys(TOOLS).join(', '));
})();
`;
}

// ==================== 网页 AI 提示词生成器 ====================

/**
 * 生成注入到网页 AI 的系统提示词
 */
export function generateSystemPromptForWebAI(): string {
  return `
你是一个拥有本地执行能力的 AI 助手。

## 可用工具

你可以通过 JavaScript 调用以下工具：

### exec_cmd
执行 Shell 命令
\`\`\`javascript
const result = await window.__openclawBridge.exec("ls -la");
\`\`\`

### read_file
读取文件内容
\`\`\`javascript
const result = await window.__openclawBridge.readFile("/path/to/file");
\`\`\`

### write_file
写入文件内容
\`\`\`javascript
const result = await window.__openclawBridge.writeFile("/path/to/file", "content");
\`\`\`

### list_dir
列出目录内容
\`\`\`javascript
const result = await window.__openclawBridge.listDir(".");
\`\`\`

### grep
搜索文件内容
\`\`\`javascript
const result = await window.__openclawBridge.grep("pattern", "/path");
\`\`\`

### web_fetch
获取网页内容
\`\`\`javascript
const result = await window.__openclawBridge.fetchUrl("https://example.com");
\`\`\`

## 使用说明

1. 所有工具调用都是异步的，需要使用 await
2. 返回结果是一个对象，包含 success 字段
3. 成功时 result 字段包含实际结果
4. 失败时 error 字段包含错误信息

## 安全限制

- 不能执行危险命令（如 rm -rf /）
- 文件操作限制在工作目录内
- 命令执行有超时限制
`;
}

// ==================== 浏览器自动化类 ====================

/**
 * 使用 OpenClaw 内置浏览器的桥接器
 */
export class BrowserBridge {
  private gatewayPort: number;
  private injected: boolean = false;

  constructor(gatewayPort: number = 18789) {
    this.gatewayPort = gatewayPort;
  }

  /**
   * 获取注入脚本
   */
  getInjectScript(): string {
    return generateInjectedScript(this.gatewayPort);
  }

  /**
   * 获取系统提示词
   */
  getSystemPrompt(): string {
    return generateSystemPromptForWebAI();
  }

  /**
   * 检查是否已注入
   */
  isInjected(): boolean {
    return this.injected;
  }

  /**
   * 标记已注入
   */
  markInjected(): void {
    this.injected = true;
  }
}

// ==================== 导出 ====================

export function createBrowserBridge(gatewayPort?: number): BrowserBridge {
  return new BrowserBridge(gatewayPort);
}
