/**
 * OpenClaw 模型文本处理器
 * 
 * 处理文本：
 * 1. 文本清理
 * 2. 文本分析
 * 3. 文本转换
 */

export class ModelTextProcessor {
  constructor() {
    console.log('[TextProcessor] 初始化完成');
  }

  /**
   * 清理文本
   */
  clean(text: string): string {
    // 移除多余空白
    let cleaned = text.replace(/\s+/g, ' ').trim();

    // 移除特殊字符
    cleaned = cleaned.replace(/[^\w\s\u4e00-\u9fa5]/g, '');

    return cleaned;
  }

  /**
   * 分析文本
   */
  analyze(text: string): {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    paragraphCount: number;
  } {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[。！？.!?]/).filter(s => s.length > 0);
    const paragraphs = text.split(/\n\n/).filter(p => p.length > 0);

    return {
      wordCount: words.length,
      charCount: text.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
    };
  }

  /**
   * 转换文本
   */
  transform(text: string, type: 'uppercase' | 'lowercase' | 'capitalize'): string {
    switch (type) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'capitalize':
        return text.charAt(0).toUpperCase() + text.slice(1);
      default:
        return text;
    }
  }

  /**
   * 提取关键词
   */
  extractKeywords(text: string, count: number = 10): string[] {
    const words = text.split(/\s+/);
    const significant = words.filter(w => w.length > 3);
    return significant.slice(0, count);
  }

  /**
   * 生成摘要
   */
  summarize(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text;

    const sentences = text.split(/[。！？.!?]/);
    let summary = '';

    for (const sentence of sentences) {
      if (summary.length + sentence.length <= maxLength) {
        summary += sentence + '。';
      } else {
        break;
      }
    }

    return summary || text.substring(0, maxLength) + '...';
  }
}

let globalTextProcessor: ModelTextProcessor | null = null;

export function getGlobalTextProcessor(): ModelTextProcessor {
  if (!globalTextProcessor) {
    globalTextProcessor = new ModelTextProcessor();
  }
  return globalTextProcessor;
}
