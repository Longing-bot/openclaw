/**
 * SuperClaw 配置管理系统
 * 
 * 统一管理所有配置
 */

// ==================== 类型定义 ====================

export interface SuperClawConfig {
  // 基础配置
  name: string;
  version: string;
  language: 'zh-CN' | 'en-US';
  
  // 上下文配置
  context: {
    cacheSize: number;
    cacheTtl: number;
    maxTokens: number;
  };
  
  // 记忆配置
  memory: {
    maxItems: number;
    cleanupInterval: number;
  };
  
  // 技能配置
  skills: {
    enabled: string[];
    disabled: string[];
  };
  
  // 零 Token 配置
  zeroToken: {
    enabled: boolean;
    providers: string[];
  };
  
  // 多智能体配置
  multiAgent: {
    enabled: boolean;
    maxWorkers: number;
  };
}

// ==================== 默认配置 ====================

export const DEFAULT_CONFIG: SuperClawConfig = {
  name: 'SuperClaw',
  version: '1.0.0',
  language: 'zh-CN',
  
  context: {
    cacheSize: 100,
    cacheTtl: 5 * 60 * 1000, // 5 分钟
    maxTokens: 100000,
  },
  
  memory: {
    maxItems: 1000,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 小时
  },
  
  skills: {
    enabled: ['web_search', 'code_review', 'translate'],
    disabled: [],
  },
  
  zeroToken: {
    enabled: true,
    providers: ['deepseek', 'claude', 'gemini'],
  },
  
  multiAgent: {
    enabled: true,
    maxWorkers: 5,
  },
};

// ==================== 配置管理器 ====================

export class ConfigManager {
  private config: SuperClawConfig;
  private configPath: string;

  constructor(configPath = '/root/.openclaw/workspace/superclaw.json') {
    this.configPath = configPath;
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * 获取配置
   */
  get(): SuperClawConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  update(updates: Partial<SuperClawConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * 保存配置
   */
  async save(): Promise<void> {
    // TODO: 保存到文件
  }

  /**
   * 加载配置
   */
  async load(): Promise<void> {
    // TODO: 从文件加载
  }

  /**
   * 重置配置
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
  }
}

// ==================== 导出 ====================

export function createConfigManager(configPath?: string): ConfigManager {
  return new ConfigManager(configPath);
}
