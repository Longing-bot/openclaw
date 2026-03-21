/**
 * OpenClaw 模型格式化器
 * 
 * 格式化输出：
 * 1. JSON 格式化
 * 2. Markdown 格式化
 * 3. 代码格式化
 */

export class ModelFormatter {
  constructor() {
    console.log('[Formatter] 初始化完成');
  }

  /**
   * 格式化 JSON
   */
  formatJSON(obj: any, indent: number = 2): string {
    return JSON.stringify(obj, null, indent);
  }

  /**
   * 格式化 Markdown
   */
  formatMarkdown(content: string): string {
    // 添加标题
    if (!content.startsWith('#')) {
      content = `# 输出\n\n${content}`;
    }

    // 添加段落
    content = content.replace(/\n\n/g, '\n\n');

    return content;
  }

  /**
   * 格式化代码
   */
  formatCode(code: string, language: string = 'javascript'): string {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  /**
   * 格式化列表
   */
  formatList(items: string[], ordered: boolean = false): string {
    if (ordered) {
      return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
    }
    return items.map(item => `- ${item}`).join('\n');
  }

  /**
   * 格式化表格
   */
  formatTable(headers: string[], rows: string[][]): string {
    let table = '| ' + headers.join(' | ') + ' |\n';
    table += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

    for (const row of rows) {
      table += '| ' + row.join(' | ') + ' |\n';
    }

    return table;
  }
}

let globalFormatter: ModelFormatter | null = null;

export function getGlobalFormatter(): ModelFormatter {
  if (!globalFormatter) {
    globalFormatter = new ModelFormatter();
  }
  return globalFormatter;
}
