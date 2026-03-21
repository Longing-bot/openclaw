/**
 * OpenClaw 模型流式处理器
 * 
 * 支持流式响应：
 * 1. 流式输出
 * 2. 增量处理
 * 3. 实时反馈
 */

export interface StreamChunk {
  content: string;
  done: boolean;
  metadata?: any;
}

export class ModelStreamProcessor {
  constructor() {
    console.log('[StreamProcessor] 初始化完成');
  }

  /**
   * 处理流式响应
   */
  async *processStream(
    generator: AsyncGenerator<string>
  ): AsyncGenerator<StreamChunk> {
    let buffer = '';

    for await (const chunk of generator) {
      buffer += chunk;

      // 按句子分割
      const sentences = this.splitSentences(buffer);
      
      for (let i = 0; i < sentences.length - 1; i++) {
        yield {
          content: sentences[i],
          done: false,
        };
      }

      // 保留最后一个不完整的句子
      buffer = sentences[sentences.length - 1] || '';
    }

    // 输出剩余内容
    if (buffer) {
      yield {
        content: buffer,
        done: true,
      };
    }
  }

  /**
   * 分割句子
   */
  private splitSentences(text: string): string[] {
    // 按句号、问号、感叹号分割
    const sentences = text.split(/([。！？\n])/);
    const result: string[] = [];

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i];
      const punctuation = sentences[i + 1] || '';
      if (sentence) {
        result.push(sentence + punctuation);
      }
    }

    return result;
  }

  /**
   * 合并流式响应
   */
  async mergeStream(generator: AsyncGenerator<StreamChunk>): Promise<string> {
    let result = '';

    for await (const chunk of generator) {
      result += chunk.content;
    }

    return result;
  }
}

let globalStreamProcessor: ModelStreamProcessor | null = null;

export function getGlobalStreamProcessor(): ModelStreamProcessor {
  if (!globalStreamProcessor) {
    globalStreamProcessor = new ModelStreamProcessor();
  }
  return globalStreamProcessor;
}
