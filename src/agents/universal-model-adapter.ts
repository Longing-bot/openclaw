/**
 * OpenClaw 通用模型适配层
 * 
 * 支持多种模型：
 * 1. OpenAI GPT 系列
 * 2. Anthropic Claude 系列
 * 3. Google Gemini 系列
 * 4. 小米 MiMo 系列
 * 5. 其他兼容 OpenAI API 的模型
 * 
 * 核心理念：
 * - 统一接口，不同模型
 * - 自动适配，智能优化
 * - 无缝切换，保持一致
 */

// ==================== 类型定义 ====================

export interface ModelProvider {
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'xiaomi' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  maxTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
}

export interface ModelConfig {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

// ==================== 通用模型适配器 ====================

export class UniversalModelAdapter {
  private providers: Map<string, ModelProvider> = new Map();
  private currentProvider: string = 'openai';
  private currentModel: string = 'gpt-4.1-mini';
  private fallbackChain: string[] = [];

  constructor() {
    this.initializeProviders();
  }

  /**
   * 初始化提供商
   */
  private initializeProviders(): void {
    // OpenAI
    this.registerProvider({
      name: 'openai',
      type: 'openai',
      models: [
        'gpt-4.1',
        'gpt-4.1-mini',
        'gpt-4.1-nano',
        'gpt-4o',
        'gpt-4o-mini',
        'o1',
        'o1-mini',
        'o3-mini',
      ],
      maxTokens: 128000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
    });

    // Anthropic
    this.registerProvider({
      name: 'anthropic',
      type: 'anthropic',
      models: [
        'claude-opus-4',
        'claude-sonnet-4',
        'claude-haiku-3-5',
        'claude-3-opus',
        'claude-3-sonnet',
        'claude-3-haiku',
      ],
      maxTokens: 200000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
    });

    // Google
    this.registerProvider({
      name: 'google',
      type: 'google',
      models: [
        'gemini-2.0-flash',
        'gemini-2.0-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
      ],
      maxTokens: 1000000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
    });

    // 小米 MiMo
    this.registerProvider({
      name: 'xiaomi',
      type: 'xiaomi',
      models: [
        'mimo-v2-pro',
        'mimo-v2-flash',
        'mimo-v1-pro',
        'mimo-v1-flash',
      ],
      maxTokens: 32000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
    });

    // 其他兼容 OpenAI API 的模型
    this.registerProvider({
      name: 'deepseek',
      type: 'openai',
      baseUrl: 'https://api.deepseek.com/v1',
      models: [
        'deepseek-chat',
        'deepseek-coder',
        'deepseek-reasoner',
      ],
      maxTokens: 64000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
    });

    this.registerProvider({
      name: 'qwen',
      type: 'openai',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      models: [
        'qwen-max',
        'qwen-plus',
        'qwen-turbo',
        'qwen-long',
      ],
      maxTokens: 128000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
    });

    this.registerProvider({
      name: 'moonshot',
      type: 'openai',
      baseUrl: 'https://api.moonshot.cn/v1',
      models: [
        'moonshot-v1-128k',
        'moonshot-v1-32k',
        'moonshot-v1-8k',
      ],
      maxTokens: 128000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
    });

    this.registerProvider({
      name: 'zhipu',
      type: 'openai',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      models: [
        'glm-4-plus',
        'glm-4-0520',
        'glm-4-flash',
      ],
      maxTokens: 128000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
    });

    console.log('[UniversalModel] 初始化完成，支持多种模型');
  }

  /**
   * 注册提供商
   */
  registerProvider(provider: ModelProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * 切换模型
   */
  switchModel(provider: string, model: string): boolean {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      console.error(`[UniversalModel] 提供商不存在: ${provider}`);
      return false;
    }

    if (!providerConfig.models.includes(model)) {
      console.error(`[UniversalModel] 模型不存在: ${model}`);
      return false;
    }

    this.currentProvider = provider;
    this.currentModel = model;
    console.log(`[UniversalModel] 切换模型: ${provider}/${model}`);
    return true;
  }

  /**
   * 设置故障转移链
   */
  setFallbackChain(chain: string[]): void {
    this.fallbackChain = chain;
  }

  /**
   * 生成响应（统一接口）
   */
  async generate(
    messages: Message[],
    config?: Partial<ModelConfig>,
    functions?: FunctionDefinition[]
  ): Promise<{
    content: string;
    function_call?: { name: string; arguments: string };
    usage?: { prompt_tokens: number; completion_tokens: number };
  }> {
    const provider = this.providers.get(config?.provider || this.currentProvider);
    if (!provider) {
      throw new Error(`提供商不存在: ${config?.provider || this.currentProvider}`);
    }

    const model = config?.model || this.currentModel;

    // 根据提供商类型调用不同的 API
    switch (provider.type) {
      case 'openai':
        return this.callOpenAI(provider, model, messages, config, functions);
      case 'anthropic':
        return this.callAnthropic(provider, model, messages, config, functions);
      case 'google':
        return this.callGoogle(provider, model, messages, config, functions);
      case 'xiaomi':
        return this.callXiaomi(provider, model, messages, config, functions);
      default:
        throw new Error(`不支持的提供商类型: ${provider.type}`);
    }
  }

  /**
   * 调用 OpenAI API
   */
  private async callOpenAI(
    provider: ModelProvider,
    model: string,
    messages: Message[],
    config?: Partial<ModelConfig>,
    functions?: FunctionDefinition[]
  ): Promise<any> {
    console.log(`[UniversalModel] 调用 OpenAI: ${model}`);

    // 模拟调用
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      content: `OpenAI ${model} 的响应`,
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    };
  }

  /**
   * 调用 Anthropic API
   */
  private async callAnthropic(
    provider: ModelProvider,
    model: string,
    messages: Message[],
    config?: Partial<ModelConfig>,
    functions?: FunctionDefinition[]
  ): Promise<any> {
    console.log(`[UniversalModel] 调用 Anthropic: ${model}`);

    // 模拟调用
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      content: `Anthropic ${model} 的响应`,
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    };
  }

  /**
   * 调用 Google API
   */
  private async callGoogle(
    provider: ModelProvider,
    model: string,
    messages: Message[],
    config?: Partial<ModelConfig>,
    functions?: FunctionDefinition[]
  ): Promise<any> {
    console.log(`[UniversalModel] 调用 Google: ${model}`);

    // 模拟调用
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      content: `Google ${model} 的响应`,
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    };
  }

  /**
   * 调用小米 API
   */
  private async callXiaomi(
    provider: ModelProvider,
    model: string,
    messages: Message[],
    config?: Partial<ModelConfig>,
    functions?: FunctionDefinition[]
  ): Promise<any> {
    console.log(`[UniversalModel] 调用小米: ${model}`);

    // 模拟调用
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      content: `小米 ${model} 的响应`,
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    };
  }

  /**
   * 生成嵌入（统一接口）
   */
  async embed(text: string, provider?: string): Promise<number[]> {
    const providerConfig = this.providers.get(provider || this.currentProvider);
    if (!providerConfig) {
      throw new Error(`提供商不存在: ${provider || this.currentProvider}`);
    }

    // 模拟嵌入生成
    return Array(1536).fill(0).map(() => Math.random());
  }

  /**
   * 获取可用模型
   */
  getAvailableModels(): Array<{ provider: string; model: string }> {
    const models: Array<{ provider: string; model: string }> = [];
    for (const [providerName, provider] of this.providers) {
      for (const model of provider.models) {
        models.push({ provider: providerName, model });
      }
    }
    return models;
  }

  /**
   * 获取当前模型
   */
  getCurrentModel(): { provider: string; model: string } {
    return {
      provider: this.currentProvider,
      model: this.currentModel,
    };
  }

  /**
   * 检查模型能力
   */
  checkCapabilities(provider: string, model: string): {
    supportsStreaming: boolean;
    supportsFunctionCalling: boolean;
    supportsVision: boolean;
  } {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      return {
        supportsStreaming: false,
        supportsFunctionCalling: false,
        supportsVision: false,
      };
    }

    return {
      supportsStreaming: providerConfig.supportsStreaming,
      supportsFunctionCalling: providerConfig.supportsFunctionCalling,
      supportsVision: providerConfig.supportsVision,
    };
  }

  /**
   * 估算 token 数
   */
  estimateTokens(text: string): number {
    // 简化估算
    return Math.ceil(text.length / 4);
  }

  /**
   * 截断文本以适应模型
   */
  truncateForModel(text: string, provider: string, model: string): string {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) return text;

    const estimated = this.estimateTokens(text);
    if (estimated <= providerConfig.maxTokens) return text;

    // 按比例截断
    const ratio = providerConfig.maxTokens / estimated;
    const truncateLength = Math.floor(text.length * ratio);
    return text.substring(0, truncateLength) + '...';
  }

  /**
   * 获取统计
   */
  getStats(): {
    providerCount: number;
    modelCount: number;
    currentProvider: string;
    currentModel: string;
  } {
    let modelCount = 0;
    for (const provider of this.providers.values()) {
      modelCount += provider.models.length;
    }

    return {
      providerCount: this.providers.size,
      modelCount,
      currentProvider: this.currentProvider,
      currentModel: this.currentModel,
    };
  }
}

// ==================== 全局实例 ====================

let globalUniversalModel: UniversalModelAdapter | null = null;

export function getGlobalUniversalModel(): UniversalModelAdapter {
  if (!globalUniversalModel) {
    globalUniversalModel = new UniversalModelAdapter();
  }
  return globalUniversalModel;
}

export function resetGlobalUniversalModel(): void {
  globalUniversalModel = null;
}
