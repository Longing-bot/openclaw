/**
 * OpenClaw 轻量级模型适配器
 * 
 * 专为小参数模型优化：
 * 1. 简化的模型接口
 * 2. 快速推理
 * 3. 低计算开销
 */

export interface ModelConfig {
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class LightweightModelAdapter {
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
    console.log('[ModelAdapter] 初始化完成');
  }

  /**
   * 生成响应
   */
  async generate(prompt: string): Promise<string> {
    console.log(`[ModelAdapter] 生成响应: ${this.config.model}`);

    // 模拟生成
    await new Promise(resolve => setTimeout(resolve, 100));

    return `模拟响应: ${prompt.substring(0, 50)}...`;
  }

  /**
   * 生成嵌入
   */
  async embed(text: string): Promise<number[]> {
    console.log(`[ModelAdapter] 生成嵌入: ${this.config.model}`);

    // 模拟嵌入
    return Array(128).fill(0).map(() => Math.random());
  }

  /**
   * 估算 token 数
   */
  estimateTokens(text: string): number {
    // 简化估算
    return Math.ceil(text.length / 4);
  }

  /**
   * 检查是否超过限制
   */
  isOverLimit(text: string): boolean {
    return this.estimateTokens(text) > this.config.maxTokens;
  }

  /**
   * 截断文本
   */
  truncate(text: string, maxTokens: number): string {
    const estimated = this.estimateTokens(text);
    if (estimated <= maxTokens) return text;

    // 按比例截断
    const ratio = maxTokens / estimated;
    const truncateLength = Math.floor(text.length * ratio);
    return text.substring(0, truncateLength) + '...';
  }

  /**
   * 获取配置
   */
  getConfig(): ModelConfig {
    return { ...this.config };
  }
}

let globalModelAdapter: LightweightModelAdapter | null = null;

export function getGlobalModelAdapter(): LightweightModelAdapter {
  if (!globalModelAdapter) {
    globalModelAdapter = new LightweightModelAdapter({
      provider: 'openai',
      model: 'gpt-4.1-mini',
      maxTokens: 4096,
      temperature: 0.7,
    });
  }
  return globalModelAdapter;
}
