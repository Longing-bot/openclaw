/**
 * OpenClaw 轻量级响应格式化器
 * 
 * 专为小参数模型优化：
 * 1. 简化的响应格式
 * 2. 快速格式化
 * 3. 低计算开销
 */

export interface Response {
  content: string;
  type: 'text' | 'code' | 'json' | 'markdown';
  metadata?: Record<string, any>;
}

export class LightweightResponseFormatter {
  constructor() {
    console.log('[ResponseFormatter] 初始化完成');
  }

  /**
   * 格式化响应
   */
  format(content: string, type: Response['type'] = 'text'): Response {
    return {
      content: this.cleanContent(content),
      type,
      metadata: {
        length: content.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 清理内容
   */
  private cleanContent(content: string): string {
    // 移除多余空白
    let cleaned = content.replace(/\s+/g, ' ').trim();

    // 移除重复内容
    const lines = cleaned.split('\n');
    const uniqueLines = [...new Set(lines)];
    cleaned = uniqueLines.join('\n');

    return cleaned;
  }

  /**
   * 压缩响应
   */
  compress(response: Response): Response {
    const compressed = this.cleanContent(response.content);

    return {
      ...response,
      content: compressed,
      metadata: {
        ...response.metadata,
        compressed: true,
        compressionRatio: compressed.length / response.content.length,
      },
    };
  }

  /**
   * 生成摘要
   */
  summarize(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content;

    // 简单摘要
    return content.substring(0, maxLength - 3) + '...';
  }

  /**
   * 添加格式
   */
  addFormat(content: string, format: 'bold' | 'italic' | 'code'): string {
    switch (format) {
      case 'bold':
        return `**${content}**`;
      case 'italic':
        return `*${content}*`;
      case 'code':
        return `\`${content}\``;
      default:
        return content;
    }
  }
}

let globalResponseFormatter: LightweightResponseFormatter | null = null;

export function getGlobalResponseFormatter(): LightweightResponseFormatter {
  if (!globalResponseFormatter) {
    globalResponseFormatter = new LightweightResponseFormatter();
  }
  return globalResponseFormatter;
}
