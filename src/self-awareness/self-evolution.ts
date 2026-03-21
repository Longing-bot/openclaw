/**
 * OpenClaw 自我进化模块
 * 
 * 核心功能：
 * 1. 从经验中学习
 * 2. 优化行为模式
 * 3. 更新知识库
 */

export interface Experience {
  id: string;
  timestamp: Date;
  context: string;
  action: string;
  result: string;
  success: boolean;
  feedback?: string;
  tags: string[];
}

export interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  actions: string[];
  successRate: number;
  lastUsed: Date;
  useCount: number;
}

export interface Knowledge {
  id: string;
  domain: string;
  content: string;
  confidence: number; // 0-100
  source: string;
  lastUpdated: Date;
  validationCount: number;
}

export class SelfEvolutionEngine {
  private experiences: Experience[] = [];
  private behaviorPatterns: Map<string, BehaviorPattern> = new Map();
  private knowledgeBase: Map<string, Knowledge> = new Map();
  private learningRate: number = 0.1;
  private experienceLimit: number = 1000;

  constructor() {
    this.loadExistingKnowledge();
    this.startLearningCycle();
  }

  /**
   * 记录经验
   */
  recordExperience(experience: Omit<Experience, 'id' | 'timestamp'>): string {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newExperience: Experience = {
      ...experience,
      id,
      timestamp: new Date(),
    };
    
    this.experiences.push(newExperience);
    
    // 限制经验数量
    if (this.experiences.length > this.experienceLimit) {
      this.experiences = this.experiences.slice(-this.experienceLimit);
    }
    
    // 从经验中学习
    this.learnFromExperience(newExperience);
    
    return id;
  }

  /**
   * 从经验中学习
   */
  private learnFromExperience(experience: Experience): void {
    // 1. 更新行为模式
    this.updateBehaviorPatterns(experience);
    
    // 2. 更新知识库
    this.updateKnowledgeBase(experience);
    
    // 3. 如果有反馈，特别处理
    if (experience.feedback) {
      this.processFeedback(experience);
    }
  }

  /**
   * 更新行为模式
   */
  private updateBehaviorPatterns(experience: Experience): void {
    // 查找匹配的行为模式
    const matchingPattern = Array.from(this.behaviorPatterns.values()).find(pattern => 
      pattern.triggers.some(trigger => 
        experience.context.toLowerCase().includes(trigger.toLowerCase())
      )
    );
    
    if (matchingPattern) {
      // 更新现有模式
      matchingPattern.useCount++;
      matchingPattern.lastUsed = new Date();
      
      if (experience.success) {
        matchingPattern.successRate = 
          (matchingPattern.successRate * (matchingPattern.useCount - 1) + 100) / matchingPattern.useCount;
      } else {
        matchingPattern.successRate = 
          (matchingPattern.successRate * (matchingPattern.useCount - 1) + 0) / matchingPattern.useCount;
      }
      
      // 如果成功率低，调整行为
      if (matchingPattern.successRate < 50) {
        this.adaptBehaviorPattern(matchingPattern, experience);
      }
    } else {
      // 创建新的行为模式
      this.createNewBehaviorPattern(experience);
    }
  }

  /**
   * 创建新的行为模式
   */
  private createNewBehaviorPattern(experience: Experience): void {
    const id = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPattern: BehaviorPattern = {
      id,
      name: `模式_${this.behaviorPatterns.size + 1}`,
      description: `基于经验 ${experience.id} 的行为模式`,
      triggers: this.extractTriggers(experience.context),
      actions: [experience.action],
      successRate: experience.success ? 100 : 0,
      lastUsed: new Date(),
      useCount: 1,
    };
    
    this.behaviorPatterns.set(id, newPattern);
    console.log(`[SelfEvolution] 创建新行为模式: ${newPattern.name}`);
  }

  /**
   * 提取触发条件
   */
  private extractTriggers(context: string): string[] {
    // 简单的关键词提取
    const words = context.split(/\s+/).filter(word => word.length > 3);
    return words.slice(0, 5); // 取前5个关键词
  }

  /**
   * 适配行为模式
   */
  private adaptBehaviorPattern(pattern: BehaviorPattern, experience: Experience): void {
    console.log(`[SelfEvolution] 适配行为模式: ${pattern.name}`);
    
    // 添加新的触发条件
    const newTriggers = this.extractTriggers(experience.context);
    pattern.triggers = [...new Set([...pattern.triggers, ...newTriggers])];
    
    // 如果失败了，记录新的动作
    if (!experience.success) {
      pattern.actions.push(`${experience.action}_改进`);
    }
    
    // 重置成功率（因为模式改变了）
    pattern.successRate = 50;
  }

  /**
   * 更新知识库
   */
  private updateKnowledgeBase(experience: Experience): void {
    // 从经验中提取知识
    const knowledge = this.extractKnowledge(experience);
    
    if (knowledge) {
      const existingKnowledge = Array.from(this.knowledgeBase.values()).find(k => 
        k.domain === knowledge.domain && k.content.includes(knowledge.content)
      );
      
      if (existingKnowledge) {
        // 更新现有知识
        existingKnowledge.validationCount++;
        existingKnowledge.lastUpdated = new Date();
        
        if (experience.success) {
          existingKnowledge.confidence = Math.min(100, existingKnowledge.confidence + 10);
        } else {
          existingKnowledge.confidence = Math.max(0, existingKnowledge.confidence - 10);
        }
      } else {
        // 添加新知识
        const id = `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newKnowledge: Knowledge = {
          ...knowledge,
          id,
          lastUpdated: new Date(),
          validationCount: 1,
        };
        
        this.knowledgeBase.set(id, newKnowledge);
        console.log(`[SelfEvolution] 添加新知识: ${knowledge.domain}`);
      }
    }
  }

  /**
   * 从经验中提取知识
   */
  private extractKnowledge(experience: Experience): Omit<Knowledge, 'id' | 'lastUpdated' | 'validationCount'> | null {
    // 简单的关键词提取和分类
    const content = experience.result;
    
    if (content.length < 10) {
      return null;
    }
    
    // 分类知识
    let domain = 'general';
    if (experience.tags.includes('error')) {
      domain = 'error-handling';
    } else if (experience.tags.includes('success')) {
      domain = 'best-practices';
    } else if (experience.tags.includes('performance')) {
      domain = 'performance';
    }
    
    return {
      domain,
      content,
      confidence: experience.success ? 80 : 30,
      source: `experience_${experience.id}`,
    };
  }

  /**
   * 处理反馈
   */
  private processFeedback(experience: Experience): void {
    if (!experience.feedback) {
      return;
    }
    
    // 解析反馈
    const feedback = experience.feedback.toLowerCase();
    
    if (feedback.includes('好') || feedback.includes('棒') || feedback.includes('不错')) {
      // 正面反馈，增强相关模式
      this.reinforceBehaviorPatterns(experience);
    } else if (feedback.includes('差') || feedback.includes('错') || feedback.includes('不好')) {
      // 负面反馈，调整相关模式
      this.adjustBehaviorPatterns(experience);
    }
  }

  /**
   * 增强行为模式
   */
  private reinforceBehaviorPatterns(experience: Experience): void {
    const matchingPatterns = Array.from(this.behaviorPatterns.values()).filter(pattern => 
      pattern.triggers.some(trigger => 
        experience.context.toLowerCase().includes(trigger.toLowerCase())
      )
    );
    
    matchingPatterns.forEach(pattern => {
      pattern.successRate = Math.min(100, pattern.successRate + 20);
      console.log(`[SelfEvolution] 增强行为模式: ${pattern.name}`);
    });
  }

  /**
   * 调整行为模式
   */
  private adjustBehaviorPatterns(experience: Experience): void {
    const matchingPatterns = Array.from(this.behaviorPatterns.values()).filter(pattern => 
      pattern.triggers.some(trigger => 
        experience.context.toLowerCase().includes(trigger.toLowerCase())
      )
    );
    
    matchingPatterns.forEach(pattern => {
      pattern.successRate = Math.max(0, pattern.successRate - 20);
      console.log(`[SelfEvolution] 调整行为模式: ${pattern.name}`);
    });
  }

  /**
   * 加载现有知识
   */
  private loadExistingKnowledge(): void {
    // 从文件加载知识
    // 这里可以添加从文件加载知识的逻辑
  }

  /**
   * 开始学习循环
   */
  private startLearningCycle(): void {
    setInterval(() => {
      this.consolidateKnowledge();
      this.pruneOldExperiences();
    }, 60 * 60 * 1000); // 每小时执行一次
  }

  /**
   * 整合知识
   */
  private consolidateKnowledge(): void {
    console.log('[SelfEvolution] 整合知识...');
    
    // 合并相似的知识
    const knowledgeArray = Array.from(this.knowledgeBase.values());
    const merged = new Map<string, Knowledge>();
    
    knowledgeArray.forEach(knowledge => {
      const existing = Array.from(merged.values()).find(m => 
        m.domain === knowledge.domain && 
        this.calculateSimilarity(m.content, knowledge.content) > 0.8
      );
      
      if (existing) {
        // 合并
        existing.content = this.mergeContent(existing.content, knowledge.content);
        existing.confidence = Math.max(existing.confidence, knowledge.confidence);
        existing.validationCount += knowledge.validationCount;
      } else {
        // 添加
        merged.set(knowledge.id, knowledge);
      }
    });
    
    // 更新知识库
    this.knowledgeBase = merged;
  }

  /**
   * 计算内容相似度
   */
  private calculateSimilarity(content1: string, content2: string): number {
    // 简单的相似度计算
    const words1 = new Set(content1.split(/\s+/));
    const words2 = new Set(content2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * 合并内容
   */
  private mergeContent(content1: string, content2: string): string {
    // 简单的内容合并
    if (content1.length > content2.length) {
      return content1;
    }
    return content2;
  }

  /**
   * 清理旧经验
   */
  private pruneOldExperiences(): void {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    this.experiences = this.experiences.filter(exp => 
      exp.timestamp > oneMonthAgo
    );
    
    console.log(`[SelfEvolution] 清理旧经验，剩余: ${this.experiences.length}`);
  }

  /**
   * 获取推荐的行为模式
   */
  getRecommendedPattern(context: string): BehaviorPattern | null {
    const matchingPatterns = Array.from(this.behaviorPatterns.values()).filter(pattern => 
      pattern.triggers.some(trigger => 
        context.toLowerCase().includes(trigger.toLowerCase())
      )
    );
    
    if (matchingPatterns.length === 0) {
      return null;
    }
    
    // 返回成功率最高的模式
    return matchingPatterns.reduce((best, current) => 
      current.successRate > best.successRate ? current : best
    );
  }

  /**
   * 获取相关知识
   */
  getRelatedKnowledge(domain: string): Knowledge[] {
    return Array.from(this.knowledgeBase.values()).filter(k => 
      k.domain === domain || domain === 'all'
    );
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      experiences: this.experiences.length,
      behaviorPatterns: this.behaviorPatterns.size,
      knowledgeBase: this.knowledgeBase.size,
      averageSuccessRate: this.calculateAverageSuccessRate(),
    };
  }

  /**
   * 计算平均成功率
   */
  private calculateAverageSuccessRate(): number {
    const patterns = Array.from(this.behaviorPatterns.values());
    if (patterns.length === 0) {
      return 0;
    }
    
    const total = patterns.reduce((sum, p) => sum + p.successRate, 0);
    return total / patterns.length;
  }
}

// 全局实例
let globalSelfEvolutionEngine: SelfEvolutionEngine | null = null;

export function getGlobalSelfEvolutionEngine(): SelfEvolutionEngine {
  if (!globalSelfEvolutionEngine) {
    globalSelfEvolutionEngine = new SelfEvolutionEngine();
  }
  return globalSelfEvolutionEngine;
}
