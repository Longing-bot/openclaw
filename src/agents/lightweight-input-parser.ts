/**
 * OpenClaw 轻量级输入解析器
 * 
 * 专为小参数模型优化：
 * 1. 简化的输入解析
 * 2. 快速解析
 * 3. 低计算开销
 */

export interface ParsedInput {
  type: 'command' | 'question' | 'statement' | 'unknown';
  content: string;
  intent?: string;
  entities?: string[];
}

export class LightweightInputParser {
  constructor() {
    console.log('[InputParser] 初始化完成');
  }

  /**
   * 解析输入
   */
  parse(input: string): ParsedInput {
    const trimmed = input.trim();

    // 检查是否是命令
    if (trimmed.startsWith('/') || trimmed.startsWith('!')) {
      return {
        type: 'command',
        content: trimmed,
        intent: this.extractCommand(trimmed),
      };
    }

    // 检查是否是问题
    if (trimmed.endsWith('?') || this.isQuestion(trimmed)) {
      return {
        type: 'question',
        content: trimmed,
        intent: 'question',
        entities: this.extractEntities(trimmed),
      };
    }

    // 默认为陈述
    return {
      type: 'statement',
      content: trimmed,
      entities: this.extractEntities(trimmed),
    };
  }

  /**
   * 提取命令
   */
  private extractCommand(input: string): string {
    const match = input.match(/^[/!](\w+)/);
    return match ? match[1] : '';
  }

  /**
   * 检查是否是问题
   */
  private isQuestion(input: string): boolean {
    const questionWords = ['什么', '怎么', '为什么', '如何', '谁', '哪', '吗', '呢'];
    return questionWords.some(word => input.includes(word));
  }

  /**
   * 提取实体
   */
  private extractEntities(input: string): string[] {
    // 简化提取
    const words = input.split(/\s+/);
    return words.filter(w => w.length > 2).slice(0, 5);
  }
}

let globalInputParser: LightweightInputParser | null = null;

export function getGlobalInputParser(): LightweightInputParser {
  if (!globalInputParser) {
    globalInputParser = new LightweightInputParser();
  }
  return globalInputParser;
}
