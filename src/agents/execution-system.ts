/**
 * OpenClaw SuperClaw 执行系统
 * 
 * 合并自：
 * - lightweight-tool-system.ts
 * - lightweight-execution-system.ts
 * - lightweight-resource-manager.ts
 * - lightweight-scheduler.ts
 * - lightweight-timeout-system.ts
 * - lightweight-retry-system.ts
 * 
 * 设计原则：轻量化、高效率、低开销
 */

// ==================== 工具系统 ====================

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: any) => Promise<any>;
}

interface ToolExecution {
  id: string;
  toolName: string;
  params: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export class ExecutionToolSystem {
  private tools = new Map<string, ToolDefinition>();
  private executions: ToolExecution[] = [];

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  async executeTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    const execution: ToolExecution = {
      id: `exec_${Date.now()}`,
      toolName: name,
      params,
      status: 'running',
      startTime: new Date(),
    };

    this.executions.push(execution);

    try {
      const result = await tool.handler(params);
      execution.status = 'completed';
      execution.result = result;
      execution.endTime = new Date();
      return result;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date();
      throw error;
    }
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getExecutions(limit: number = 10): ToolExecution[] {
    return this.executions.slice(-limit);
  }

  clear(): void {
    this.tools.clear();
    this.executions = [];
  }
}

// ==================== 执行系统 ====================

interface Task {
  id: string;
  name: string;
  handler: () => Promise<any>;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export class ExecutionSystem {
  private tasks = new Map<string, Task>();
  private running = new Set<string>();
  private maxConcurrent = 5;

  addTask(name: string, handler: () => Promise<any>, priority: number = 0): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.tasks.set(id, {
      id,
      name,
      handler,
      priority,
      status: 'pending',
    });
    this.processQueue();
    return id;
  }

  private async processQueue(): Promise<void> {
    if (this.running.size >= this.maxConcurrent) return;

    const pending = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending')
      .sort((a, b) => b.priority - a.priority);

    for (const task of pending) {
      if (this.running.size >= this.maxConcurrent) break;
      
      this.running.add(task.id);
      task.status = 'running';
      
      this.executeTask(task).finally(() => {
        this.running.delete(task.id);
        this.processQueue();
      });
    }
  }

  private async executeTask(task: Task): Promise<void> {
    try {
      task.result = await task.handler();
      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
    }
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getStats(): { pending: number; running: number; completed: number; failed: number } {
    const tasks = Array.from(this.tasks.values());
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
    };
  }

  clear(): void {
    this.tasks.clear();
    this.running.clear();
  }
}

// ==================== 资源管理器 ====================

interface Resource {
  id: string;
  type: string;
  allocated: boolean;
  allocatedTo?: string;
  allocatedAt?: Date;
}

export class ExecutionResourceManager {
  private resources = new Map<string, Resource>();

  addResource(id: string, type: string): void {
    this.resources.set(id, { id, type, allocated: false });
  }

  allocate(id: string, allocatedTo: string): boolean {
    const resource = this.resources.get(id);
    if (!resource || resource.allocated) {
      return false;
    }

    resource.allocated = true;
    resource.allocatedTo = allocatedTo;
    resource.allocatedAt = new Date();
    return true;
  }

  release(id: string): boolean {
    const resource = this.resources.get(id);
    if (!resource || !resource.allocated) {
      return false;
    }

    resource.allocated = false;
    resource.allocatedTo = undefined;
    resource.allocatedAt = undefined;
    return true;
  }

  getAvailable(type?: string): Resource[] {
    return Array.from(this.resources.values())
      .filter(r => !r.allocated && (!type || r.type === type));
  }

  getAllocated(): Resource[] {
    return Array.from(this.resources.values())
      .filter(r => r.allocated);
  }

  clear(): void {
    this.resources.clear();
  }
}

// ==================== 调度器 ====================

interface ScheduledTask {
  id: string;
  name: string;
  handler: () => void;
  interval: number;
  lastRun?: Date;
  nextRun: Date;
  active: boolean;
}

export class ExecutionScheduler {
  private tasks = new Map<string, ScheduledTask>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.start();
  }

  schedule(name: string, handler: () => void, interval: number): string {
    const id = `scheduled_${Date.now()}`;
    const task: ScheduledTask = {
      id,
      name,
      handler,
      interval,
      nextRun: new Date(Date.now() + interval),
      active: true,
    };
    this.tasks.set(id, task);
    return id;
  }

  unschedule(id: string): void {
    this.tasks.delete(id);
  }

  private start(): void {
    this.timer = setInterval(() => this.tick(), 1000);
  }

  private tick(): void {
    const now = new Date();
    
    for (const task of this.tasks.values()) {
      if (task.active && now >= task.nextRun) {
        try {
          task.handler();
          task.lastRun = now;
          task.nextRun = new Date(now.getTime() + task.interval);
        } catch (error) {
          console.error(`Scheduled task error: ${task.name}`, error);
        }
      }
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  clear(): void {
    this.stop();
    this.tasks.clear();
  }
}

// ==================== 超时系统 ====================

interface TimeoutTask {
  id: string;
  handler: () => void;
  expiresAt: Date;
  timeout: ReturnType<typeof setTimeout>;
}

export class ExecutionTimeoutSystem {
  private timeouts = new Map<string, TimeoutTask>();

  set(handler: () => void, delay: number): string {
    const id = `timeout_${Date.now()}`;
    const timeout = setTimeout(() => {
      handler();
      this.timeouts.delete(id);
    }, delay);

    this.timeouts.set(id, {
      id,
      handler,
      expiresAt: new Date(Date.now() + delay),
      timeout,
    });

    return id;
  }

  cancel(id: string): boolean {
    const task = this.timeouts.get(id);
    if (!task) return false;

    clearTimeout(task.timeout);
    this.timeouts.delete(id);
    return true;
  }

  clear(): void {
    for (const task of this.timeouts.values()) {
      clearTimeout(task.timeout);
    }
    this.timeouts.clear();
  }
}

// ==================== 重试系统 ====================

interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff: number;
}

export class ExecutionRetrySystem {
  async retry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const opts: RetryOptions = {
      maxAttempts: options.maxAttempts ?? 3,
      delay: options.delay ?? 1000,
      backoff: options.backoff ?? 2,
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < opts.maxAttempts) {
          const delay = opts.delay * Math.pow(opts.backoff, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

// ==================== 统一执行系统 ====================

export class SuperClawExecutionSystem {
  public tools: ExecutionToolSystem;
  public executor: ExecutionSystem;
  public resources: ExecutionResourceManager;
  public scheduler: ExecutionScheduler;
  public timeout: ExecutionTimeoutSystem;
  public retry: ExecutionRetrySystem;

  constructor() {
    this.tools = new ExecutionToolSystem();
    this.executor = new ExecutionSystem();
    this.resources = new ExecutionResourceManager();
    this.scheduler = new ExecutionScheduler();
    this.timeout = new ExecutionTimeoutSystem();
    this.retry = new ExecutionRetrySystem();
  }

  async executeWithRetry<T>(
    name: string,
    fn: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    return this.retry.retry(fn, { maxAttempts });
  }

  scheduleTask(name: string, handler: () => void, interval: number): string {
    return this.scheduler.schedule(name, handler, interval);
  }

  getStats(): Record<string, any> {
    return {
      tools: this.tools.listTools().length,
      executor: this.executor.getStats(),
      resources: this.resources.getAvailable().length,
    };
  }

  clear(): void {
    this.tools.clear();
    this.executor.clear();
    this.resources.clear();
    this.scheduler.clear();
    this.timeout.clear();
  }
}

// ==================== 全局实例 ====================

let globalExecutionSystem: SuperClawExecutionSystem | null = null;

export function getGlobalExecutionSystem(): SuperClawExecutionSystem {
  if (!globalExecutionSystem) {
    globalExecutionSystem = new SuperClawExecutionSystem();
  }
  return globalExecutionSystem;
}

export function resetGlobalExecutionSystem(): void {
  globalExecutionSystem = null;
}
