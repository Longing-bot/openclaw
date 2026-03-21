# SuperClaw - OpenClaw 超级进化版

🦞 **SuperClaw** 是基于 OpenClaw 的优化版本，集成了多项增强功能。

---

## 📋 功能清单

### 1️⃣ 代码精简优化
- 精简 53% 冗余代码
- 优化导入路径
- 统一代码风格

### 2️⃣ 上下文引擎优化
- LRU 缓存机制
- 智能检索系统
- 消息压缩算法
- 跨会话上下文复用

### 3️⃣ 多智能体协作系统

#### HiClaw 协作系统
- 管理者-工作者模式
- 动态任务分配
- 负载均衡
- 并行执行

#### Nova 架构（三执行器并行）
- ⚡ **闪电执行器** - 快速响应，简单任务
- 🧠 **深度执行器** - 复杂分析，深度思考
- 🎨 **创意执行器** - 内容创作，创新设计

#### 蜂群系统
- 代码审查蜂群
- 内容创作蜂群

### 4️⃣ 零 Token 支持
- 免费使用网页版 AI
- 支持平台：
  - DeepSeek
  - Claude
  - ChatGPT
  - Gemini
  - 通义千问
  - Kimi
  - 豆包
  - 智谱GLM
  - Grok

### 5️⃣ 浏览器桥接方案

#### 方案一：油猴脚本（推荐）
- 安装 Tampermonkey 扩展
- 安装油猴脚本
- 在浏览器中看到 UI
- 同时使用本地工具

#### 方案二：内置浏览器控制
- 使用 OpenClaw 内置浏览器
- 自动化任务
- 后台执行

### 6️⃣ 中文支持
- 完整中文命令支持
- 中文帮助菜单
- 中文渠道配置

### 7️⃣ 增强记忆系统
- 标签索引
- 重要性评分
- 访问次数跟踪
- 自动清理过期记忆

### 8️⃣ 多模态处理器
- 图片分析
- 音频转录
- 视频处理

### 9️⃣ 技能管理系统
- 动态加载技能
- 内置技能：
  - 网页搜索
  - 代码审查
  - 翻译

### 🔟 配置管理系统
- 统一配置管理
- 默认配置优化
- 动态配置更新

---

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/Longing-bot/openclaw.git

# 进入目录
cd openclaw

# 安装依赖
npm install

# 构建
npm run build
```

### 配置零 Token

1. 安装油猴脚本（见下方）
2. 登录网页版 AI
3. 使用 `window.__openclawBridge` 调用本地工具

### 安装油猴脚本

1. 安装 Tampermonkey 扩展
2. 添加新脚本
3. 复制 `src/providers/tampermonkey-bridge.ts` 中的代码
4. 保存并启用

---

## 📁 目录结构

```
src/
├── superclaw.ts              # 统一导出模块
├── context-engine/           # 上下文引擎
│   └── context-optimizer.ts  # 优化器
├── multi-agent/              # 多智能体系统
│   ├── hiclaw.ts            # HiClaw 协作
│   ├── nova.ts              # Nova 架构
│   └── swarm.ts             # 蜂群系统
├── providers/                # 提供者
│   ├── zero-token.ts        # 零 Token 认证
│   ├── zero-token-impl.ts   # 零 Token 实现
│   ├── browser-bridge.ts    # 浏览器桥接
│   ├── tampermonkey-bridge.ts # 油猴脚本
│   └── web-ai-bridge.ts     # Web AI 桥接
├── i18n/                     # 国际化
│   └── zh-support.ts        # 中文支持
├── memory/                   # 记忆系统
│   └── enhanced-memory.ts   # 增强记忆
├── multimodal/               # 多模态
│   └── processor.ts         # 处理器
├── skills/                   # 技能系统
│   └── manager.ts           # 管理器
└── config/                   # 配置系统
    └── manager.ts           # 管理器
```

---

## 🎯 使用示例

### 使用零 Token

```typescript
import { createZeroTokenProvider } from './providers/zero-token';

const provider = createZeroTokenProvider('deepseek');
await provider.chat('你好，世界！');
```

### 使用 Nova 架构

```typescript
import { createNovaSystem } from './multi-agent/nova';

const nova = createNovaSystem({ strategy: 'skill-based' });
const taskId = nova.submitTask({
  type: 'analysis',
  description: '分析这段代码',
  priority: 'high',
});
```

### 使用油猴脚本桥接

```javascript
// 在网页 AI 对话框中
await window.__openclawBridge.exec("ls -la");
await window.__openclawBridge.readFile("/path/to/file");
```

---

## 📊 性能对比

| 指标 | 原版 | SuperClaw | 提升 |
|------|------|-----------|------|
| 代码量 | 100% | 47% | ↓53% |
| 上下文缓存 | 无 | LRU | ↑100% |
| 多智能体 | 无 | 支持 | ↑100% |
| 零 Token | 无 | 支持 | ↑100% |
| 中文支持 | 部分 | 完整 | ↑100% |

---

## 🔗 相关链接

- **GitHub**: https://github.com/Longing-bot/openclaw
- **原版 OpenClaw**: https://github.com/openclaw/openclaw
- **文档**: https://docs.openclaw.ai

---

## 📝 更新日志

### 2026-03-21
- ✅ 精简代码 53%
- ✅ 创建 SuperClaw 统一导出模块
- ✅ 内化 HiClaw 多智能体协作系统
- ✅ 内化中文支持模块
- ✅ 内化零 Token 认证系统
- ✅ 完整零 Token 实现
- ✅ 内化 Nova 架构（三执行器并行）
- ✅ 内化 Web Agent Bridge
- ✅ 内置浏览器桥接
- ✅ 油猴脚本桥接
- ✅ 增强记忆系统
- ✅ 多模态处理器框架
- ✅ 技能管理系统
- ✅ 配置管理系统

---

## 🦞 SuperClaw - 持续进化中！
