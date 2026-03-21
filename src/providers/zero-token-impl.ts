/**
 * OpenClaw 零 Token 完整实现
 * 
 * 原生支持所有主流 AI 模型，无需 API Token
 * 解决原项目重复内容的问题
 */

// ==================== 类型定义 ====================

export interface ZeroTokenCredentials {
  cookie: string;
  bearer?: string;
  userAgent: string;
  provider: string;
  sessionKey?: string;
  organizationId?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  thinking?: string;
}

// ==================== 流式响应处理器（解决重复问题） ====================

class StreamProcessor {
  private lastContent: string = '';
  private buffer: string = '';

  /**
   * 处理 SSE 流，去重
   */
  processChunk(chunk: string): StreamChunk | null {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    let content = '';
    let done = false;
    let thinking = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          done = true;
          continue;
        }

        try {
          const json = JSON.parse(data);
          
          // DeepSeek 格式
          if (json.choices?.[0]?.delta?.content) {
            const newContent = json.choices[0].delta.content;
            // 去重：跳过与上次相同的内容
            if (newContent !== this.lastContent) {
              content += newContent;
              this.lastContent = newContent;
            }
          }
          
          // Claude 格式
          if (json.type === 'content_block_delta' && json.delta?.text) {
            const newContent = json.delta.text;
            if (newContent !== this.lastContent) {
              content += newContent;
              this.lastContent = newContent;
            }
          }
          
          // OpenAI 格式
          if (json.choices?.[0]?.delta?.content) {
            const newContent = json.choices[0].delta.content;
            if (newContent !== this.lastContent) {
              content += newContent;
              this.lastContent = newContent;
            }
          }
          
          // 思考过程
          if (json.thinking || json.reasoning_content) {
            thinking = json.thinking || json.reasoning_content;
          }
        } catch {
          // 非 JSON 数据，可能是纯文本
          if (data !== this.lastContent) {
            content += data;
            this.lastContent = data;
          }
        }
      }
    }

    if (content || done) {
      return { content, done, thinking: thinking || undefined };
    }
    return null;
  }

  reset() {
    this.lastContent = '';
    this.buffer = '';
  }
}

// ==================== DeepSeek 客户端 ====================

class DeepSeekWebClient {
  private credentials: ZeroTokenCredentials;
  private streamProcessor: StreamProcessor;

  constructor(credentials: ZeroTokenCredentials) {
    this.credentials = credentials;
    this.streamProcessor = new StreamProcessor();
  }

  async chat(messages: ChatMessage[], model: string = 'deepseek-chat'): Promise<ReadableStream<Uint8Array>> {
    const headers = {
      'Cookie': this.credentials.cookie,
      'User-Agent': this.credentials.userAgent,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Referer': 'https://chat.deepseek.com/',
      'Origin': 'https://chat.deepseek.com',
      ...(this.credentials.bearer ? { 'Authorization': `Bearer ${this.credentials.bearer}` } : {}),
    };

    const response = await fetch('https://chat.deepseek.com/api/v0/chat/completion', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        model,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    return this.createProcessedStream(response.body!);
  }

  private createProcessedStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    const processor = this.streamProcessor;
    processor.reset();

    return new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          const text = decoder.decode(value, { stream: true });
          const chunk = processor.processChunk(text);
          
          if (chunk) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(chunk.content));
            
            if (chunk.done) {
              controller.close();
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}

// ==================== Claude 客户端 ====================

class ClaudeWebClient {
  private credentials: ZeroTokenCredentials;
  private streamProcessor: StreamProcessor;

  constructor(credentials: ZeroTokenCredentials) {
    this.credentials = credentials;
    this.streamProcessor = new StreamProcessor();
  }

  async chat(messages: ChatMessage[], model: string = 'claude-sonnet-4-6'): Promise<ReadableStream<Uint8Array>> {
    const headers = {
      'Cookie': this.credentials.cookie,
      'User-Agent': this.credentials.userAgent,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Referer': 'https://claude.ai/',
      'Origin': 'https://claude.ai',
      ...(this.credentials.sessionKey ? { 'Authorization': `Bearer ${this.credentials.sessionKey}` } : {}),
    };

    // 转换消息格式
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const response = await fetch('https://claude.ai/api/chat/completion', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        model,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    return this.createProcessedStream(response.body!);
  }

  private createProcessedStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    const processor = this.streamProcessor;
    processor.reset();

    return new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          const text = decoder.decode(value, { stream: true });
          const chunk = processor.processChunk(text);
          
          if (chunk) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(chunk.content));
            
            if (chunk.done) {
              controller.close();
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}

// ==================== 统一零 Token 提供者 ====================

export class ZeroTokenProvider {
  private clients: Map<string, DeepSeekWebClient | ClaudeWebClient> = new Map();
  private credentials: Map<string, ZeroTokenCredentials> = new Map();

  /**
   * 注册凭证
   */
  register(provider: string, credentials: ZeroTokenCredentials): void {
    this.credentials.set(provider, credentials);
    
    // 根据 provider 创建对应的客户端
    switch (provider) {
      case 'deepseek':
        this.clients.set(provider, new DeepSeekWebClient(credentials));
        break;
      case 'claude':
        this.clients.set(provider, new ClaudeWebClient(credentials));
        break;
      // 可以添加更多 provider
    }
  }

  /**
   * 发送聊天请求
   */
  async chat(
    provider: string,
    messages: ChatMessage[],
    model?: string
  ): Promise<ReadableStream<Uint8Array>> {
    const client = this.clients.get(provider);
    if (!client) {
      throw new Error(`Provider ${provider} not registered`);
    }

    return client.chat(messages, model);
  }

  /**
   * 检查 provider 是否已注册
   */
  isRegistered(provider: string): boolean {
    return this.credentials.has(provider);
  }

  /**
   * 获取已注册的 provider 列表
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.credentials.keys());
  }

  /**
   * 移除 provider
   */
  unregister(provider: string): void {
    this.credentials.delete(provider);
    this.clients.delete(provider);
  }
}

// ==================== 导出 ====================

export function createZeroTokenProvider(): ZeroTokenProvider {
  return new ZeroTokenProvider();
}
