/**
 * SuperClaw 核心模块导出
 * 
 * 统一导出所有优化模块
 */

// ==================== 上下文引擎 ====================
export {
  ContextCache,
  MessageCompressor,
  SmartRetriever,
  ContextAssemblerOptimizer,
  CrossSessionContextManager,
  getGlobalContextOptimizer,
  type ContextCacheEntry,
  type ContextMetrics,
  type SmartRetrievalOptions,
} from './context-engine/context-optimizer.js';

// ==================== 多智能体系统 ====================
export {
  HiClaw,
  createHiClaw,
  type WorkerAgent,
  type ManagerConfig,
  type TaskAssignment,
} from './multi-agent/hiclaw.js';

export {
  createCodeReviewSwarm,
  createContentCreationSwarm,
  type SwarmAgent,
  type SwarmTask,
  type SwarmResult,
} from './multi-agent/swarm.js';

export {
  NovaSystem,
  createNovaSystem,
  NovaRouter,
  NovaCompiler,
  EXECUTORS,
  type Executor,
  type NovaAgent,
  type Task,
  type RouterConfig,
} from './multi-agent/nova.js';

// ==================== 自我驱动系统 ====================
export {
  SelfDrivenEngine,
  getGlobalSelfDrivenEngine,
  type SelfDrivenConfig,
  type Reflection,
  type Goal,
} from './self-awareness/self-driven.js';

// ==================== 浏览器代理 ====================
export {
  PageAgent,
  createPageAgent,
  type PageAction,
  type PageAgentConfig,
  type ActionResult,
} from './browser/page-agent.js';

// ==================== 零 Token 认证 ====================
export {
  ZeroTokenProvider,
  createZeroTokenProvider,
  PROVIDER_CONFIGS,
  type WebCredentials,
  type ProviderConfig,
} from './providers/zero-token.js';

export {
  ZeroTokenProvider as ZeroTokenImpl,
  createZeroTokenProvider as createZeroTokenImpl,
  type ZeroTokenCredentials,
  type ChatMessage,
  type StreamChunk,
} from './providers/zero-token-impl.js';

// ==================== 浏览器桥接 ====================
export {
  BrowserBridge,
  createBrowserBridge,
  generateInjectedScript,
  generateSystemPromptForWebAI,
} from './providers/browser-bridge.js';

export {
  TAMPERMONKEY_SCRIPT,
  INSTALL_INSTRUCTIONS,
  getTampermonkeyScript,
  getInstallInstructions,
} from './providers/tampermonkey-bridge.js';

export {
  WebAIToolExecutor,
  BrowserSDK,
  createLocalAPIService,
  type ToolDefinition,
  type ToolCall,
  type ToolResult,
} from './providers/web-ai-bridge.js';

// ==================== 中文支持 ====================
export {
  COMMANDS_I18N,
  COMMAND_GROUP_LABELS,
  getZhAliasToKeyMap,
  getCommandI18n,
  matchZhCommandAlias,
  generateZhHelpMenu,
  CHANNELS_ZH,
  getChannelZhConfig,
  type CommandI18n,
  type CommandGroup,
  type ChannelZhConfig,
} from './i18n/zh-support.js';

// ==================== 实用工具 ====================
export {
  TodoManager,
  SimpleMemory,
  ProgressTracker,
  getTodoManager,
  getMemory,
  getProgressTracker,
  type Todo,
  type MemoryEntry,
  type ProgressStep,
} from './utils/longing-tools.js';

// ==================== 增强记忆系统 ====================
export {
  EnhancedMemory,
  createEnhancedMemory,
  type MemoryItem,
  type MemoryQuery,
} from './memory/enhanced-memory.js';

// ==================== 多模态处理器 ====================
export {
  MultiModalProcessor,
  createMultiModalProcessor,
  type MediaFile,
  type MediaAnalysis,
} from './multimodal/processor.js';

// ==================== 技能管理器 ====================
export {
  SkillManager,
  createSkillManager,
  BUILTIN_SKILLS,
  type Skill,
  type SkillManifest,
} from './skills/manager.js';

// ==================== 配置管理器 ====================
export {
  ConfigManager,
  createConfigManager,
  DEFAULT_CONFIG,
  type SuperClawConfig,
} from './config/manager.js';
