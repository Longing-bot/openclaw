/**
 * OpenClaw 提示词优化系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的提示词模板
 * 2. 上下文压缩
 * 3. 关键信息提取
 * 4. 低开销推理
 */

// ==================== 类型定义 ====================

export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
  description: string;
}

export interface PromptOptimization {
  original: string;
  optimized: string;
  compressionRatio: number;
  preservedInfo: string[];
}

// ==================== 提示词优化系统 ====================

export class PromptOptimizationSystem {
  private templates: Map<string, PromptTemplate> = new Map();
  private compressionCache: Map<string, string> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * 初始化模板
   */
  private initializeTemplates(): void {
    // 任务分解模板
    this.registerTemplate({
      name: 'task-decomposition',
      template: `任务: {{task}}
分解为:
1. {{step1}}
2. {{step2}}
3. {{step3}}`,
      variables: ['task', 'step1', 'step2', 'step3'],
      description: '将复杂任务分解为简单步骤',
    });

    // 问题分析模板
    this.registerTemplate({
      name: 'problem-analysis',
      template: `问题: {{problem}}
原因: {{cause}}
解决方案: {{solution}}`,
      variables: ['problem', 'cause', 'solution'],
      description: '分析问题并提供解决方案',
    });

    // 代码生成模板
    this.registerTemplate({
      name: 'code-generation',
      template: `功能: {{function}}
语言: {{language}}
代码:
\`\`\`{{language}}
{{code}}
\`\`\``,
      variables: ['function', 'language', 'code'],
      description: '生成代码',
    });

    // 总结模板
    this.registerTemplate({
      name: 'summary',
      template: `原文: {{content}}
总结: {{summary}}`,
      variables: ['content', 'summary'],
      description: '总结内容',
    });

    console.log('[PromptOptimization] 初始化完成');
  }

  /**
   * 注册模板
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.name, template);
  }

  /**
   * 使用模板
   */
  useTemplate(name: string, variables: Record<string, string>): string {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`模板不存在: ${name}`);
    }

    let result = template.template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return result;
  }

  /**
   * 压缩提示词
   */
  compressPrompt(prompt: string): PromptOptimization {
    // 检查缓存
    const cached = this.compressionCache.get(prompt);
    if (cached) {
      return {
        original: prompt,
        optimized: cached,
        compressionRatio: cached.length / prompt.length,
        preservedInfo: this.extractKeyInfo(prompt),
      };
    }

    // 压缩策略
    let optimized = prompt;

    // 1. 移除多余空白
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // 2. 移除重复内容
    const lines = optimized.split('\n');
    const uniqueLines = [...new Set(lines)];
    optimized = uniqueLines.join('\n');

    // 3. 缩短短语
    const shortenings: Record<string, string> = {
      '请': '',
      '帮我': '',
      '我想': '',
      '能否': '',
      '可以': '',
      '需要': '',
      '实现': '做',
      '创建': '建',
      '生成': '生',
      '执行': '跑',
    };

    for (const [long, short] of Object.entries(shortenings)) {
      optimized = optimized.replace(new RegExp(long, 'g'), short);
    }

    // 缓存结果
    this.compressionCache.set(prompt, optimized);

    return {
      original: prompt,
      optimized,
      compressionRatio: optimized.length / prompt.length,
      preservedInfo: this.extractKeyInfo(prompt),
    };
  }

  /**
   * 提取关键信息
   */
  private extractKeyInfo(text: string): string[] {
    const info: string[] = [];

    // 提取名词
    const nouns = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    info.push(...nouns.slice(0, 5));

    // 提取数字
    const numbers = text.match(/\d+/g) || [];
    info.push(...numbers.slice(0, 3));

    // 提取英文单词
    const english = text.match(/[a-zA-Z]+/g) || [];
    info.push(...english.slice(0, 5));

    return [...new Set(info)];
  }

  /**
   * 生成精简提示词
   */
  generateConcisePrompt(task: string, context?: string): string {
    const parts: string[] = [];

    // 任务
    parts.push(`任务: ${task}`);

    // 上下文（如果有）
    if (context) {
      const compressed = this.compressPrompt(context);
      if (compressed.compressionRatio < 0.8) {
        parts.push(`上下文: ${compressed.optimized}`);
      }
    }

    // 要求
    parts.push('要求: 简洁、准确、高效');

    return parts.join('\n');
  }

  /**
   * 优化系统提示词
   */
  optimizeSystemPrompt(prompt: string): string {
    const optimization = this.compressPrompt(prompt);

    // 添加优化标记
    const optimized = `[优化版] ${optimization.optimized}`;

    console.log(`[PromptOptimization] 压缩率: ${(optimization.compressionRatio * 100).toFixed(1)}%`);

    return optimized;
  }

  /**
   * 获取模板列表
   */
  getTemplateList(): string[] {
    return Array.from(this.templates.values()).map(t => `${t.name}: ${t.description}`);
  }

  /**
   * 获取统计
   */
  getStats(): { templateCount: number; cacheSize: number } {
    return {
      templateCount: this.templates.size,
      cacheSize: this.compressionCache.size,
    };
  }
}

// ==================== 全局实例 ====================

let globalPromptOptimization: PromptOptimizationSystem | null = null;

export function getGlobalPromptOptimization(): PromptOptimizationSystem {
  if (!globalPromptOptimization) {
    globalPromptOptimization = new PromptOptimizationSystem();
  }
  return globalPromptOptimization;
}

export function resetGlobalPromptOptimization(): void {
  globalPromptOptimization = null;
}
