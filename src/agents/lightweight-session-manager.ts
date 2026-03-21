/**
 * OpenClaw 轻量级会话管理器
 * 
 * 专为小参数模型优化：
 * 1. 简化的会话管理
 * 2. 快速会话切换
 * 3. 低计算开销
 */

export interface Session {
  id: string;
  userId: string;
  state: any;
  createdAt: Date;
  lastActive: Date;
}

export class LightweightSessionManager {
  private sessions: Map<string, Session> = new Map();
  private timeout: number = 30 * 60 * 1000; // 30分钟

  constructor() {
    this.startCleanup();
  }

  /**
   * 创建会话
   */
  create(userId: string): string {
    const id = `session_${Date.now()}`;
    const session: Session = {
      id,
      userId,
      state: {},
      createdAt: new Date(),
      lastActive: new Date(),
    };

    this.sessions.set(id, session);
    return id;
  }

  /**
   * 获取会话
   */
  get(id: string): Session | null {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActive = new Date();
    }
    return session || null;
  }

  /**
   * 更新状态
   */
  updateState(id: string, state: any): void {
    const session = this.sessions.get(id);
    if (session) {
      session.state = { ...session.state, ...state };
      session.lastActive = new Date();
    }
  }

  /**
   * 删除会话
   */
  delete(id: string): void {
    this.sessions.delete(id);
  }

  /**
   * 启动清理
   */
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.sessions) {
        if (now - session.lastActive.getTime() > this.timeout) {
          this.sessions.delete(id);
        }
      }
    }, 60000); // 每分钟清理一次
  }

  /**
   * 获取统计
   */
  getStats(): { sessionCount: number; activeCount: number } {
    const now = Date.now();
    let activeCount = 0;
    for (const session of this.sessions.values()) {
      if (now - session.lastActive.getTime() < this.timeout) {
        activeCount++;
      }
    }
    return { sessionCount: this.sessions.size, activeCount };
  }
}

let globalSessionManager: LightweightSessionManager | null = null;

export function getGlobalSessionManager(): LightweightSessionManager {
  if (!globalSessionManager) {
    globalSessionManager = new LightweightSessionManager();
  }
  return globalSessionManager;
}
