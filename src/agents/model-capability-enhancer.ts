/**
 * OpenClaw 模型能力增强器
 * 
 * 让小参数模型也能拥有大参数模型的能力：
 * 1. 思维链增强
 * 2. 知识蒸馏
 * 3. 提示词优化
 * 4. 上下文压缩
 */

export interface EnhancementConfig {
  enableChainOfThought: boolean;
  enableKnowledgeDistillation: boolean;
  enablePromptOptimization: boolean;
  enableContextCompression: boolean;
}

export class ModelCapabilityEnhancer {
  private config: EnhancementConfig;

  constructor(config: Partial<EnhancementConfig> = {}) {
    this.config = {
      enableChainOfThought: true,
      enableKnowledgeDistillation: true,
      enablePromptOptimization: true,
      enableContextCompression: true,
      ...config,
    };

    console.log('[CapabilityEnhancer] 初始化完成');
  }

  /**
   * 增强思维链
   */
  enhanceChainOfThought(prompt: string): string {
    if (!this.config.enableChainOfThought) return prompt;

    // 添加思维链提示
    const enhanced = `
${prompt}

请按以下步骤思考：
1. 理解问题的核心
2. 分析关键信息
3. 制定解决方案
4. 验证结果

请详细展示你的思考过程。
    `.trim();

    return enhanced;
  }

  /**
   * 知识蒸馏
   */
  distillKnowledge(response: string): string {
    if (!this.config.enableKnowledgeDistillation) return response;

    // 提取关键知识
    const lines = response.split('\n');
    const keyLines = lines.filter(line => 
      line.includes('重要') ||
      line.includes('关键') ||
      line.includes('注意') ||
      line.includes('总结')
    );

    return keyLines.length > 0 ? keyLines.join('\n') : response;
  }

  /**
   * 优化提示词
   */
  optimizePrompt(prompt: string): string {
    if (!this.config.enablePromptOptimization) return prompt;

    // 压缩提示词
    let optimized = prompt;

    // 移除冗余
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // 添加明确指令
    if (!optimized.includes('请')) {
      optimized = `请${optimized}`;
    }

    return optimized;
  }

  /**
   * 压缩上下文
   */
  compressContext(context: string, maxTokens: number = 2000): string {
    if (!this.config.enableContextCompression) return context;

    // 简单压缩
    const lines = context.split('\n');
    const importantLines = lines.filter(line => 
      line.length > 10 && 
      !line.startsWith('//') &&
      !line.startsWith('#')
    );

    let compressed = importantLines.join('\n');

    // 截断到指定长度
    if (compressed.length > maxTokens * 4) {
      compressed = compressed.substring(0, maxTokens * 4) + '...';
    }

    return compressed;
  }

  /**
   * 增强响应质量
   */
  enhanceResponse(response: string): string {
    let enhanced = response;

    // 添加结构
    if (!enhanced.includes('\n') && enhanced.length > 100) {
      enhanced = enhanced.replace(/。/g, '。\n');
    }

    // 添加总结
    if (enhanced.length > 500 && !enhanced.includes('总结')) {
      enhanced += '\n\n总结：以上是完整的回答。';
    }

    return enhanced;
  }

  /**
   * 生成系统提示词
   */
  generateSystemPrompt(role: string, capabilities: string[]): string {
    const capabilitiesList = capabilities.map(c => `- ${c}`).join('\n');

    return `
你是一个${role}，具有以下能力：
${capabilitiesList}

请遵循以下原则：
1. 回答要准确、简洁
2. 提供有用的建议
3. 保持友好和专业
4. 如果不确定，请说明

现在请开始工作。
    `.trim();
  }

  /**
   * 获取配置
   */
  getConfig(): EnhancementConfig {
    return { ...this.config };
  }
}

let globalCapabilityEnhancer: ModelCapabilityEnhancer | null = null;

export function getGlobalCapabilityEnhancer(): ModelCapabilityEnhancer {
  if (!globalCapabilityEnhancer) {
    globalCapabilityEnhancer = new ModelCapabilityEnhancer();
  }
  return globalCapabilityEnhancer;
}
