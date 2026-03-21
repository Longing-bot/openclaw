/**
 * OpenClaw 模型提示词模板
 * 
 * 预定义提示词模板：
 * 1. 问答模板
 * 2. 代码模板
 * 3. 写作模板
 * 4. 分析模板
 */

export class ModelPromptTemplates {
  private templates: Map<string, string> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * 初始化模板
   */
  private initializeTemplates(): void {
    // 问答模板
    this.templates.set('qa', `
请回答以下问题：
{{question}}

请提供准确、简洁的回答。
    `.trim());

    // 代码模板
    this.templates.set('code', `
请编写代码实现以下功能：
{{description}}

要求：
1. 代码简洁、高效
2. 包含必要的注释
3. 考虑边界情况
    `.trim());

    // 写作模板
    this.templates.set('writing', `
请撰写一篇关于{{topic}}的文章。

要求：
1. 结构清晰
2. 内容充实
3. 语言流畅
    `.trim());

    // 分析模板
    this.templates.set('analysis', `
请分析以下内容：
{{content}}

请提供：
1. 关键点
2. 优缺点
3. 建议
    `.trim());

    // 总结模板
    this.templates.set('summary', `
请总结以下内容：
{{content}}

要求：
1. 简洁明了
2. 突出重点
3. 保留关键信息
    `.trim());

    // 翻译模板
    this.templates.set('translate', `
请将以下内容翻译成{{language}}：
{{content}}

要求：
1. 准确传达原意
2. 语言流畅自然
3. 符合目标语言习惯
    `.trim());

    console.log('[PromptTemplates] 初始化完成');
  }

  /**
   * 使用模板
   */
  use(name: string, variables: Record<string, string>): string {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`模板不存在: ${name}`);
    }

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return result;
  }

  /**
   * 添加模板
   */
  add(name: string, template: string): void {
    this.templates.set(name, template);
  }

  /**
   * 获取模板列表
   */
  getTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
}

let globalPromptTemplates: ModelPromptTemplates | null = null;

export function getGlobalPromptTemplates(): ModelPromptTemplates {
  if (!globalPromptTemplates) {
    globalPromptTemplates = new ModelPromptTemplates();
  }
  return globalPromptTemplates;
}
