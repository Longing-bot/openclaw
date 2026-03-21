/**
 * OpenClaw 模型上下文压缩器
 * 
 * 压缩上下文以适应小参数模型：
 * 1. 摘要生成
 * 2. 关键信息提取
 * 3. 冗余删除
 */

export class ModelContextCompressor {
  constructor() {
    console.log('[ContextCompressor] 初始化完成');
  }

  /**
   * 压缩上下文
   */
  compress(context: string, maxTokens: number = 2000): string {
    // 分割成段落
    const paragraphs = context.split('\n\n');

    // 评分每个段落
    const scored = paragraphs.map(p => ({
      text: p,
      score: this.scoreParagraph(p),
    }));

    // 按分数排序
    scored.sort((a, b) => b.score - a.score);

    // 选择最重要的段落
    let compressed = '';
    let currentTokens = 0;

    for (const item of scored) {
      const tokens = this.estimateTokens(item.text);
      if (currentTokens + tokens <= maxTokens) {
        compressed += item.text + '\n\n';
        currentTokens += tokens;
      }
    }

    return compressed.trim();
  }

  /**
   * 评分段落
   */
  private scoreParagraph(paragraph: string): number {
    let score = 0;

    // 长度分数
    if (paragraph.length > 50) score += 1;
    if (paragraph.length > 100) score += 1;

    // 关键词分数
    const keywords = ['重要', '关键', '注意', '总结', '结论', '结果'];
    for (const keyword of keywords) {
      if (paragraph.includes(keyword)) score += 2;
    }

    // 数字分数
    if (/\d+/.test(paragraph)) score += 1;

    // 代码分数
    if (/```/.test(paragraph)) score += 2;

    return score;
  }

  /**
   * 估算 token 数
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * 生成摘要
   */
  summarize(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text;

    // 取前 200 字符
    let summary = text.substring(0, maxLength);

    // 找到最后一个完整句子
    const lastPeriod = summary.lastIndexOf('。');
    if (lastPeriod > maxLength * 0.5) {
      summary = summary.substring(0, lastPeriod + 1);
    } else {
      summary += '...';
    }

    return summary;
  }

  /**
   * 提取关键信息
   */
  extractKeyInfo(text: string): string[] {
    const info: string[] = [];

    // 提取数字
    const numbers = text.match(/\d+/g) || [];
    info.push(...numbers.slice(0, 5));

    // 提取大写单词
    const uppercase = text.match(/[A-Z][a-z]+/g) || [];
    info.push(...uppercase.slice(0, 5));

    // 提取中文关键词
    const keywords = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    info.push(...keywords.slice(0, 5));

    return [...new Set(info)];
  }
}

let globalContextCompressor: ModelContextCompressor | null = null;

export function getGlobalContextCompressor(): ModelContextCompressor {
  if (!globalContextCompressor) {
    globalContextCompressor = new ModelContextCompressor();
  }
  return globalContextCompressor;
}
