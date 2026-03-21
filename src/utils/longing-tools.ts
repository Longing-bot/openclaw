/**
 * Longing 实用工具集
 * 
 * 真正有用的功能：任务管理、记忆、状态追踪
 */

// ==================== 任务管理 ====================

export interface TodoItem {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  completedAt?: Date;
}

export class TodoManager {
  private todos: TodoItem[] = [];
  private storageKey = 'longing:todos';

  add(title: string, priority: TodoItem['priority'] = 'medium'): TodoItem {
    const todo: TodoItem = {
      id: `todo-${Date.now()}`,
      title,
      status: 'todo',
      priority,
      createdAt: new Date(),
    };
    this.todos.push(todo);
    return todo;
  }

  start(id: string): void {
    const todo = this.todos.find(t => t.id === id);
    if (todo) todo.status = 'doing';
  }

  complete(id: string): void {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.status = 'done';
      todo.completedAt = new Date();
    }
  }

  getPending(): TodoItem[] {
    return this.todos.filter(t => t.status !== 'done')
      .sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 };
        return p[a.priority] - p[b.priority];
      });
  }

  getTodayCompleted(): TodoItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.todos.filter(t => 
      t.status === 'done' && 
      t.completedAt && 
      t.completedAt >= today
    );
  }

  getSummary(): string {
    const pending = this.getPending();
    const todayDone = this.getTodayCompleted();
    return `待办: ${pending.length} | 今日完成: ${todayDone.length}`;
  }
}

// ==================== 简单记忆 ====================

export interface Memory {
  key: string;
  value: string;
  timestamp: Date;
  tags: string[];
}

export class SimpleMemory {
  private memories: Memory[] = [];
  private maxMemories = 100;

  remember(key: string, value: string, tags: string[] = []): void {
    // 删除旧的记忆
    this.memories = this.memories.filter(m => m.key !== key);
    
    this.memories.push({
      key,
      value,
      timestamp: new Date(),
      tags,
    });

    // 限制数量
    if (this.memories.length > this.maxMemories) {
      this.memories.shift();
    }
  }

  recall(key: string): string | undefined {
    const memory = this.memories.find(m => m.key === key);
    return memory?.value;
  }

  search(query: string): Memory[] {
    const q = query.toLowerCase();
    return this.memories.filter(m => 
      m.key.toLowerCase().includes(q) ||
      m.value.toLowerCase().includes(q) ||
      m.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  getByTag(tag: string): Memory[] {
    return this.memories.filter(m => m.tags.includes(tag));
  }

  getRecent(count = 10): Memory[] {
    return this.memories.slice(-count).reverse();
  }
}

// ==================== 状态追踪 ====================

export interface StatusEntry {
  timestamp: Date;
  action: string;
  details?: string;
}

export class StatusTracker {
  private entries: StatusEntry[] = [];
  private maxEntries = 50;

  log(action: string, details?: string): void {
    this.entries.push({
      timestamp: new Date(),
      action,
      details,
    });

    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getRecent(count = 10): StatusEntry[] {
    return this.entries.slice(-count).reverse();
  }

  getToday(): StatusEntry[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.entries.filter(e => e.timestamp >= today);
  }

  getSummary(): string {
    const today = this.getToday();
    return `今日操作: ${today.length} 次`;
  }
}

// ==================== 全局实例 ====================

let globalTodoManager: TodoManager | null = null;
let globalMemory: SimpleMemory | null = null;
let globalStatusTracker: StatusTracker | null = null;

export function getTodoManager(): TodoManager {
  if (!globalTodoManager) {
    globalTodoManager = new TodoManager();
  }
  return globalTodoManager;
}

export function getMemory(): SimpleMemory {
  if (!globalMemory) {
    globalMemory = new SimpleMemory();
  }
  return globalMemory;
}

export function getStatusTracker(): StatusTracker {
  if (!globalStatusTracker) {
    globalStatusTracker = new StatusTracker();
  }
  return globalStatusTracker;
}
