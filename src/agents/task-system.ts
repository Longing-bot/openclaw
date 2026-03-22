/**
 * OpenClaw SuperClaw 任务管理系统
 * 
 * 内化自 n8n-claw 项目
 * 包括任务管理、提醒系统、项目管理
 */

import { BaseSystem, now, generateId, ManagedArray } from './superclaw-base.js';

// ==================== 类型定义 ====================

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: number;
  createdAt: number;
  completedAt?: number;
  tags?: string[];
  projectId?: string;
  parentTaskId?: string;
  subTasks?: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  createdAt: number;
  updatedAt: number;
  tasks: string[];
  notes: string[];
}

export interface Reminder {
  id: string;
  title: string;
  message: string;
  scheduledAt: number;
  recurring?: {
    interval: number; // 毫秒
    count?: number;
    endDate?: number;
  };
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: number;
  sentAt?: number;
  taskId?: string;
}

export interface ScheduledAction {
  id: string;
  name: string;
  instructions: string;
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
    time?: string; // HH:mm
    dayOfWeek?: number; // 0-6
    dayOfMonth?: number; // 1-31
    cron?: string;
  };
  lastRun?: number;
  nextRun: number;
  active: boolean;
}

// ==================== 任务管理器 ====================

export class TaskManager extends BaseSystem {
  readonly name = 'task-manager';
  
  private tasks = new Map<string, Task>();
  private projects = new Map<string, Project>();

  // 创建任务
  createTask(params: Omit<Task, 'id' | 'status' | 'createdAt'>): string {
    const id = generateId('task');
    const task: Task = {
      ...params,
      id,
      status: 'pending',
      createdAt: now(),
    };
    this.tasks.set(id, task);

    // 如果有项目，添加到项目
    if (task.projectId) {
      const project = this.projects.get(task.projectId);
      if (project) {
        project.tasks.push(id);
        project.updatedAt = now();
      }
    }

    return id;
  }

  // 更新任务
  updateTask(taskId: string, updates: Partial<Task>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    Object.assign(task, updates);
    return true;
  }

  // 完成任务
  completeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = 'completed';
    task.completedAt = now();
    return true;
  }

  // 取消任务
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = 'cancelled';
    return true;
  }

  // 获取任务
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  // 获取所有任务
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  // 按状态获取任务
  getTasksByStatus(status: Task['status']): Task[] {
    return this.getAllTasks().filter(t => t.status === status);
  }

  // 按优先级获取任务
  getTasksByPriority(priority: Task['priority']): Task[] {
    return this.getAllTasks().filter(t => t.priority === priority);
  }

  // 获取逾期任务
  getOverdueTasks(): Task[] {
    const time = now();
    return this.getAllTasks().filter(t => 
      t.status !== 'completed' && 
      t.status !== 'cancelled' && 
      t.dueDate && 
      t.dueDate < time
    );
  }

  // 获取即将到期的任务
  getUpcomingTasks(withinMs: number = 24 * 60 * 60 * 1000): Task[] {
    const time = now();
    const deadline = time + withinMs;
    return this.getAllTasks().filter(t => 
      t.status !== 'completed' && 
      t.status !== 'cancelled' && 
      t.dueDate && 
      t.dueDate >= time && 
      t.dueDate <= deadline
    );
  }

  // 创建项目
  createProject(params: Omit<Project, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'tasks' | 'notes'>): string {
    const id = generateId('project');
    const project: Project = {
      ...params,
      id,
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
      tasks: [],
      notes: [],
    };
    this.projects.set(id, project);
    return id;
  }

  // 获取项目
  getProject(projectId: string): Project | undefined {
    return this.projects.get(projectId);
  }

  // 获取项目的所有任务
  getProjectTasks(projectId: string): Task[] {
    const project = this.projects.get(projectId);
    if (!project) return [];
    return project.tasks.map(id => this.tasks.get(id)).filter(Boolean) as Task[];
  }

  // 添加项目笔记
  addProjectNote(projectId: string, note: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    project.notes.push(note);
    project.updatedAt = now();
    return true;
  }

  getStats(): Record<string, any> {
    const tasks = this.getAllTasks();
    return {
      name: this.name,
      totalTasks: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: this.getOverdueTasks().length,
      projects: this.projects.size,
    };
  }

  clear(): void {
    this.tasks.clear();
    this.projects.clear();
  }
}

// ==================== 提醒管理器 ====================

export class ReminderManager extends BaseSystem {
  readonly name = 'reminder-manager';
  
  private reminders = new Map<string, Reminder>();
  private scheduledActions = new Map<string, ScheduledAction>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private onReminder?: (reminder: Reminder) => void;
  private onScheduledAction?: (action: ScheduledAction) => void;

  constructor() {
    super();
    this.start();
  }

  private start(): void {
    this.timer = setInterval(() => this.check(), 60000); // 每分钟检查
  }

  private check(): void {
    const time = now();

    // 检查提醒
    for (const reminder of this.reminders.values()) {
      if (reminder.status === 'pending' && reminder.scheduledAt <= time) {
        this.sendReminder(reminder);
      }
    }

    // 检查定时动作
    for (const action of this.scheduledActions.values()) {
      if (action.active && action.nextRun <= time) {
        this.executeScheduledAction(action);
      }
    }
  }

  private sendReminder(reminder: Reminder): void {
    reminder.status = 'sent';
    reminder.sentAt = now();

    // 触发回调
    if (this.onReminder) {
      this.onReminder(reminder);
    }

    // 处理重复提醒
    if (reminder.recurring) {
      const nextTime = reminder.scheduledAt + reminder.recurring.interval;
      if (reminder.recurring.endDate && nextTime > reminder.recurring.endDate) {
        return;
      }
      if (reminder.recurring.count && reminder.recurring.count <= 1) {
        return;
      }

      // 创建下一个提醒
      const nextReminder: Reminder = {
        ...reminder,
        id: generateId('reminder'),
        scheduledAt: nextTime,
        status: 'pending',
        createdAt: now(),
        sentAt: undefined,
        recurring: reminder.recurring.count
          ? { ...reminder.recurring, count: reminder.recurring.count - 1 }
          : reminder.recurring,
      };
      this.reminders.set(nextReminder.id, nextReminder);
    }
  }

  private executeScheduledAction(action: ScheduledAction): void {
    action.lastRun = now();
    action.nextRun = this.calculateNextRun(action);

    // 触发回调
    if (this.onScheduledAction) {
      this.onScheduledAction(action);
    }
  }

  private calculateNextRun(action: ScheduledAction): number {
    const time = now();
    const schedule = action.schedule;

    switch (schedule.type) {
      case 'once':
        return Infinity;
      
      case 'daily':
        return time + 24 * 60 * 60 * 1000;
      
      case 'weekly':
        return time + 7 * 24 * 60 * 60 * 1000;
      
      case 'monthly':
        const date = new Date(time);
        date.setMonth(date.getMonth() + 1);
        return date.getTime();
      
      case 'cron':
        // 简化的 cron 解析
        return time + 60 * 60 * 1000; // 默认1小时
      
      default:
        return time + 24 * 60 * 60 * 1000;
    }
  }

  // 设置提醒回调
  setReminderCallback(callback: (reminder: Reminder) => void): void {
    this.onReminder = callback;
  }

  // 设置定时动作回调
  setScheduledActionCallback(callback: (action: ScheduledAction) => void): void {
    this.onScheduledAction = callback;
  }

  // 创建提醒
  createReminder(params: Omit<Reminder, 'id' | 'status' | 'createdAt'>): string {
    const id = generateId('reminder');
    const reminder: Reminder = {
      ...params,
      id,
      status: 'pending',
      createdAt: now(),
    };
    this.reminders.set(id, reminder);
    return id;
  }

  // 创建一次性提醒
  remindIn(title: string, message: string, delayMs: number): string {
    return this.createReminder({
      title,
      message,
      scheduledAt: now() + delayMs,
    });
  }

  // 创建重复提醒
  createRecurringReminder(
    title: string,
    message: string,
    intervalMs: number,
    count?: number
  ): string {
    return this.createReminder({
      title,
      message,
      scheduledAt: now() + intervalMs,
      recurring: {
        interval: intervalMs,
        count,
      },
    });
  }

  // 取消提醒
  cancelReminder(reminderId: string): boolean {
    const reminder = this.reminders.get(reminderId);
    if (!reminder) return false;

    reminder.status = 'cancelled';
    return true;
  }

  // 创建定时动作
  createScheduledAction(params: Omit<ScheduledAction, 'id' | 'lastRun' | 'nextRun'>): string {
    const id = generateId('action');
    const action: ScheduledAction = {
      ...params,
      id,
      nextRun: now(),
    };
    this.scheduledActions.set(id, action);
    return id;
  }

  // 创建每日动作
  createDailyAction(name: string, instructions: string, time: string): string {
    return this.createScheduledAction({
      name,
      instructions,
      schedule: {
        type: 'daily',
        time,
      },
      active: true,
    });
  }

  // 激活/停用定时动作
  toggleScheduledAction(actionId: string, active: boolean): boolean {
    const action = this.scheduledActions.get(actionId);
    if (!action) return false;

    action.active = active;
    return true;
  }

  // 获取所有提醒
  getAllReminders(): Reminder[] {
    return Array.from(this.reminders.values());
  }

  // 获取待发送提醒
  getPendingReminders(): Reminder[] {
    return this.getAllReminders().filter(r => r.status === 'pending');
  }

  // 获取所有定时动作
  getAllScheduledActions(): ScheduledAction[] {
    return Array.from(this.scheduledActions.values());
  }

  // 获取活跃的定时动作
  getActiveScheduledActions(): ScheduledAction[] {
    return this.getAllScheduledActions().filter(a => a.active);
  }

  getStats(): Record<string, any> {
    const reminders = this.getAllReminders();
    const actions = this.getAllScheduledActions();
    return {
      name: this.name,
      totalReminders: reminders.length,
      pendingReminders: reminders.filter(r => r.status === 'pending').length,
      sentReminders: reminders.filter(r => r.status === 'sent').length,
      totalActions: actions.length,
      activeActions: actions.filter(a => a.active).length,
    };
  }

  clear(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.reminders.clear();
    this.scheduledActions.clear();
  }
}

// ==================== 统一任务系统 ====================

export class SuperClawTaskSystem extends BaseSystem {
  readonly name = 'task-system';
  
  public taskManager: TaskManager;
  public reminderManager: ReminderManager;

  constructor() {
    super();
    this.taskManager = new TaskManager();
    this.reminderManager = new ReminderManager();
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      tasks: this.taskManager.getStats(),
      reminders: this.reminderManager.getStats(),
    };
  }

  clear(): void {
    this.taskManager.clear();
    this.reminderManager.clear();
  }
}

// ==================== 全局实例 ====================

let globalTaskSystem: SuperClawTaskSystem | null = null;

export function getGlobalTaskSystem(): SuperClawTaskSystem {
  if (!globalTaskSystem) {
    globalTaskSystem = new SuperClawTaskSystem();
  }
  return globalTaskSystem;
}

export function resetGlobalTaskSystem(): void {
  globalTaskSystem = null;
}
