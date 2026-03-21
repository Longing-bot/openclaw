/**
 * OpenClaw 模型响应解析器
 * 
 * 解析模型响应：
 * 1. JSON 解析
 * 2. 代码提取
 * 3. 列表提取
 */

export class ModelResponseParser {
  constructor() {
    console.log('[ResponseParser] 初始化完成');
  }

  /**
   * 解析 JSON
   */
  parseJSON(response: string): any | null {
    try {
      // 尝试直接解析
      return JSON.parse(response);
    } catch {
      // 尝试提取 JSON 块
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {
          return null;
        }
      }

      // 尝试提取大括号内容
      const braceMatch = response.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          return JSON.parse(braceMatch[0]);
        } catch {
          return null;
        }
      }

      return null;
    }
  }

  /**
   * 提取代码
   */
  extractCode(response: string): Array<{ language: string; code: string }> {
    const codes: Array<{ language: string; code: string }> = [];

    // 匹配代码块
    const codeBlocks = response.match(/```(\w+)?\n([\s\S]*?)\n```/g);
    if (codeBlocks) {
      for (const block of codeBlocks) {
        const match = block.match(/```(\w+)?\n([\s\S]*?)\n```/);
        if (match) {
          codes.push({
            language: match[1] || 'text',
            code: match[2],
          });
        }
      }
    }

    return codes;
  }

  /**
   * 提取列表
   */
  extractList(response: string): string[] {
    const items: string[] = [];

    // 匹配无序列表
    const unorderedMatch = response.match(/^[\-\*]\s+(.+)$/gm);
    if (unorderedMatch) {
      items.push(...unorderedMatch.map(m => m.replace(/^[\-\*]\s+/, '')));
    }

    // 匹配有序列表
    const orderedMatch = response.match(/^\d+\.\s+(.+)$/gm);
    if (orderedMatch) {
      items.push(...orderedMatch.map(m => m.replace(/^\d+\.\s+/, '')));
    }

    return items;
  }

  /**
   * 提取标题
   */
  extractHeadings(response: string): Array<{ level: number; text: string }> {
    const headings: Array<{ level: number; text: string }> = [];

    // 匹配 Markdown 标题
    const headingMatch = response.match(/^(#{1,6})\s+(.+)$/gm);
    if (headingMatch) {
      for (const match of headingMatch) {
        const parts = match.match(/^(#{1,6})\s+(.+)$/);
        if (parts) {
          headings.push({
            level: parts[1].length,
            text: parts[2],
          });
        }
      }
    }

    return headings;
  }

  /**
   * 清理响应
   */
  cleanResponse(response: string): string {
    // 移除多余空白
    let cleaned = response.replace(/\s+/g, ' ').trim();

    // 移除重复内容
    const lines = cleaned.split('\n');
    const uniqueLines = [...new Set(lines)];
    cleaned = uniqueLines.join('\n');

    return cleaned;
  }
}

let globalResponseParser: ModelResponseParser | null = null;

export function getGlobalResponseParser(): ModelResponseParser {
  if (!globalResponseParser) {
    globalResponseParser = new ModelResponseParser();
  }
  return globalResponseParser;
}
