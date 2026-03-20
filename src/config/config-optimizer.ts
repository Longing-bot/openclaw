/**
 * 配置优化器
 * 用于优化OpenClaw的配置加载和管理
 */

export class ConfigOptimizer {
  private static instance: ConfigOptimizer;
  private configCache = new Map<string, any>();
  private watchers = new Map<string, any>();
  private reloadTimers = new Map<string, NodeJS.Timeout>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ConfigOptimizer {
    if (!ConfigOptimizer.instance) {
      ConfigOptimizer.instance = new ConfigOptimizer();
    }
    return ConfigOptimizer.instance;
  }

  /**
   * 优化配置加载
   */
  async optimizeConfigLoad(configPath: string, loader: () => Promise<any>): Promise<any> {
    // 检查缓存
    if (this.configCache.has(configPath)) {
      return this.configCache.get(configPath);
    }

    // 加载配置
    const config = await loader();
    
    // 缓存配置
    this.configCache.set(configPath, config);
    
    return config;
  }

  /**
   * 优化配置重载
   */
  optimizeConfigReload(configPath: string, reloader: () => Promise<any>): void {
    // 清除现有定时器
    const existingTimer = this.reloadTimers.get(configPath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 设置防抖定时器
    const timer = setTimeout(async () => {
      try {
        const config = await reloader();
        this.configCache.set(configPath, config);
      } catch (error) {
        console.error(`Failed to reload config ${configPath}:`, error);
      } finally {
        this.reloadTimers.delete(configPath);
      }
    }, 1000); // 1秒防抖

    this.reloadTimers.set(configPath, timer);
  }

  /**
   * 优化配置监听
   */
  optimizeConfigWatch(configPath: string, watcher: any): void {
    // 检查是否已监听
    if (this.watchers.has(configPath)) {
      return;
    }

    // 添加监听器
    this.watchers.set(configPath, watcher);
  }

  /**
   * 优化配置卸载
   */
  optimizeConfigUnload(configPath: string): void {
    // 清除缓存
    this.configCache.delete(configPath);
    
    // 清除定时器
    const timer = this.reloadTimers.get(configPath);
    if (timer) {
      clearTimeout(timer);
      this.reloadTimers.delete(configPath);
    }
    
    // 清除监听器
    this.watchers.delete(configPath);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    cachedConfigs: number;
    activeWatchers: number;
    pendingReloads: number;
  } {
    return {
      cachedConfigs: this.configCache.size,
      activeWatchers: this.watchers.size,
      pendingReloads: this.reloadTimers.size,
    };
  }

  /**
   * 清除所有缓存
   */
  clearAllCaches(): void {
    // 清除所有定时器
    for (const timer of this.reloadTimers.values()) {
      clearTimeout(timer);
    }

    this.configCache.clear();
    this.reloadTimers.clear();
    this.watchers.clear();
  }
}

// 导出单例
export const configOptimizer = ConfigOptimizer.getInstance();
