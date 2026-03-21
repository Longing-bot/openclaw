/**
 * OpenClaw Nova 架构（三执行器并行）
 * 
 * 学习优秀架构后原生实现
 * 用现代设计理念构建高效 AI 协作系统
 * 
 * 核心思想：
 * - 三个执行器并行工作
 * - 路由器智能分发任务
 * - 编译器统一整合结果
 */

// ==================== 类型定义 ====================

export interface Executor {
  id: string;
  name: string;
  role: string;
  model: 'fast' | 'powerful';
  skills: string[];
  description: string;
}

export interface NovaAgent {
  id: string;
  executorId: string;
  name: string;
  status: 'idle' | 'busy' | 'error';
  currentTask?: string;
  completedTasks: number;
}

export interface Task {
  id: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  status: 'pending' | 'routing' | 'executing' | 'compiling' | 'completed' | 'failed';
  result?: any;
  createdAt: number;
  completedAt?: number;
}

export interface RouterConfig {
  strategy: 'round-robin' | 'least-loaded' | 'skill-based' | 'priority';
  maxConcurrent: number;
}

// ==================== 三个执行器 ====================

export const EXECUTORS: Executor[] = [
  {
    id: 'nova-fast',
    name: '闪电执行器',
    role: '快速响应，简单任务',
    model: 'fast',
    skills: ['chat', 'search', 'quick-answer'],
    description: '处理简单对话、快速搜索、即时回答',
  },
  {
    id: 'nova-deep',
    name: '深度执行器',
    role: '复杂分析，深度思考',
    model: 'powerful',
    skills: ['analysis', 'reasoning', 'planning'],
    description: '处理复杂分析、逻辑推理、战略规划',
  },
  {
    id: 'nova-creative',
    name: '创意执行器',
    role: '内容创作，创新思考',
    model: 'powerful',
    skills: ['writing', 'coding', 'design'],
    description: '处理内容创作、代码编写、创新设计',
  },
];

// ==================== 任务路由器 ====================

export class NovaRouter {
  private config: RouterConfig;
  private taskQueue: Task[] = [];
  private executorLoads: Map<string, number> = new Map();

  constructor(config: RouterConfig) {
    this.config = config;
    
    // 初始化执行器负载
    for (const executor of EXECUTORS) {
      this.executorLoads.set(executor.id, 0);
    }
  }

  /**
   * 路由任务到最合适的执行器
   */
  route(task: Task): string {
    // 根据任务类型选择策略
    switch (this.config.strategy) {
      case 'skill-based':
        return this.routeBySkill(task);
      case 'least-loaded':
        return this.routeByLoad();
      case 'priority':
        return this.routeByPriority(task);
      default:
        return this.routeRoundRobin();
    }
  }

  /**
   * 基于技能路由
   */
  private routeBySkill(task: Task): string {
    for (const executor of EXECUTORS) {
      if (executor.skills.includes(task.type)) {
        return executor.id;
      }
    }
    // 默认使用深度执行器
    return 'nova-deep';
  }

  /**
   * 基于负载路由
   */
  private routeByLoad(): string {
    let minLoad = Infinity;
    let selectedExecutor = EXECUTORS[0].id;

    for (const [executorId, load] of this.executorLoads.entries()) {
      if (load < minLoad) {
        minLoad = load;
        selectedExecutor = executorId;
      }
    }

    return selectedExecutor;
  }

  /**
   * 基于优先级路由
   */
  private routeByPriority(task: Task): string {
    if (task.priority === 'critical' || task.priority === 'high') {
      return 'nova-deep'; // 高优先级使用深度执行器
    }
    return 'nova-fast'; // 低优先级使用快速执行器
  }

  /**
   * 轮询路由
   */
  private routeRoundRobin(): string {
    const index = Math.floor(Math.random() * EXECUTORS.length);
    return EXECUTORS[index].id;
  }

  /**
   * 更新执行器负载
   */
  updateLoad(executorId: string, delta: number): void {
    const current = this.executorLoads.get(executorId) || 0;
    this.executorLoads.set(executorId, Math.max(0, current + delta));
  }
}

// ==================== 结果编译器 ====================

export class NovaCompiler {
  /**
   * 编译多个执行器的结果
   */
  compile(results: Map<string, any>): any {
    // 如果只有一个结果，直接返回
    if (results.size === 1) {
      return Array.from(results.values())[0];
    }

    // 合并多个结果
    const compiled: any = {
      sources: [],
      combined: {},
      conflicts: [],
    };

    for (const [executorId, result] of results.entries()) {
      compiled.sources.push({
        executor: executorId,
        result,
        timestamp: Date.now(),
      });

      // 合并结果
      if (typeof result === 'object') {
        for (const [key, value] of Object.entries(result)) {
          if (compiled.combined[key] === undefined) {
            compiled.combined[key] = value;
          } else if (compiled.combined[key] !== value) {
            // 记录冲突
            compiled.conflicts.push({
              key,
              values: [compiled.combined[key], value],
              sources: ['previous', executorId],
            });
          }
        }
      }
    }

    return compiled;
  }
}

// ==================== Nova 系统 ====================

export class NovaSystem {
  private router: NovaRouter;
  private compiler: NovaCompiler;
  private agents: Map<string, NovaAgent> = new Map();
  private tasks: Map<string, Task> = new Map();

  constructor(routerConfig?: Partial<RouterConfig>) {
    this.router = new NovaRouter({
      strategy: routerConfig?.strategy || 'skill-based',
      maxConcurrent: routerConfig?.maxConcurrent || 3,
    });
    this.compiler = new NovaCompiler();

    // 初始化代理
    for (const executor of EXECUTORS) {
      this.agents.set(executor.id, {
        id: executor.id,
        executorId: executor.id,
        name: executor.name,
        status: 'idle',
        completedTasks: 0,
      });
    }
  }

  /**
   * 提交任务
   */
  submitTask(task: Omit<Task, 'id' | 'status' | 'createdAt'>): string {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fullTask: Task = {
      ...task,
      id,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.tasks.set(id, fullTask);
    return id;
  }

  /**
   * 分发任务
   */
  dispatchTask(taskId: string): string | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    // 路由任务
    const executorId = this.router.route(task);
    task.assignedTo = executorId;
    task.status = 'routing';

    // 更新代理状态
    const agent = this.agents.get(executorId);
    if (agent) {
      agent.status = 'busy';
      agent.currentTask = taskId;
    }

    // 更新负载
    this.router.updateLoad(executorId, 1);

    return executorId;
  }

  /**
   * 完成任务
   */
  completeTask(taskId: string, result: any): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.result = result;
    task.completedAt = Date.now();

    // 更新代理状态
    const agent = this.agents.get(task.assignedTo!);
    if (agent) {
      agent.status = 'idle';
      agent.currentTask = undefined;
      agent.completedTasks++;
    }

    // 更新负载
    this.router.updateLoad(task.assignedTo!, -1);
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): any {
    const agents = Array.from(this.agents.values());
    const tasks = Array.from(this.tasks.values());

    return {
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        status: a.status,
        completedTasks: a.completedTasks,
      })),
      tasks: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        executing: tasks.filter(t => t.status === 'executing').length,
        completed: tasks.filter(t => t.status === 'completed').length,
      },
    };
  }
}

// ==================== 导出 ====================

export function createNovaSystem(config?: Partial<RouterConfig>): NovaSystem {
  return new NovaSystem(config);
}
