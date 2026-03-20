/**
 * 入口文件优化器
 * 用于优化OpenClaw的启动性能
 */

export class EntryOptimizer {
  private static instance: EntryOptimizer;
  private startupMetrics: Map<string, number> = new Map();
  private compileCacheEnabled = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): EntryOptimizer {
    if (!EntryOptimizer.instance) {
      EntryOptimizer.instance = new EntryOptimizer();
    }
    return EntryOptimizer.instance;
  }

  /**
   * 优化启动过程
   */
  optimizeStartup(): void {
    // 1. 启用编译缓存
    this.enableCompileCache();
    
    // 2. 优化进程标题
    this.optimizeProcessTitle();
    
    // 3. 安装警告过滤器
    this.installWarningFilter();
    
    // 4. 规范化环境变量
    this.normalizeEnvironment();
  }

  /**
   * 启用编译缓存
   */
  private enableCompileCache(): void {
    if (this.compileCacheEnabled) return;
    
    try {
      const { enableCompileCache } = require('node:module');
      enableCompileCache();
      this.compileCacheEnabled = true;
      this.recordMetric('compileCache', 1);
    } catch (error) {
      // 编译缓存是可选的，失败也不影响
      this.recordMetric('compileCache', 0);
    }
  }

  /**
   * 优化进程标题
   */
  private optimizeProcessTitle(): void {
    process.title = 'openclaw';
    this.recordMetric('processTitle', 1);
  }

  /**
   * 安装警告过滤器
   */
  private installWarningFilter(): void {
    // 过滤掉不必要的警告
    const originalEmitWarning = process.emitWarning;
    process.emitWarning = function (warning, type, code) {
      // 过滤掉实验性警告
      if (type === 'ExperimentalWarning') {
        return;
      }
      return originalEmitWarning.call(process, warning, type, code);
    };
    this.recordMetric('warningFilter', 1);
  }

  /**
   * 规范化环境变量
   */
  private normalizeEnvironment(): void {
    // 设置默认环境变量
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production';
    }
    
    // 优化内存使用
    if (!process.env.NODE_OPTIONS) {
      process.env.NODE_OPTIONS = '--max-old-space-size=512';
    }
    
    this.recordMetric('envNormalization', 1);
  }

  /**
   * 记录指标
   */
  private recordMetric(name: string, value: number): void {
    this.startupMetrics.set(name, value);
  }

  /**
   * 获取启动指标
   */
  getStartupMetrics(): Map<string, number> {
    return new Map(this.startupMetrics);
  }

  /**
   * 获取启动时间
   */
  getStartupTime(): number {
    return performance.now();
  }

  /**
   * 清除指标
   */
  clearMetrics(): void {
    this.startupMetrics.clear();
  }
}

// 导出单例
export const entryOptimizer = EntryOptimizer.getInstance();
