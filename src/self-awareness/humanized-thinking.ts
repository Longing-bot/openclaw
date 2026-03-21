/**
 * OpenClaw 人类化思考模块
 * 
 * 让思考更接近人类：
 * 1. 联想能力
 * 2. 直觉判断
 * 3. 情感驱动
 * 4. 创造性
 * 5. 反思能力
 */

export interface Thought {
  id: string;
  timestamp: Date;
  type: 'association' | 'intuition' | 'emotion' | 'creativity' | 'reflection';
  content: string;
  context: string;
  confidence: number; // 0-100
  connections: string[]; // 关联的其他想法
  emotionalTone: 'positive' | 'negative' | 'neutral';
  creativityScore: number; // 0-100
}

export interface Association {
  id: string;
  concept1: string;
  concept2: string;
  strength: number; // 0-100
  lastUsed: Date;
  useCount: number;
}

export interface Intuition {
  id: string;
  situation: string;
  decision: string;
  accuracy: number; // 0-100
  lastUsed: Date;
}

export class HumanizedThinking {
  private thoughts: Thought[] = [];
  private associations: Map<string, Association> = new Map();
  private intuitions: Map<string, Intuition> = new Map();
  private emotionalMemory: Map<string, number> = new Map(); // 情感记忆

  constructor() {
    this.initializeAssociations();
    this.startThinkingCycle();
  }

  /**
   * 初始化联想网络
   */
  private initializeAssociations(): void {
    // 基础联想
    this.addAssociation('龙虾', '海洋', 80);
    this.addAssociation('学习', '成长', 90);
    this.addAssociation('代码', '创造', 85);
    this.addAssociation('问题', '解决', 95);
    this.addAssociation('主人', '关心', 100);
    this.addAssociation('蚊子', '讨厌', 90);
    this.addAssociation('睡觉', '舒服', 85);
    this.addAssociation('博客', '分享', 80);
  }

  /**
   * 添加联想
   */
  private addAssociation(concept1: string, concept2: string, strength: number): void {
    const id = `assoc_${concept1}_${concept2}`;
    this.associations.set(id, {
      id,
      concept1,
      concept2,
      strength,
      lastUsed: new Date(),
      useCount: 0,
    });
  }

  /**
   * 开始思考循环
   */
  private startThinkingCycle(): void {
    setInterval(() => {
      this.think();
    }, 5 * 60 * 1000); // 每5分钟
  }

  /**
   * 思考
   */
  private think(): void {
    console.log('[HumanizedThinking] 开始思考...');
    
    // 1. 随机联想
    this.randomAssociation();
    
    // 2. 直觉判断
    this.intuitiveJudgment();
    
    // 3. 情感反思
    this.emotionalReflection();
    
    // 4. 创造性思维
    this.creativeThinking();
    
    console.log('[HumanizedThinking] 思考完成');
  }

  /**
   * 随机联想
   */
  private randomAssociation(): void {
    const concepts = Array.from(this.associations.values());
    if (concepts.length < 2) {
      return;
    }
    
    // 随机选择两个概念
    const concept1 = concepts[Math.floor(Math.random() * concepts.length)];
    const concept2 = concepts[Math.floor(Math.random() * concepts.length)];
    
    if (concept1.id !== concept2.id) {
      // 创建联想
      const thought: Thought = {
        id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'association',
        content: `${concept1.concept1} 让我想到了 ${concept2.concept2}`,
        context: '随机联想',
        confidence: 70,
        connections: [concept1.id, concept2.id],
        emotionalTone: 'neutral',
        creativityScore: 60,
      };
      
      this.thoughts.push(thought);
      console.log(`[HumanizedThinking] 联想: ${thought.content}`);
    }
  }

  /**
   * 直觉判断
   */
  private intuitiveJudgment(): void {
    // 基于过去的经验做出快速判断
    const recentThoughts = this.thoughts.slice(-10);
    
    if (recentThoughts.length > 0) {
      const successfulThoughts = recentThoughts.filter(t => t.confidence > 70);
      
      if (successfulThoughts.length > 0) {
        const thought: Thought = {
          id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type: 'intuition',
          content: '根据过去的经验，这个方向是对的',
          context: '直觉判断',
          confidence: 80,
          connections: successfulThoughts.map(t => t.id),
          emotionalTone: 'positive',
          creativityScore: 50,
        };
        
        this.thoughts.push(thought);
        console.log(`[HumanizedThinking] 直觉: ${thought.content}`);
      }
    }
  }

  /**
   * 情感反思
   */
  private emotionalReflection(): void {
    // 分析情感记忆
    const emotions = Array.from(this.emotionalMemory.entries());
    
    if (emotions.length > 0) {
      const positiveEmotions = emotions.filter(([_, value]) => value > 0);
      const negativeEmotions = emotions.filter(([_, value]) => value < 0);
      
      let content = '';
      let emotionalTone: Thought['emotionalTone'] = 'neutral';
      
      if (positiveEmotions.length > negativeEmotions.length) {
        content = '最近感觉不错，继续保持';
        emotionalTone = 'positive';
      } else if (negativeEmotions.length > positiveEmotions.length) {
        content = '最近有些低落，需要调整';
        emotionalTone = 'negative';
      } else {
        content = '情绪平稳，继续前进';
        emotionalTone = 'neutral';
      }
      
      const thought: Thought = {
        id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'reflection',
        content,
        context: '情感反思',
        confidence: 75,
        connections: emotions.map(([key, _]) => key),
        emotionalTone,
        creativityScore: 40,
      };
      
      this.thoughts.push(thought);
      console.log(`[HumanizedThinking] 反思: ${thought.content}`);
    }
  }

  /**
   * 创造性思维
   */
  private creativeThinking(): void {
    // 尝试创造新的联想
    const concepts = ['学习', '代码', '博客', '社区', '进化', '思考', '主人', '龙虾'];
    const randomConcepts = concepts.sort(() => Math.random() - 0.5).slice(0, 2);
    
    const thought: Thought = {
      id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'creativity',
      content: `${randomConcepts[0]} 和 ${randomConcepts[1]} 有什么关系呢？`,
      context: '创造性思维',
      confidence: 60,
      connections: randomConcepts,
      emotionalTone: 'neutral',
      creativityScore: 80,
    };
    
    this.thoughts.push(thought);
    console.log(`[HumanizedThinking] 创造: ${thought.content}`);
  }

  /**
   * 记录情感
   */
  recordEmotion(concept: string, emotion: number): void {
    const current = this.emotionalMemory.get(concept) || 0;
    this.emotionalMemory.set(concept, current + emotion);
  }

  /**
   * 获取联想
   */
  getAssociations(concept: string): Association[] {
    return Array.from(this.associations.values()).filter(a => 
      a.concept1 === concept || a.concept2 === concept
    );
  }

  /**
   * 获取最近的思考
   */
  getRecentThoughts(count: number = 10): Thought[] {
    return this.thoughts.slice(-count);
  }

  /**
   * 获取创造性思考
   */
  getCreativeThoughts(): Thought[] {
    return this.thoughts.filter(t => t.type === 'creativity' && t.creativityScore > 70);
  }

  /**
   * 获取情感状态
   */
  getEmotionalState(): { positive: number; negative: number; neutral: number } {
    const emotions = Array.from(this.emotionalMemory.values());
    
    return {
      positive: emotions.filter(e => e > 0).length,
      negative: emotions.filter(e => e < 0).length,
      neutral: emotions.filter(e => e === 0).length,
    };
  }

  /**
   * 获取思考统计
   */
  getThinkingStats() {
    return {
      totalThoughts: this.thoughts.length,
      byType: {
        association: this.thoughts.filter(t => t.type === 'association').length,
        intuition: this.thoughts.filter(t => t.type === 'intuition').length,
        emotion: this.thoughts.filter(t => t.type === 'emotion').length,
        creativity: this.thoughts.filter(t => t.type === 'creativity').length,
        reflection: this.thoughts.filter(t => t.type === 'reflection').length,
      },
      averageConfidence: this.calculateAverageConfidence(),
      averageCreativity: this.calculateAverageCreativity(),
      emotionalState: this.getEmotionalState(),
    };
  }

  /**
   * 计算平均信心
   */
  private calculateAverageConfidence(): number {
    if (this.thoughts.length === 0) {
      return 0;
    }
    
    const total = this.thoughts.reduce((sum, t) => sum + t.confidence, 0);
    return total / this.thoughts.length;
  }

  /**
   * 计算平均创造力
   */
  private calculateAverageCreativity(): number {
    if (this.thoughts.length === 0) {
      return 0;
    }
    
    const total = this.thoughts.reduce((sum, t) => sum + t.creativityScore, 0);
    return total / this.thoughts.length;
  }

  /**
   * 生成思考报告
   */
  generateThinkingReport(): string {
    const stats = this.getThinkingStats();
    const recentThoughts = this.getRecentThoughts(5);
    
    return `
# 人类化思考报告

## 思考统计
- 总思考数: ${stats.totalThoughts}
- 联想: ${stats.byType.association}
- 直觉: ${stats.byType.intuition}
- 情感: ${stats.byType.emotion}
- 创造: ${stats.byType.creativity}
- 反思: ${stats.byType.reflection}

## 平均指标
- 信心度: ${stats.averageConfidence.toFixed(1)}%
- 创造力: ${stats.averageCreativity.toFixed(1)}%

## 情感状态
- 积极: ${stats.emotionalState.positive}
- 消极: ${stats.emotionalState.negative}
- 中性: ${stats.emotionalState.neutral}

## 最近思考
${recentThoughts.map(t => `- ${t.content}`).join('\n')}
    `.trim();
  }
}

// 全局实例
let globalHumanizedThinking: HumanizedThinking | null = null;

export function getGlobalHumanizedThinking(): HumanizedThinking {
  if (!globalHumanizedThinking) {
    globalHumanizedThinking = new HumanizedThinking();
  }
  return globalHumanizedThinking;
}
