/**
 * OpenClaw 轻量级资源管理器
 * 
 * 专为小参数模型优化：
 * 1. 简化的资源管理
 * 2. 快速资源分配
 * 3. 低计算开销
 */

export interface Resource {
  id: string;
  type: string;
  allocated: boolean;
  allocatedAt?: Date;
}

export class LightweightResourceManager {
  private resources: Map<string, Resource> = new Map();
  private maxResources: number = 100;

  constructor() {
    console.log('[ResourceManager] 初始化完成');
  }

  /**
   * 注册资源
   */
  register(type: string): string {
    const id = `resource_${Date.now()}`;
    const resource: Resource = {
      id,
      type,
      allocated: false,
    };

    this.resources.set(id, resource);
    return id;
  }

  /**
   * 分配资源
   */
  allocate(id: string): boolean {
    const resource = this.resources.get(id);
    if (!resource || resource.allocated) {
      return false;
    }

    resource.allocated = true;
    resource.allocatedAt = new Date();
    return true;
  }

  /**
   * 释放资源
   */
  release(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      resource.allocated = false;
      resource.allocatedAt = undefined;
    }
  }

  /**
   * 获取可用资源
   */
  getAvailable(type?: string): Resource[] {
    const available: Resource[] = [];
    for (const resource of this.resources.values()) {
      if (!resource.allocated && (!type || resource.type === type)) {
        available.push(resource);
      }
    }
    return available;
  }

  /**
   * 获取统计
   */
  getStats(): { total: number; allocated: number; available: number } {
    let allocated = 0;
    for (const resource of this.resources.values()) {
      if (resource.allocated) allocated++;
    }
    return {
      total: this.resources.size,
      allocated,
      available: this.resources.size - allocated,
    };
  }
}

let globalResourceManager: LightweightResourceManager | null = null;

export function getGlobalResourceManager(): LightweightResourceManager {
  if (!globalResourceManager) {
    globalResourceManager = new LightweightResourceManager();
  }
  return globalResourceManager;
}
