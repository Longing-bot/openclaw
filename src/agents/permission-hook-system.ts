/**
 * OpenClaw SuperClaw 权限和钩子系统
 * 
 * 内化自 robota 项目
 * 包括权限管理、钩子系统、流式处理
 */

import { BaseSystem, now, generateId, EventEmitter } from './superclaw-base.js';

// ==================== 类型定义 ====================

export interface Permission {
  id: string;
  name: string;
  description: string;
  type: 'allow' | 'deny';
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  inherits?: string[]; // Role IDs
}

export interface User {
  id: string;
  name: string;
  roles: string[]; // Role IDs
  permissions: string[]; // Direct Permission IDs
}

export interface HookContext {
  event: string;
  timestamp: number;
  data: any;
  result?: any;
  error?: Error;
}

export interface Hook {
  id: string;
  event: string;
  handler: (ctx: HookContext) => Promise<void> | void;
  priority: number;
  enabled: boolean;
}

export interface StreamChunk {
  type: 'start' | 'data' | 'end' | 'error';
  content?: string;
  metadata?: Record<string, any>;
  error?: string;
}

// ==================== 权限管理器 ====================

export class PermissionManager extends BaseSystem {
  readonly name = 'permission-manager';
  
  private permissions = new Map<string, Permission>();
  private roles = new Map<string, Role>();
  private users = new Map<string, User>();

  // 创建权限
  createPermission(params: Omit<Permission, 'id'>): string {
    const id = generateId('perm');
    this.permissions.set(id, { ...params, id });
    return id;
  }

  // 创建角色
  createRole(params: Omit<Role, 'id'>): string {
    const id = generateId('role');
    this.roles.set(id, { ...params, id });
    return id;
  }

  // 创建用户
  createUser(params: Omit<User, 'id'>): string {
    const id = generateId('user');
    this.users.set(id, { ...params, id });
    return id;
  }

  // 检查权限
  hasPermission(userId: string, resource: string, action: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    // 获取用户所有权限
    const userPermissions = this.getUserPermissions(userId);

    // 检查是否有匹配的权限
    for (const permId of userPermissions) {
      const perm = this.permissions.get(permId);
      if (!perm) continue;

      if (perm.resource === resource && perm.action === action) {
        if (perm.type === 'allow') return true;
        if (perm.type === 'deny') return false;
      }

      // 通配符匹配
      if (perm.resource === '*' && perm.action === '*') {
        return perm.type === 'allow';
      }
    }

    return false;
  }

  // 获取用户所有权限（包括继承的）
  private getUserPermissions(userId: string): Set<string> {
    const user = this.users.get(userId);
    if (!user) return new Set();

    const permissions = new Set<string>(user.permissions);

    // 获取角色权限
    for (const roleId of user.roles) {
      const rolePermissions = this.getRolePermissions(roleId);
      for (const permId of rolePermissions) {
        permissions.add(permId);
      }
    }

    return permissions;
  }

  // 获取角色所有权限（包括继承的）
  private getRolePermissions(roleId: string): Set<string> {
    const role = this.roles.get(roleId);
    if (!role) return new Set();

    const permissions = new Set<string>(role.permissions);

    // 获取继承的权限
    if (role.inherits) {
      for (const inheritedRoleId of role.inherits) {
        const inheritedPermissions = this.getRolePermissions(inheritedRoleId);
        for (const permId of inheritedPermissions) {
          permissions.add(permId);
        }
      }
    }

    return permissions;
  }

  // 分配角色给用户
  assignRole(userId: string, roleId: string): boolean {
    const user = this.users.get(userId);
    const role = this.roles.get(roleId);
    if (!user || !role) return false;

    if (!user.roles.includes(roleId)) {
      user.roles.push(roleId);
    }
    return true;
  }

  // 移除用户角色
  removeRole(userId: string, roleId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const index = user.roles.indexOf(roleId);
    if (index === -1) return false;

    user.roles.splice(index, 1);
    return true;
  }

  // 直接分配权限给用户
  assignPermission(userId: string, permissionId: string): boolean {
    const user = this.users.get(userId);
    const perm = this.permissions.get(permissionId);
    if (!user || !perm) return false;

    if (!user.permissions.includes(permissionId)) {
      user.permissions.push(permissionId);
    }
    return true;
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      permissions: this.permissions.size,
      roles: this.roles.size,
      users: this.users.size,
    };
  }

  clear(): void {
    this.permissions.clear();
    this.roles.clear();
    this.users.clear();
  }
}

// ==================== 钩子管理器 ====================

export class HookManager extends BaseSystem {
  readonly name = 'hook-manager';
  
  private hooks = new Map<string, Hook[]>();

  // 注册钩子
  register(event: string, handler: Hook['handler'], priority: number = 0): string {
    const id = generateId('hook');
    const hook: Hook = {
      id,
      event,
      handler,
      priority,
      enabled: true,
    };

    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }

    const eventHooks = this.hooks.get(event)!;
    eventHooks.push(hook);
    eventHooks.sort((a, b) => b.priority - a.priority);

    return id;
  }

  // 注销钩子
  unregister(hookId: string): boolean {
    for (const [event, eventHooks] of this.hooks) {
      const index = eventHooks.findIndex(h => h.id === hookId);
      if (index !== -1) {
        eventHooks.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  // 启用/禁用钩子
  toggle(hookId: string, enabled: boolean): boolean {
    for (const eventHooks of this.hooks.values()) {
      const hook = eventHooks.find(h => h.id === hookId);
      if (hook) {
        hook.enabled = enabled;
        return true;
      }
    }
    return false;
  }

  // 触发钩子
  async trigger(event: string, data: any): Promise<any> {
    const eventHooks = this.hooks.get(event);
    if (!eventHooks) return data;

    const ctx: HookContext = {
      event,
      timestamp: now(),
      data,
    };

    for (const hook of eventHooks) {
      if (!hook.enabled) continue;

      try {
        await hook.handler(ctx);
      } catch (error) {
        ctx.error = error instanceof Error ? error : new Error(String(error));
        console.error(`Hook error (${event}):`, error);
      }
    }

    return ctx.result ?? ctx.data;
  }

  // 获取事件的所有钩子
  getHooks(event: string): Hook[] {
    return this.hooks.get(event) || [];
  }

  getStats(): Record<string, any> {
    let totalHooks = 0;
    for (const hooks of this.hooks.values()) {
      totalHooks += hooks.length;
    }

    return {
      name: this.name,
      events: this.hooks.size,
      totalHooks,
    };
  }

  clear(): void {
    this.hooks.clear();
  }
}

// ==================== 流式处理器 ====================

export class StreamProcessor extends BaseSystem {
  readonly name = 'stream-processor';
  
  private activeStreams = new Map<string, {
    chunks: StreamChunk[];
    callbacks: Array<(chunk: StreamChunk) => void>;
  }>();

  // 创建流
  createStream(streamId?: string): string {
    const id = streamId || generateId('stream');
    this.activeStreams.set(id, {
      chunks: [],
      callbacks: [],
    });
    return id;
  }

  // 订阅流
  subscribe(streamId: string, callback: (chunk: StreamChunk) => void): () => void {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    stream.callbacks.push(callback);

    // 返回取消订阅函数
    return () => {
      const index = stream.callbacks.indexOf(callback);
      if (index !== -1) {
        stream.callbacks.splice(index, 1);
      }
    };
  }

  // 推送数据
  push(streamId: string, chunk: StreamChunk): void {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    stream.chunks.push(chunk);

    // 通知订阅者
    for (const callback of stream.callbacks) {
      try {
        callback(chunk);
      } catch (error) {
        console.error('Stream callback error:', error);
      }
    }

    // 如果是结束或错误，清理流
    if (chunk.type === 'end' || chunk.type === 'error') {
      setTimeout(() => {
        this.activeStreams.delete(streamId);
      }, 1000);
    }
  }

  // 获取流的历史
  getHistory(streamId: string): StreamChunk[] {
    const stream = this.activeStreams.get(streamId);
    return stream ? stream.chunks : [];
  }

  // 关闭流
  close(streamId: string): void {
    this.push(streamId, { type: 'end' });
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      activeStreams: this.activeStreams.size,
    };
  }

  clear(): void {
    this.activeStreams.clear();
  }
}

// ==================== 统一权限钩子系统 ====================

export class SuperClawPermissionHookSystem extends BaseSystem {
  readonly name = 'permission-hook-system';
  
  public permissions: PermissionManager;
  public hooks: HookManager;
  public streams: StreamProcessor;

  constructor() {
    super();
    this.permissions = new PermissionManager();
    this.hooks = new HookManager();
    this.streams = new StreamProcessor();
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      permissions: this.permissions.getStats(),
      hooks: this.hooks.getStats(),
      streams: this.streams.getStats(),
    };
  }

  clear(): void {
    this.permissions.clear();
    this.hooks.clear();
    this.streams.clear();
  }
}

// ==================== 全局实例 ====================

let globalPermissionHookSystem: SuperClawPermissionHookSystem | null = null;

export function getGlobalPermissionHookSystem(): SuperClawPermissionHookSystem {
  if (!globalPermissionHookSystem) {
    globalPermissionHookSystem = new SuperClawPermissionHookSystem();
  }
  return globalPermissionHookSystem;
}

export function resetGlobalPermissionHookSystem(): void {
  globalPermissionHookSystem = null;
}
