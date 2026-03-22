/**
 * OpenClaw 轻量级学习系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的学习算法
 * 2. 快速适应
 * 3. 低计算开销
 */

export interface Experience {
  input: any;
  output: any;
  reward: number;
  timestamp: Date;
}

export class LightweightLearningSystem {
  private experiences: Experience[] = [];
  private learningRate: number = 0.1;

  constructor() {
    console.log('[LearningSystem] 初始化完成');
  }

  /**
   * 记录经验
   */
  record(input: any, output: any, reward: number): void {
    this.experiences.push({
      input,
      output,
      reward,
      timestamp: new Date(),
    });

    // 限制经验数量
    if (this.experiences.length > 1000) {
      this.experiences = this.experiences.slice(-1000);
    }
  }

  /**
   * 学习
   */
  learn(): void {
    if (this.experiences.length < 10) return;

    // 简单学习：计算平均奖励
    const avgReward = this.experiences.reduce((sum, e) => sum + e.reward, 0) / this.experiences.length;

    console.log(`[LearningSystem] 平均奖励: ${avgReward.toFixed(2)}`);
  }

  /**
   * 预测
   */
  predict(input: any): any {
    // 简单预测：找到最相似的经验
    const similar = this.findSimilar(input);
    return similar ? similar.output : null;
  }

  /**
   * 查找相似经验
   */
  private findSimilar(input: any): Experience | null {
    // 简化实现
    return this.experiences.length > 0 ? this.experiences[this.experiences.length - 1] : null;
  }

  /**
   * 获取统计
   */
  getStats(): { experienceCount: number; avgReward: number } {
    const avgReward = this.experiences.length > 0
      ? this.experiences.reduce((sum, e) => sum + e.reward, 0) / this.experiences.length
      : 0;
    return { experienceCount: this.experiences.length, avgReward };
  }
}

let globalLearningSystem: LightweightLearningSystem | null = null;

export function getGlobalLearningSystem(): LightweightLearningSystem {
  if (!globalLearningSystem) {
    globalLearningSystem = new LightweightLearningSystem();
  }
  return globalLearningSystem;
}
