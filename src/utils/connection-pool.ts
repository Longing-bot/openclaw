/**
 * 连接池优化工具
 * 用于优化OpenClaw的连接管理
 */

export class ConnectionPool<T> {
  private connections: T[] = [];
  private activeConnections = new Set<T>();
  private factory: () => Promise<T>;
  private destroyer: (conn: T) => Promise<void>;
  private maxConnections: number;
  private minConnections: number;

  constructor(
    factory: () => Promise<T>,
    destroyer: (conn: T) => Promise<void>,
    maxConnections: number = 10,
    minConnections: number = 2
  ) {
    this.factory = factory;
    this.destroyer = destroyer;
    this.maxConnections = maxConnections;
    this.minConnections = minConnections;
  }

  /**
   * 初始化连接池
   */
  async initialize(): Promise<void> {
    for (let i = 0; i < this.minConnections; i++) {
      const conn = await this.factory();
      this.connections.push(conn);
    }
  }

  /**
   * 获取连接
   */
  async acquire(): Promise<T> {
    // 如果有空闲连接，直接返回
    if (this.connections.length > 0) {
      const conn = this.connections.pop()!;
      this.activeConnections.add(conn);
      return conn;
    }

    // 如果没有达到最大连接数，创建新连接
    if (this.activeConnections.size < this.maxConnections) {
      const conn = await this.factory();
      this.activeConnections.add(conn);
      return conn;
    }

    // 等待连接释放
    return new Promise((resolve) => {
      const check = () => {
        if (this.connections.length > 0) {
          const conn = this.connections.pop()!;
          this.activeConnections.add(conn);
          resolve(conn);
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  /**
   * 释放连接
   */
  async release(connection: T): Promise<void> {
    this.activeConnections.delete(connection);

    // 如果空闲连接过多，销毁一些
    if (this.connections.length > this.minConnections) {
      await this.destroyer(connection);
    } else {
      this.connections.push(connection);
    }
  }

  /**
   * 销毁连接
   */
  async destroy(connection: T): Promise<void> {
    this.activeConnections.delete(connection);
    const index = this.connections.indexOf(connection);
    if (index > -1) {
      this.connections.splice(index, 1);
    }
    await this.destroyer(connection);
  }

  /**
   * 关闭所有连接
   */
  async close(): Promise<void> {
    const allConnections = [...this.connections, ...this.activeConnections];
    this.connections = [];
    this.activeConnections.clear();

    for (const conn of allConnections) {
      await this.destroyer(conn);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    active: number;
    idle: number;
    max: number;
    min: number;
  } {
    return {
      total: this.connections.length + this.activeConnections.size,
      active: this.activeConnections.size,
      idle: this.connections.length,
      max: this.maxConnections,
      min: this.minConnections,
    };
  }
}

// 导出类型
export type { ConnectionPool };
