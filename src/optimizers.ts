/**
 * OpenClaw 优化器索引
 * 导出所有优化器
 */

// 入口优化器
export { EntryOptimizer, entryOptimizer } from './utils/entry-optimizer.js';

// 网关优化器
export { GatewayOptimizer, gatewayOptimizer } from './gateway/gateway-optimizer.js';

// 会话优化器
export { SessionOptimizer, sessionOptimizer } from './sessions/session-optimizer.js';

// AI提供商优化器
export { ProviderOptimizer, providerOptimizer } from './providers/provider-optimizer.js';

// 工具优化器
export {
  PerformanceOptimizer,
  performanceOptimizer,
  MemoryOptimizer,
  memoryOptimizer,
  CacheOptimizer,
  responseCache,
  modelCache,
  sessionCache,
  ConnectionPool,
  OptimizerFactory,
  OptimizationManager,
  optimizationManager,
} from './utils/optimizers.js';

/**
 * 全局优化管理器
 */
export class GlobalOptimizer {
  private static instance: GlobalOptimizer;
  private entryOptimizer = entryOptimizer;
  private gatewayOptimizer = gatewayOptimizer;
  private sessionOptimizer = sessionOptimizer;
  private providerOptimizer = providerOptimizer;
  private optimizationManager = optimizationManager;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): GlobalOptimizer {
    if (!GlobalOptimizer.instance) {
      GlobalOptimizer.instance = new GlobalOptimizer();
    }
    return GlobalOptimizer.instance;
  }

  /**
   * 初始化所有优化器
   */
  initialize(): void {
    // 优化启动
    this.entryOptimizer.optimizeStartup();
    
    // 清理缓存
    this.clearAllCaches();
  }

  /**
   * 获取所有统计信息
   */
  getAllStats(): {
    entry: Map<string, number>;
    gateway: any;
    session: any;
    provider: any;
    optimization: any;
  } {
    return {
      entry: this.entryOptimizer.getStartupMetrics(),
      gateway: this.gatewayOptimizer.getStats(),
      session: this.sessionOptimizer.getSessionStats(),
      provider: this.providerOptimizer.getStats(),
      optimization: this.optimizationManager.getAllStats(),
    };
  }

  /**
   * 清除所有缓存
   */
  clearAllCaches(): void {
    this.gatewayOptimizer.clearAll();
    this.sessionOptimizer.clearAllCaches();
    this.providerOptimizer.clearAll();
    this.optimizationManager.clearAllCaches();
  }

  /**
   * 优化内存使用
   */
  optimizeMemory(): void {
    // 清理过期缓存
    this.optimizationManager.cleanupExpiredCaches();
    
    // 强制垃圾回收（仅用于调试）
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): NodeJS.MemoryUsage {
    return this.optimizationManager.getMemoryOptimizer().getMemoryUsage();
  }
}

// 导出单例
export const globalOptimizer = GlobalOptimizer.getInstance();

// 渠道优化器
export { ChannelOptimizer, channelOptimizer } from './channels/channel-optimizer.js';

// 技能优化器
export { SkillOptimizer, skillOptimizer } from './skills/skill-optimizer.js';

// 配置优化器
export { ConfigOptimizer, configOptimizer } from './config/config-optimizer.js';

// 日志优化器
export { LogOptimizer, logOptimizer } from './logging/log-optimizer.js';

// 路由优化器
export { RouteOptimizer, routeOptimizer } from './routing/route-optimizer.js';

// 安全优化器
export { SecurityOptimizer, securityOptimizer } from './security/security-optimizer.js';

// 消息优化器
export { MessageOptimizer, messageOptimizer } from './messaging/message-optimizer.js';

// 存储优化器
export { StorageOptimizer, storageOptimizer } from './storage/storage-optimizer.js';

// 异步优化器
export { AsyncOptimizer, asyncOptimizer } from './utils/async-optimizer.js';

// 并发优化器
export { ConcurrencyOptimizer, concurrencyOptimizer } from './utils/concurrency-optimizer.js';

// 上下文引擎优化器
export {
  ContextCache,
  MessageCompressor,
  SmartRetriever,
  ContextAssemblerOptimizer,
  CrossSessionContextManager,
  getGlobalContextOptimizer,
  getGlobalCrossSessionManager,
  resetGlobalContextOptimizer,
} from './context-engine/context-optimizer.js';

// 多智能体协作（ClawTeam集成）
export {
  ClawTeamIntegrator,
  SmartCodeReviewer,
  getGlobalClawTeamIntegrator,
  getGlobalCodeReviewer,
  resetGlobalClawTeam,
} from './multi-agent/clawteam-integration.js';
