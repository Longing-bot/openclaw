/**
 * OpenClaw 浏览器桥接方案
 * 
 * 让主人在自己的浏览器中使用网页版 AI
 * 同时能访问本地工具
 */

// ==================== 方案说明 ====================

/**
 * 工作流程：
 * 
 * 1. OpenClaw Gateway 启动一个本地 API 服务（端口 18789）
 * 2. 在浏览器中安装一个简单的油猴脚本（Tampermonkey）
 * 3. 油猴脚本在网页 AI 页面注入 __openclawBridge 对象
 * 4. 网页 AI 可以调用本地工具
 * 
 * 这样主人就能在自己的浏览器中看到 UI，同时使用本地工具
 */

// ==================== 油猴脚本 ====================

export const TAMPERMONKEY_SCRIPT = `
// ==UserScript==
// @name         OpenClaw Bridge
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  让网页版 AI 访问本地工具
// @author       SuperClaw
// @match        https://chat.deepseek.com/*
// @match        https://claude.ai/*
// @match        https://chat.openai.com/*
// @match        https://gemini.google.com/*
// @match        https://tongyi.aliyun.com/*
// @match        https://kimi.moonshot.cn/*
// @match        https://www.doubao.com/*
// @match        https://chatglm.cn/*
// @match        https://grok.com/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      127.0.0.1
// ==/UserScript==

(function() {
    'use strict';
    
    // 防止重复注入
    if (window.__openclawBridge) return;
    
    const GATEWAY_URL = 'http://127.0.0.1:18789';
    
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
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: GATEWAY_URL + '/api/tool/execute',
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify({ name, args }),
                    onload: function(response) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch (e) {
                            resolve({ success: false, error: '解析响应失败' });
                        }
                    },
                    onerror: function(error) {
                        resolve({ success: false, error: String(error) });
                    }
                });
            });
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
    
    // 显示加载提示
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:10px;right:10px;background:#4CAF50;color:white;padding:10px;border-radius:5px;z-index:9999;font-size:14px;';
    div.textContent = '🦞 OpenClaw Bridge 已加载';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
})();
`;

// ==================== 安装说明 ====================

export const INSTALL_INSTRUCTIONS = `
# OpenClaw 浏览器桥接安装指南

## 步骤 1：安装 Tampermonkey

1. 打开 Chrome 浏览器
2. 访问 Chrome 应用商店
3. 搜索 "Tampermonkey"
4. 安装扩展

## 步骤 2：安装油猴脚本

1. 点击 Tampermonkey 图标
2. 选择 "添加新脚本"
3. 将上面的脚本代码粘贴进去
4. 点击保存

## 步骤 3：启动 OpenClaw Gateway

确保 OpenClaw Gateway 正在运行，端口 18789

## 步骤 4：打开网页版 AI

访问以下任一网站：
- https://chat.deepseek.com
- https://claude.ai
- https://chat.openai.com
- https://gemini.google.com
- https://tongyi.aliyun.com
- https://kimi.moonshot.cn
- https://www.doubao.com
- https://chatglm.cn
- https://grok.com

## 步骤 5：使用工具

在网页 AI 的对话框中，使用 JavaScript 调用工具：

\`\`\`javascript
// 执行命令
await window.__openclawBridge.exec("ls -la");

// 读取文件
await window.__openclawBridge.readFile("/path/to/file");

// 写入文件
await window.__openclawBridge.writeFile("/path/to/file", "content");
\`\`\`

## 注意事项

- 确保 OpenClaw Gateway 正在运行
- 油猴脚本只在匹配的网站上生效
- 首次使用时可能需要允许跨域请求
`;

// ==================== 导出 ====================

export function getTampermonkeyScript(): string {
  return TAMPERMONKEY_SCRIPT;
}

export function getInstallInstructions(): string {
  return INSTALL_INSTRUCTIONS;
}
