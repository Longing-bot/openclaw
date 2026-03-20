/**
 * 技能优化器
 * 用于优化OpenClaw的技能加载和执行
 */

export class SkillOptimizer {
  private static instance: SkillOptimizer;
  private skillCache = new Map<string, any>();
  private executionQueue = new Map<string, any[]>();
  private processingSkills = new Set<string>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): SkillOptimizer {
    if (!SkillOptimizer.instance) {
      SkillOptimizer.instance = new SkillOptimizer();
    }
    return SkillOptimizer.instance;
  }

  /**
   * 优化技能加载
   */
  async optimizeSkillLoad(skillId: string, loader: () => Promise<any>): Promise<any> {
    // 检查缓存
    if (this.skillCache.has(skillId)) {
      return this.skillCache.get(skillId);
    }

    // 加载技能
    const skill = await loader();
    
    // 缓存技能
    this.skillCache.set(skillId, skill);
    
    return skill;
  }

  /**
   * 优化技能执行
   */
  async optimizeSkillExecution(
    skillId: string,
    params: any,
    executor: (params: any) => Promise<any>
  ): Promise<any> {
    // 添加到执行队列
    if (!this.executionQueue.has(skillId)) {
      this.executionQueue.set(skillId, []);
    }
    this.executionQueue.get(skillId)!.push({ params, executor });

    // 检查是否正在处理
    if (this.processingSkills.has(skillId)) {
      return Promise.resolve();
    }

    // 开始处理
    this.processingSkills.add(skillId);
    
    try {
      while (this.executionQueue.get(skillId)!.length > 0) {
        const item = this.executionQueue.get(skillId)!.shift();
        await item.executor(item.params);
      }
    } finally {
      this.processingSkills.delete(skillId);
    }
  }

  /**
   * 优化技能卸载
   */
  optimizeSkillUnload(skillId: string): void {
    this.skillCache.delete(skillId);
    this.executionQueue.delete(skillId);
    this.processingSkills.delete(skillId);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    cachedSkills: number;
    queuedExecutions: number;
    processingSkills: number;
  } {
    let queuedExecutions = 0;
    for (const queue of this.executionQueue.values()) {
      queuedExecutions += queue.length;
    }

    return {
      cachedSkills: this.skillCache.size,
      queuedExecutions,
      processingSkills: this.processingSkills.size,
    };
  }

  /**
   * 清除所有缓存
   */
  clearAllCaches(): void {
    this.skillCache.clear();
    this.executionQueue.clear();
    this.processingSkills.clear();
  }
}

// 导出单例
export const skillOptimizer = SkillOptimizer.getInstance();
