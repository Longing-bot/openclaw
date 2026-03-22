/**
 * OpenClaw 轻量级对话管理器
 * 
 * 专为小参数模型优化：
 * 1. 简化的对话管理
 * 2. 快速对话切换
 * 3. 低计算开销
 */

export interface Conversation {
  id: string;
  messages: Array<{ role: string; content: string }>;
  context: any;
  createdAt: Date;
  updatedAt: Date;
}

export class LightweightConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  private maxMessages: number = 100;

  constructor() {
    console.log('[ConversationManager] 初始化完成');
  }

  /**
   * 创建对话
   */
  create(): string {
    const id = `conv_${Date.now()}`;
    const conversation: Conversation = {
      id,
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversations.set(id, conversation);
    return id;
  }

  /**
   * 添加消息
   */
  addMessage(id: string, role: string, content: string): void {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error(`对话不存在: ${id}`);
    }

    conversation.messages.push({ role, content });
    conversation.updatedAt = new Date();

    // 限制消息数量
    if (conversation.messages.length > this.maxMessages) {
      conversation.messages.shift();
    }
  }

  /**
   * 获取对话
   */
  get(id: string): Conversation | null {
    return this.conversations.get(id) || null;
  }

  /**
   * 获取最近消息
   */
  getRecentMessages(id: string, count: number = 10): Array<{ role: string; content: string }> {
    const conversation = this.conversations.get(id);
    if (!conversation) return [];

    return conversation.messages.slice(-count);
  }

  /**
   * 更新上下文
   */
  updateContext(id: string, context: any): void {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.context = { ...conversation.context, ...context };
    }
  }

  /**
   * 删除对话
   */
  delete(id: string): void {
    this.conversations.delete(id);
  }

  /**
   * 获取统计
   */
  getStats(): { conversationCount: number; messageCount: number } {
    let messageCount = 0;
    for (const conv of this.conversations.values()) {
      messageCount += conv.messages.length;
    }
    return { conversationCount: this.conversations.size, messageCount };
  }
}

let globalConversationManager: LightweightConversationManager | null = null;

export function getGlobalConversationManager(): LightweightConversationManager {
  if (!globalConversationManager) {
    globalConversationManager = new LightweightConversationManager();
  }
  return globalConversationManager;
}
