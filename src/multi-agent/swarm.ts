/**
 * OpenClaw 原生多智能体协作（精简版）
 */

export interface AgentRole {
  name: string;
  type: string;
  expertise: string[];
  maxTasks: number;
}

export interface Task {
  id: string;
  title: string;
  assignedTo?: string;
  status: 'pending' | 'assigned' | 'completed';
}

class Agent {
  constructor(
    public id: string,
    public role: AgentRole,
    public status: 'idle' | 'busy' = 'idle',
    public tasks: string[] = []
  ) {}

  canAcceptTask(): boolean {
    return this.status !== 'busy' && this.tasks.length < this.role.maxTasks;
  }
}

export class AgentSwarm {
  private agents = new Map<string, Agent>();
  private tasks = new Map<string, Task>();

  addAgent(role: AgentRole): string {
    const id = `agent-${Date.now()}`;
    this.agents.set(id, new Agent(id, role));
    return id;
  }

  createTask(title: string): Task {
    const id = `task-${Date.now()}`;
    const task: Task = { id, title, status: 'pending' };
    this.tasks.set(id, task);
    this.autoAssign(task);
    return task;
  }

  private autoAssign(task: Task): void {
    const available = [...this.agents.values()]
      .filter(a => a.canAcceptTask())
      .sort((a, b) => a.tasks.length - b.tasks.length)[0];

    if (available) {
      task.assignedTo = available.id;
      task.status = 'assigned';
      available.tasks.push(task.id);
      available.status = 'busy';
    }
  }

  completeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task?.assignedTo) return;

    const agent = this.agents.get(task.assignedTo);
    if (agent) {
      agent.tasks = agent.tasks.filter(id => id !== taskId);
      agent.status = agent.tasks.length > 0 ? 'busy' : 'idle';
    }
    task.status = 'completed';
  }

  getStatus() {
    return {
      agents: [...this.agents.values()].map(a => ({
        id: a.id,
        role: a.role.name,
        status: a.status,
        tasks: a.tasks.length,
      })),
      pendingTasks: [...this.tasks.values()].filter(t => t.status === 'pending').length,
      completedTasks: [...this.tasks.values()].filter(t => t.status === 'completed').length,
    };
  }
}

// 预定义角色
export const BUILT_IN_ROLES = {
  coordinator: { name: 'coordinator', type: 'coordinator', expertise: ['planning'], maxTasks: 5 },
  coder: { name: 'coder', type: 'developer', expertise: ['coding'], maxTasks: 2 },
  reviewer: { name: 'reviewer', type: 'quality', expertise: ['review'], maxTasks: 3 },
} as const;

export function createCodeReviewSwarm(): AgentSwarm {
  const swarm = new AgentSwarm();
  swarm.addAgent(BUILT_IN_ROLES.coordinator);
  swarm.addAgent(BUILT_IN_ROLES.reviewer);
  return swarm;
}
