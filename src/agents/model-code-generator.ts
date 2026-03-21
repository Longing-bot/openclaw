/**
 * OpenClaw 模型代码生成器
 * 
 * 生成代码：
 * 1. 代码模板
 * 2. 代码补全
 * 3. 代码优化
 */

export interface CodeTemplate {
  name: string;
  language: string;
  template: string;
  variables: string[];
}

export class ModelCodeGenerator {
  private templates: Map<string, CodeTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * 初始化模板
   */
  private initializeTemplates(): void {
    // 函数模板
    this.templates.set('function', {
      name: 'function',
      language: 'javascript',
      template: `function {{name}}({{params}}) {
  {{body}}
}`,
      variables: ['name', 'params', 'body'],
    });

    // 类模板
    this.templates.set('class', {
      name: 'class',
      language: 'javascript',
      template: `class {{name}} {
  constructor({{params}}) {
    {{constructor}}
  }

  {{methods}}
}`,
      variables: ['name', 'params', 'constructor', 'methods'],
    });

    console.log('[CodeGenerator] 初始化完成');
  }

  /**
   * 生成代码
   */
  generate(templateName: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`模板不存在: ${templateName}`);
    }

    let code = template.template;
    for (const [key, value] of Object.entries(variables)) {
      code = code.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return code;
  }

  /**
   * 添加模板
   */
  addTemplate(template: CodeTemplate): void {
    this.templates.set(template.name, template);
  }

  /**
   * 获取模板列表
   */
  getTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
}

let globalCodeGenerator: ModelCodeGenerator | null = null;

export function getGlobalCodeGenerator(): ModelCodeGenerator {
  if (!globalCodeGenerator) {
    globalCodeGenerator = new ModelCodeGenerator();
  }
  return globalCodeGenerator;
}
