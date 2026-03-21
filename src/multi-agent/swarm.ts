/**
 * OpenClaw 原生多智能体协作系统
 * 
 * 基于 OpenClaw 原生 subagent 能力，不依赖外部工具
 */

import { EventEmitter } from 'events';

// ==================== 类型定义 ====================

export interface AgentRole {
  name: string;
  type: string;
  expertise: string[];
  systemPrompt: string;
  maxConcurrentTasks: number;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  assignedTo?: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: string;
  dependencies?: string[];
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string | 'broadcast';
  type: 'task' | 'result' | 'query' | 'response' | 'status';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface SwarmConfig {
  name: string;
  goal: string;
  roles: AgentRole[];
  maxAgents: number;
  coordinationStrategy: 'centralized' | 'distributed' | 'hierarchical';
}

// ==================== 智能体实例 ====================

class Agent {
  readonly id: string;
  readonly role: AgentRole;
  status: 'idle' | 'busy' | 'offline' = 'idle';
  currentTasks: string[] = [];
  sessionKey?: string;

  constructor(id: string, role: AgentRole) {
    this.id = id;
    this.role = role;
  }

  canAcceptTask(): boolean {
    return this.status !== 'offline' && 
           this.currentTasks.length < this.role.maxConcurrentTasks;
  }

  assignTask(taskId: string): void {
    this.currentTasks.push(taskId);
    this.status = 'busy';
  }

  completeTask(taskId: string): void {
    this.currentTasks = this.currentTasks.filter(id => id !== taskId);
    if (this.currentTasks.length === 0) {
      this.status = 'idle';
    }
  }
}

// ==================== 任务管理器 ====================

class TaskManager {
  private tasks = new Map<string, AgentTask>();

  createTask(task: Omit<AgentTask, 'id' | 'createdAt' | 'status'>): AgentTask {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTask: AgentTask = {
      ...task,
      id,
      status: 'pending',
      createdAt: new Date(),
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  getTask(id: string): AgentTask | undefined {
    return this.tasks.get(id);
  }

  updateTask(id: string, updates: Partial<AgentTask>): void {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates);
    }
  }

  getPendingTasks(): AgentTask[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  getTasksByStatus(status: AgentTask['status']): AgentTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }
}

// ==================== 消息总线 ====================

class MessageBus extends EventEmitter {
  private messages: AgentMessage[] = [];
  private inbox = new Map<string, AgentMessage[]>();

  send(message: Omit<AgentMessage, 'id' | 'timestamp'>): void {
    const fullMessage: AgentMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.messages.push(fullMessage);

    if (message.to === 'broadcast') {
      this.emit('broadcast', fullMessage);
    } else {
      const inbox = this.inbox.get(message.to) || [];
      inbox.push(fullMessage);
      this.inbox.set(message.to, inbox);
      this.emit(`message:${message.to}`, fullMessage);
    }

    this.emit('message', fullMessage);
  }

  getInbox(agentId: string): AgentMessage[] {
    return this.inbox.get(agentId) || [];
  }

  clearInbox(agentId: string): void {
    this.inbox.set(agentId, []);
  }

  getRecentMessages(count = 50): AgentMessage[] {
    return this.messages.slice(-count);
  }
}

// ==================== 智能体协调器 ====================

export class AgentSwarm extends EventEmitter {
  readonly config: SwarmConfig;
  private agents = new Map<string, Agent>();
  private taskManager = new TaskManager();
  private messageBus = new MessageBus();
  private isRunning = false;

  constructor(config: SwarmConfig) {
    super();
    this.config = config;
    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    this.messageBus.on('message', (msg: AgentMessage) => {
      this.emit('message', msg);
    });

    this.messageBus.on('broadcast', (msg: AgentMessage) => {
      // 广播给所有智能体
      for (const agent of this.agents.values()) {
        this.emit(`agent:${agent.id}:message`, msg);
      }
    });
  }

  /**
   * 添加智能体
   */
  addAgent(role: AgentRole): Agent {
    const id = `agent-${role.name}-${Date.now()}`;
    const agent = new Agent(id, role);
    this.agents.set(id, agent);
    this.emit('agent:added', agent);
    return agent;
  }

  /**
   * 移除智能体
   */
  removeAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.emit('agent:removed', agentId);
  }

  /**
   * 分配任务给最合适的智能体
   */
  assignTask(task: AgentTask): Agent | null {
    // 找到能处理此任务的空闲智能体
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.canAcceptTask())
      .sort((a, b) => {
        // 优先选择专业匹配的智能体
        const aExpertise = a.role.expertise.some(e => 
          task.description.toLowerCase().includes(e.toLowerCase())
        );
        const bExpertise = b.role.expertise.some(e => 
          task.description.toLowerCase().includes(e.toLowerCase())
        );
        
        if (aExpertise && !bExpertise) return -1;
        if (!aExpertise && bExpertise) return 1;
        
        // 其次选择任务少的
        return a.currentTasks.length - b.currentTasks.length;
      });

    if (availableAgents.length === 0) {
      return null;
    }

    const selectedAgent = availableAgents[0];
    selectedAgent.assignTask(task.id);
    
    this.taskManager.updateTask(task.id, {
      assignedTo: selectedAgent.id,
      status: 'assigned',
    });

    // 通知智能体
    this.messageBus.send({
      from: 'coordinator',
      to: selectedAgent.id,
      type: 'task',
      content: JSON.stringify(task),
    });

    this.emit('task:assigned', { task, agent: selectedAgent });
    return selectedAgent;
  }

  /**
   * 创建并分配任务
   */
  createTask(taskInfo: Omit<AgentTask, 'id' | 'createdAt' | 'status'>): AgentTask {
    const task = this.taskManager.createTask(taskInfo);
    this.emit('task:created', task);

    // 尝试立即分配
    if (task.status === 'pending') {
      this.assignTask(task);
    }

    return task;
  }

  /**
   * 完成任务
   */
  completeTask(taskId: string, result: string): void {
    const task = this.taskManager.getTask(taskId);
    if (!task || !task.assignedTo) return;

    const agent = this.agents.get(task.assignedTo);
    if (agent) {
      agent.completeTask(taskId);
    }

    this.taskManager.updateTask(taskId, {
      status: 'completed',
      completedAt: new Date(),
      result,
    });

    this.emit('task:completed', { taskId, result });

    // 尝试分配新任务
    this.assignPendingTasks();
  }

  /**
   * 分配所有待处理任务
   */
  private assignPendingTasks(): void {
    const pendingTasks = this.taskManager.getPendingTasks();
    for (const task of pendingTasks) {
      if (task.status === 'pending') {
        this.assignTask(task);
      }
    }
  }

  /**
   * 获取状态
   */
  getStatus(): {
    agents: Array<{ id: string; role: string; status: string; tasks: number }>;
    tasks: { pending: number; assigned: number; inProgress: number; completed: number };
    isRunning: boolean;
  } {
    return {
      agents: Array.from(this.agents.values()).map(a => ({
        id: a.id,
        role: a.role.name,
        status: a.status,
        tasks: a.currentTasks.length,
      })),
      tasks: {
        pending: this.taskManager.getTasksByStatus('pending').length,
        assigned: this.taskManager.getTasksByStatus('assigned').length,
        inProgress: this.taskManager.getTasksByStatus('in-progress').length,
        completed: this.taskManager.getTasksByStatus('completed').length,
      },
      isRunning: this.isRunning,
    };
  }

  /**
   * 启动协调循环
   */
  start(): void {
    this.isRunning = true;
    this.emit('started');
    
    // 定期检查并分配任务
    const interval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      this.assignPendingTasks();
    }, 1000);
  }

  /**
   * 停止协调
   */
  stop(): void {
    this.isRunning = false;
    this.emit('stopped');
  }

  /**
   * 获取消息总线
   */
  getMessageBus(): MessageBus {
    return this.messageBus;
  }

  /**
   * 获取任务管理器
   */
  getTaskManager(): TaskManager {
    return this.taskManager;
  }
}

// ==================== 预定义角色模板 ====================

export const BUILT_IN_ROLES = {
  coordinator: {
    name: 'coordinator',
    type: 'coordinator',
    expertise: ['planning', 'coordination', 'management'],
    systemPrompt: '你是一个团队协调者，负责分配任务、监督进度、整合结果。',
    maxConcurrentTasks: 5,
  },
  coder: {
    name: 'coder',
    type: 'developer',
    expertise: ['coding', 'implementation', 'debugging'],
    systemPrompt: '你是一个专业的开发者，负责编写和优化代码。',
    maxConcurrentTasks: 2,
  },
  reviewer: {
    name: 'reviewer',
    type: 'quality',
    expertise: ['review', 'testing', 'quality-assurance'],
    systemPrompt: '你是一个代码审查专家，负责审查代码质量、安全性和性能。',
    maxConcurrentTasks: 3,
  },
  researcher: {
    name: 'researcher',
    type: 'analysis',
    expertise: ['research', 'analysis', 'documentation'],
    systemPrompt: '你是一个研究员，负责收集信息、分析数据、撰写文档。',
    maxConcurrentTasks: 2,
  },
  security: {
    name: 'security',
    type: 'security',
    expertise: ['security', 'vulnerability', 'audit'],
    systemPrompt: '你是一个安全专家，负责发现和修复安全漏洞。',
    maxConcurrentTasks: 2,
  },
  performance: {
    name: 'performance',
    type: 'optimization',
    expertise: ['performance', 'optimization', 'profiling'],
    systemPrompt: '你是一个性能优化专家，负责分析和优化系统性能。',
    maxConcurrentTasks: 2,
  },
} as const;

// ==================== 工厂函数 ====================

export function createCodeReviewSwarm(goal: string): AgentSwarm {
  const swarm = new AgentSwarm({
    name: 'code-review-swarm',
    goal,
    roles: [
      BUILT_IN_ROLES.coordinator,
      BUILT_IN_ROLES.reviewer,
      BUILT_IN_ROLES.security,
      BUILT_IN_ROLES.performance,
    ],
    maxAgents: 4,
    coordinationStrategy: 'hierarchical',
  });

  // 添加预定义角色
  swarm.addAgent(BUILT_IN_ROLES.coordinator);
  swarm.addAgent(BUILT_IN_ROLES.reviewer);
  swarm.addAgent(BUILT_IN_ROLES.security);
  swarm.addAgent(BUILT_IN_ROLES.performance);

  return swarm;
}

export function createDevelopmentSwarm(goal: string): AgentSwarm {
  const swarm = new AgentSwarm({
    name: 'development-swarm',
    goal,
    roles: [
      BUILT_IN_ROLES.coordinator,
      BUILT_IN_ROLES.coder,
      BUILT_IN_ROLES.reviewer,
      BUILT_IN_ROLES.researcher,
    ],
    maxAgents: 4,
    coordinationStrategy: 'hierarchical',
  });

  swarm.addAgent(BUILT_IN_ROLES.coordinator);
  swarm.addAgent(BUILT_IN_ROLES.coder);
  swarm.addAgent(BUILT_IN_ROLES.reviewer);
  swarm.addAgent(BUILT_IN_ROLES.researcher);

  return swarm;
}
