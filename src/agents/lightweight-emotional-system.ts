/**
 * OpenClaw 轻量级情感系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的情感模型
 * 2. 快速情感计算
 * 3. 低计算开销
 */

export interface EmotionalState {
  curiosity: number; // 0-100
  confidence: number; // 0-100
  frustration: number; // 0-100
  satisfaction: number; // 0-100
}

export class LightweightEmotionalSystem {
  private state: EmotionalState = {
    curiosity: 70,
    confidence: 60,
    frustration: 20,
    satisfaction: 50,
  };

  constructor() {
    console.log('[EmotionalSystem] 初始化完成');
  }

  /**
   * 更新情感
   */
  updateEmotion(event: 'success' | 'failure' | 'discovery' | 'challenge'): void {
    switch (event) {
      case 'success':
        this.state.confidence = Math.min(100, this.state.confidence + 10);
        this.state.satisfaction = Math.min(100, this.state.satisfaction + 15);
        this.state.frustration = Math.max(0, this.state.frustration - 5);
        break;
      case 'failure':
        this.state.confidence = Math.max(0, this.state.confidence - 10);
        this.state.frustration = Math.min(100, this.state.frustration + 15);
        break;
      case 'discovery':
        this.state.curiosity = Math.min(100, this.state.curiosity + 10);
        break;
      case 'challenge':
        this.state.curiosity = Math.min(100, this.state.curiosity + 5);
        this.state.frustration = Math.min(100, this.state.frustration + 5);
        break;
    }
  }

  /**
   * 获取情感状态
   */
  getState(): EmotionalState {
    return { ...this.state };
  }

  /**
   * 计算情感影响
   */
  calculateInfluence(): number {
    return (
      this.state.curiosity * 0.3 +
      this.state.confidence * 0.3 -
      this.state.frustration * 0.2 +
      this.state.satisfaction * 0.2
    );
  }

  /**
   * 重置情感
   */
  reset(): void {
    this.state = {
      curiosity: 70,
      confidence: 60,
      frustration: 20,
      satisfaction: 50,
    };
  }
}

let globalEmotionalSystem: LightweightEmotionalSystem | null = null;

export function getGlobalEmotionalSystem(): LightweightEmotionalSystem {
  if (!globalEmotionalSystem) {
    globalEmotionalSystem = new LightweightEmotionalSystem();
  }
  return globalEmotionalSystem;
}
