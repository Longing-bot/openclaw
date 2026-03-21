/**
 * OpenClaw 朝廷架构（三省六部制）
 * 
 * 学习 danghuangshang 后原生实现
 * 用古代智慧构建现代 AI 协作系统
 */

// ==================== 类型定义 ====================

export interface Department {
  id: string;
  name: string;
  role: string;
  model: 'fast' | 'powerful';
  skills: string[];
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  department: string;
  status: 'idle' | 'working' | 'reviewing';
  currentTask?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'review' | 'completed' | 'rejected';
  createdAt: number;
  completedAt?: number;
  reviewResult?: 'approved' | 'rejected';
}

// ==================== 三省六部架构 ====================

export const DEPARTMENTS: Record<string, Department> = {
  // 司礼监 - 总管调度
  silijian: {
    id: 'silijian',
    name: '司礼监',
    role: '总管调度',
    model: 'fast',
    skills: ['daily-chat', 'task-assignment', 'report'],
    description: '皇帝近侍，负责日常对话、任务分配、自动汇报'
  },

  // 六部
  bingbu: {
    id: 'bingbu',
    name: '兵部',
    role: '软件工程',
    model: 'powerful',
    skills: ['coding', 'architecture', 'code-review', 'debug'],
    description: '军事武备，负责写代码、架构设计、代码审查、Bug 调试'
  },

  hubu: {
    id: 'hubu',
    name: '户部',
    role: '财务运营',
    model: 'powerful',
    skills: ['cost-analysis', 'budget', 'finance', 'operations'],
    description: '户籍财税，负责成本分析、预算管控、财务运营'
  },

  libu: {
    id: 'libu',
    name: '礼部',
    role: '品牌营销',
    model: 'fast',
    skills: ['copywriting', 'social-media', 'marketing', 'content'],
    description: '礼仪外交，负责文案创作、社媒运营、内容策划'
  },

  gongbu: {
    id: 'gongbu',
    name: '工部',
    role: '运维部署',
    model: 'fast',
    skills: ['devops', 'cicd', 'server', 'deployment'],
    description: '工程营造，负责 DevOps、CI/CD、服务器管理'
  },

  libu2: {
    id: 'libu2',
    name: '吏部',
    role: '项目管理',
    model: 'fast',
    skills: ['project-management', 'task-tracking', 'team'],
    description: '官员选拔，负责项目管理、任务追踪、团队协调'
  },

  xingbu: {
    id: 'xingbu',
    name: '刑部',
    role: '法务合规',
    model: 'fast',
    skills: ['legal', 'compliance', 'contract', 'ip'],
    description: '司法刑狱，负责合同审查、知识产权、合规检查'
  }
};

// ==================== 任务调度器 ====================

class TaskDispatcher {
  private tasks: Map<string, Task> = new Map();

  /**
   * 创建任务
   */
  createTask(title: string, description: string, department: string): Task {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      description,
      assignedTo: department,
      status: 'pending',
      createdAt: Date.now()
    };

    this.tasks.set(task.id, task);
    return task;
  }

  /**
   * 分配任务给部门
   */
  assignTask(taskId: string, department: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.assignedTo = department;
      task.status = 'in-progress';
      return true;
    }
    return false;
  }

  /**
   * 提交审查
   */
  submitForReview(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'review';
      return true;
    }
    return false;
  }

  /**
   * 审查结果
   */
  reviewTask(taskId: string, result: 'approved' | 'rejected'): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.reviewResult = result;
      task.status = result === 'approved' ? 'completed' : 'pending';
      task.completedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取部门任务
   */
  getDepartmentTasks(department: string): Task[] {
    return Array.from(this.tasks.values())
      .filter(t => t.assignedTo === department);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
}

// ==================== 朝廷管理器 ====================

export class DynastyManager {
  private taskDispatcher: TaskDispatcher;
  private agents: Map<string, Agent> = new Map();

  constructor() {
    this.taskDispatcher = new TaskDispatcher();
  }

  /**
   * 创建智能体
   */
  createAgent(name: string, department: string): Agent {
    const agent: Agent = {
      id: `agent-${Date.now()}`,
      name,
      department,
      status: 'idle'
    };

    this.agents.set(agent.id, agent);
    return agent;
  }

  /**
   * 分配任务
   */
  assignTask(title: string, description: string, department: string): Task {
    return this.taskDispatcher.createTask(title, description, department);
  }

  /**
   * 获取部门
   */
  getDepartment(id: string): Department | undefined {
    return DEPARTMENTS[id];
  }

  /**
   * 获取所有部门
   */
  getAllDepartments(): Department[] {
    return Object.values(DEPARTMENTS);
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): Task | undefined {
    return this.taskDispatcher.getTask(taskId);
  }

  /**
   * 获取部门任务
   */
  getDepartmentTasks(department: string): Task[] {
    return this.taskDispatcher.getDepartmentTasks(department);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Task[] {
    return this.taskDispatcher.getAllTasks();
  }

  /**
   * 审查任务
   */
  reviewTask(taskId: string, result: 'approved' | 'rejected'): boolean {
    return this.taskDispatcher.reviewTask(taskId, result);
  }
}

// ==================== 智能调度 ====================

export function autoAssignTask(description: string): string {
  const keywords: Record<string, string[]> = {
    'bingbu': ['代码', '编码', '编程', '开发', 'debug', 'code', '架构'],
    'hubu': ['财务', '成本', '预算', 'finance', 'budget'],
    'libu': ['文案', '营销', '社媒', '内容', 'copywriting', 'marketing'],
    'gongbu': ['运维', '部署', '服务器', 'devops', 'ci/cd'],
    'libu2': ['项目', '管理', '任务', '追踪', 'project', 'management'],
    'xingbu': ['法律', '合同', '合规', 'legal', 'compliance']
  };

  for (const [dept, words] of Object.entries(keywords)) {
    if (words.some(w => description.includes(w))) {
      return dept;
    }
  }

  return 'silijian'; // 默认给司礼监
}

// ==================== 导出 ====================

export function createDynastyManager(): DynastyManager {
  return new DynastyManager();
}
