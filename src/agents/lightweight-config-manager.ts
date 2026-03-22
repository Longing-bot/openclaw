/**
 * OpenClaw 轻量级配置管理器
 * 
 * 专为小参数模型优化：
 * 1. 简化的配置管理
 * 2. 快速配置读取
 * 3. 低计算开销
 */

export class LightweightConfigManager {
  private config: Map<string, any> = new Map();

  constructor() {
    console.log('[ConfigManager] 初始化完成');
  }

  /**
   * 设置配置
   */
  set(key: string, value: any): void {
    this.config.set(key, value);
  }

  /**
   * 获取配置
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.config.get(key) ?? defaultValue;
  }

  /**
   * 检查配置
   */
  has(key: string): boolean {
    return this.config.has(key);
  }

  /**
   * 删除配置
   */
  delete(key: string): void {
    this.config.delete(key);
  }

  /**
   * 获取所有配置
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.config) {
      result[key] = value;
    }
    return result;
  }

  /**
   * 合并配置
   */
  merge(config: Record<string, any>): void {
    for (const [key, value] of Object.entries(config)) {
      this.config.set(key, value);
    }
  }
}

let globalConfigManager: LightweightConfigManager | null = null;

export function getGlobalConfigManager(): LightweightConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = new LightweightConfigManager();
  }
  return globalConfigManager;
}
