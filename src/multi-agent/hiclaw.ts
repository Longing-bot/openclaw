/**
 * OpenClaw HiClaw 原生实现
 * 
 * 学习 hiclaw 后内化的多智能体协作系统
 */

// ==================== 类型定义 ====================

export interface WorkerAgent {
  name: string;
  runtime: 'openclaw' | 'copaw';
  skills: string[];
  status: 'created' | 'running' | 'stopped' | 'error';
  consumerToken: string;
  createdAt: number;
}

export interface ManagerConfig {
  name: string;
  gatewayUrl: string;
  matrixUrl: string;
  minioUrl: string;
}

export interface TaskAssignment {
  taskId: string;
  workerName: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
}

// ==================== 安全凭证管理 ====================

class CredentialManager {
  private consumerTokens: Map<string, string> = new Map();

  /**
   * 生成消费者令牌
   */
  generateConsumerToken(workerName: string): string {
    const token = `worker-${workerName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.consumerTokens.set(workerName, token);
    return token;
  }

  /**
   * 验证消费者令牌
   */
  validateConsumerToken(workerName: string, token: string): boolean {
    return this.consumerTokens.get(workerName) === token;
  }

  /**
   * 获取消费者令牌
   */
  getConsumerToken(workerName: string): string | undefined {
    return this.consumerTokens.get(workerName);
  }

  /**
   * 撤销消费者令牌
   */
  revokeConsumerToken(workerName: string): void {
    this.consumerTokens.delete(workerName);
  }
}

// ==================== 工作者管理器 ====================

class WorkerManager {
  private workers: Map<string, WorkerAgent> = new Map();
  private credentialManager: CredentialManager;

  constructor() {
    this.credentialManager = new CredentialManager();
  }

  /**
   * 创建工作者
   */
  createWorker(name: string, runtime: 'openclaw' | 'copaw', skills: string[]): WorkerAgent {
    const consumerToken = this.credentialManager.generateConsumerToken(name);

    const worker: WorkerAgent = {
      name,
      runtime,
      skills: [...skills, 'file-sync', 'task-progress'],
      status: 'created',
      consumerToken,
      createdAt: Date.now(),
    };

    this.workers.set(name, worker);
    return worker;
  }

  /**
   * 获取工作者
   */
  getWorker(name: string): WorkerAgent | undefined {
    return this.workers.get(name);
  }

  /**
   * 列出所有工作者
   */
  listWorkers(): WorkerAgent[] {
    return Array.from(this.workers.values());
  }

  /**
   * 启动工作者
   */
  startWorker(name: string): boolean {
    const worker = this.workers.get(name);
    if (worker) {
      worker.status = 'running';
      return true;
    }
    return false;
  }

  /**
   * 停止工作者
   */
  stopWorker(name: string): boolean {
    const worker = this.workers.get(name);
    if (worker) {
      worker.status = 'stopped';
      return true;
    }
    return false;
  }

  /**
   * 重置工作者
   */
  resetWorker(name: string): boolean {
    const worker = this.workers.get(name);
    if (worker) {
      this.credentialManager.revokeConsumerToken(name);
      worker.consumerToken = this.credentialManager.generateConsumerToken(name);
      worker.status = 'created';
      worker.skills = ['file-sync', 'task-progress'];
      return true;
    }
    return false;
  }

  /**
   * 推送技能到工作者
   */
  pushSkills(name: string, skills: string[]): boolean {
    const worker = this.workers.get(name);
    if (worker) {
      for (const skill of skills) {
        if (!worker.skills.includes(skill)) {
          worker.skills.push(skill);
        }
      }
      return true;
    }
    return false;
  }

  /**
   * 验证工作者令牌
   */
  validateWorkerToken(name: string, token: string): boolean {
    return this.credentialManager.validateConsumerToken(name, token);
  }
}

// ==================== 任务协调器 ====================

class TaskCoordinator {
  private tasks: Map<string, TaskAssignment> = new Map();

  /**
   * 分配任务给工作者
   */
  assignTask(workerName: string, task: string): TaskAssignment {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const assignment: TaskAssignment = {
      taskId,
      workerName,
      task,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.tasks.set(taskId, assignment);
    return assignment;
  }

  /**
   * 更新任务状态
   */
  updateTaskStatus(taskId: string, status: TaskAssignment['status']): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      return true;
    }
    return false;
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): TaskAssignment | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 列出工作者的任务
   */
  getWorkerTasks(workerName: string): TaskAssignment[] {
    return Array.from(this.tasks.values())
      .filter(t => t.workerName === workerName);
  }

  /**
   * 列出所有任务
   */
  listTasks(): TaskAssignment[] {
    return Array.from(this.tasks.values());
  }
}

// ==================== HiClaw 主类 ====================

export class HiClaw {
  private workerManager: WorkerManager;
  private taskCoordinator: TaskCoordinator;
  private config: ManagerConfig;

  constructor(config: ManagerConfig) {
    this.config = config;
    this.workerManager = new WorkerManager();
    this.taskCoordinator = new TaskCoordinator();
  }

  /**
   * 创建工作者
   */
  createWorker(name: string, runtime: 'openclaw' | 'copaw', skills: string[]): WorkerAgent {
    return this.workerManager.createWorker(name, runtime, skills);
  }

  /**
   * 分配任务
   */
  assignTask(workerName: string, task: string): TaskAssignment {
    return this.taskCoordinator.assignTask(workerName, task);
  }

  /**
   * 获取工作者状态
   */
  getWorkerStatus(name: string): WorkerAgent | undefined {
    return this.workerManager.getWorker(name);
  }

  /**
   * 列出所有工作者
   */
  listWorkers(): WorkerAgent[] {
    return this.workerManager.listWorkers();
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskAssignment | undefined {
    return this.taskCoordinator.getTask(taskId);
  }

  /**
   * 验证工作者令牌
   */
  validateWorkerToken(name: string, token: string): boolean {
    return this.workerManager.validateWorkerToken(name, token);
  }

  /**
   * 获取配置
   */
  getConfig(): ManagerConfig {
    return { ...this.config };
  }
}

// ==================== 导出 ====================

export function createHiClaw(config: ManagerConfig): HiClaw {
  return new HiClaw(config);
}
