/**
 * OpenClaw 模型语义理解器
 * 
 * 增强语义理解：
 * 1. 意图识别
 * 2. 情感分析
 * 3. 实体识别
 */

export interface SemanticAnalysis {
  intent: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  entities: string[];
  topics: string[];
}

export class ModelSemanticAnalyzer {
  constructor() {
    console.log('[SemanticAnalyzer] 初始化完成');
  }

  /**
   * 分析语义
   */
  analyze(text: string): SemanticAnalysis {
    return {
      intent: this.detectIntent(text),
      sentiment: this.analyzeSentiment(text),
      entities: this.extractEntities(text),
      topics: this.extractTopics(text),
    };
  }

  /**
   * 检测意图
   */
  private detectIntent(text: string): string {
    // 简单意图检测
    if (text.includes('?') || text.includes('？')) {
      return 'question';
    }
    if (text.includes('请') || text.includes('帮我')) {
      return 'request';
    }
    if (text.includes('谢谢') || text.includes('感谢')) {
      return 'gratitude';
    }
    if (text.includes('抱歉') || text.includes('对不起')) {
      return 'apology';
    }
    return 'statement';
  }

  /**
   * 分析情感
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['好', '棒', '优秀', '喜欢', '感谢', '谢谢'];
    const negativeWords = ['差', '坏', '糟糕', '讨厌', '抱歉', '对不起'];

    let score = 0;
    for (const word of positiveWords) {
      if (text.includes(word)) score++;
    }
    for (const word of negativeWords) {
      if (text.includes(word)) score--;
    }

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  /**
   * 提取实体
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];

    // 提取数字
    const numbers = text.match(/\d+/g) || [];
    entities.push(...numbers.slice(0, 3));

    // 提取大写单词
    const uppercase = text.match(/[A-Z][a-z]+/g) || [];
    entities.push(...uppercase.slice(0, 3));

    return [...new Set(entities)];
  }

  /**
   * 提取主题
   */
  private extractTopics(text: string): string[] {
    // 简单主题提取
    const words = text.split(/\s+/);
    const significant = words.filter(w => w.length > 3);
    return significant.slice(0, 5);
  }
}

let globalSemanticAnalyzer: ModelSemanticAnalyzer | null = null;

export function getGlobalSemanticAnalyzer(): ModelSemanticAnalyzer {
  if (!globalSemanticAnalyzer) {
    globalSemanticAnalyzer = new ModelSemanticAnalyzer();
  }
  return globalSemanticAnalyzer;
}
