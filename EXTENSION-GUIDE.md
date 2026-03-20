# 🧩 OpenClaw 扩展开发指南

## 📋 概述

OpenClaw 支持通过扩展来增强功能。本指南将帮助你开发自己的扩展。

## 🎯 扩展类型

### 1. 渠道扩展
添加新的消息渠道支持。

### 2. 提供商扩展
集成新的AI模型提供商。

### 3. 技能扩展
创建新的技能功能。

### 4. 插件扩展
添加自定义功能。

## 🛠️ 开发环境

### 前置要求
- Node.js 24+
- TypeScript
- pnpm

### 安装依赖
```bash
pnpm install
```

## 📦 扩展结构

### 基础结构
```
my-extension/
├── src/
│   ├── index.ts        # 入口文件
│   ├── types.ts        # 类型定义
│   └── utils.ts        # 工具函数
├── package.json        # 包配置
├── tsconfig.json       # TypeScript配置
└── README.md          # 文档
```

### package.json
```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "description": "My OpenClaw Extension",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest"
  },
  "dependencies": {
    "openclaw": "^2026.3.14"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## 🔌 渠道扩展开发

### 基础渠道
```typescript
import { Channel, Message, Context } from 'openclaw';

export class MyChannel implements Channel {
  name = 'my-channel';
  
  async connect(): Promise<void> {
    // 连接到渠道
  }
  
  async disconnect(): Promise<void> {
    // 断开连接
  }
  
  async send(message: Message): Promise<void> {
    // 发送消息
  }
  
  async receive(): Promise<Message> {
    // 接收消息
    return {
      id: '123',
      content: 'Hello',
      sender: 'user',
      timestamp: new Date(),
    };
  }
}
```

### 配置
```typescript
interface MyChannelConfig {
  apiKey: string;
  webhookUrl: string;
  timeout: number;
}

export class MyChannel implements Channel {
  private config: MyChannelConfig;
  
  constructor(config: MyChannelConfig) {
    this.config = config;
  }
}
```

## 🤖 提供商扩展开发

### 基础提供商
```typescript
import { Provider, Prompt, Response } from 'openclaw';

export class MyProvider implements Provider {
  name = 'my-provider';
  
  async generate(prompt: Prompt): Promise<Response> {
    // 生成响应
    return {
      content: 'Generated response',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    };
  }
  
  async stream(prompt: Prompt): AsyncIterable<string> {
    // 流式生成
    yield 'Hello';
    yield ' ';
    yield 'World';
  }
}
```

## 🎯 技能扩展开发

### 基础技能
```typescript
import { Skill, SkillParams, SkillResult } from 'openclaw';

export class MySkill implements Skill {
  name = 'my-skill';
  description = 'My custom skill';
  
  async execute(params: SkillParams): Promise<SkillResult> {
    // 执行技能
    return {
      success: true,
      data: {
        result: 'Skill executed successfully',
      },
    };
  }
}
```

## 📝 注册扩展

### 自动注册
```typescript
// src/index.ts
import { registerExtension } from 'openclaw';
import { MyChannel } from './channel';
import { MyProvider } from './provider';
import { MySkill } from './skill';

registerExtension({
  channels: [MyChannel],
  providers: [MyProvider],
  skills: [MySkill],
});
```

### 手动注册
```typescript
// 在配置中注册
{
  "extensions": {
    "my-extension": {
      "enabled": true,
      "config": {
        "apiKey": "your-api-key"
      }
    }
  }
}
```

## 🧪 测试

### 单元测试
```typescript
import { describe, it, expect } from 'vitest';
import { MyChannel } from '../src/channel';

describe('MyChannel', () => {
  it('should connect successfully', async () => {
    const channel = new MyChannel({ apiKey: 'test' });
    await expect(channel.connect()).resolves.not.toThrow();
  });
});
```

### 集成测试
```typescript
import { describe, it, expect } from 'vitest';
import { Gateway } from 'openclaw';
import { MyChannel } from '../src/channel';

describe('Gateway Integration', () => {
  it('should send message through channel', async () => {
    const gateway = new Gateway();
    gateway.registerChannel(new MyChannel({ apiKey: 'test' }));
    
    const result = await gateway.send({
      channel: 'my-channel',
      content: 'Hello',
    });
    
    expect(result.success).toBe(true);
  });
});
```

## 📚 最佳实践

### 1. 错误处理
```typescript
try {
  await channel.connect();
} catch (error) {
  console.error('Failed to connect:', error);
  throw new Error(`Connection failed: ${error.message}`);
}
```

### 2. 日志记录
```typescript
import { Logger } from 'openclaw';

const logger = new Logger('MyChannel');

logger.info('Connecting to channel...');
logger.error('Connection failed:', error);
```

### 3. 配置验证
```typescript
function validateConfig(config: MyChannelConfig): void {
  if (!config.apiKey) {
    throw new Error('API key is required');
  }
  if (!config.webhookUrl) {
    throw new Error('Webhook URL is required');
  }
}
```

## 🚀 发布扩展

### 发布到npm
```bash
pnpm build
pnpm publish
```

### 发布到OpenClaw扩展库
```bash
openclaw extension publish
```

## 🔗 参考资源

- [OpenClaw文档](https://docs.openclaw.ai)
- [API参考](https://docs.openclaw.ai/api)
- [示例扩展](https://github.com/openclaw/extensions)

---

🧩 扩展无限，创意无限！
