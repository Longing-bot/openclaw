/**
 * OpenClaw 轻量级意图识别器
 * 
 * 专为小参数模型优化：
 * 1. 简化的意图识别
 * 2. 快速识别
 * 3. 低计算开销
 */

export interface Intent {
  name: string;
  confidence: number;
  entities?: string[];
}

export class LightweightIntentRecognizer {
  private patterns: Map<string, RegExp[]> = new Map();

  constructor() {
    this.initializePatterns();
  }

  /**
   * 初始化模式
   */
  private initializePatterns(): void {
    // 问候
    this.addPattern('greeting', [/你好/, /hello/, /hi/i]);

    // 帮助
    this.addPattern('help', [/帮助/, /help/i, /怎么用/]);

    // 搜索
    this.addPattern('search', [/搜索/, /查找/, /找/]);

    // 执行
    this.addPattern('execute', [/执行/, /运行/, /运行/]);

    // 查询
    this.addPattern('query', [/查询/, /查看/, /显示/]);

    console.log('[IntentRecognizer] 初始化完成');
  }

  /**
   * 添加模式
   */
  addPattern(intent: string, patterns: RegExp[]): void {
    this.patterns.set(intent, patterns);
  }

  /**
   * 识别意图
   */
  recognize(input: string): Intent | null {
    for (const [intent, patterns] of this.patterns) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          return {
            name: intent,
            confidence: 0.8,
            entities: this.extractEntities(input),
          };
        }
      }
    }

    return {
      name: 'unknown',
      confidence: 0.1,
    };
  }

  /**
   * 提取实体
   */
  private extractEntities(input: string): string[] {
    const words = input.split(/\s+/);
    return words.filter(w => w.length > 2).slice(0, 3);
  }

  /**
   * 获取所有意图
   */
  getIntents(): string[] {
    return Array.from(this.patterns.keys());
  }
}

let globalIntentRecognizer: LightweightIntentRecognizer | null = null;

export function getGlobalIntentRecognizer(): LightweightIntentRecognizer {
  if (!globalIntentRecognizer) {
    globalIntentRecognizer = new LightweightIntentRecognizer();
  }
  return globalIntentRecognizer;
}
