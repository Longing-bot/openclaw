/**
 * OpenClaw SuperClaw 认知系统 (优化版)
 * 
 * 使用统一基础架构，减少重复代码
 */

import { BaseSystem, ManagedArray, now, generateId } from './superclaw-base.js';

// ==================== 推理引擎 ====================

interface ReasoningContext {
  facts: Set<string>;
  rules: Array<{ condition: string; conclusion: string }>;
  confidence: number;
}

export class ReasoningEngine {
  private context: ReasoningContext = {
    facts: new Set(),
    rules: [],
    confidence: 0.5,
  };

  addFact(fact: string): void {
    this.context.facts.add(fact);
  }

  addRule(condition: string, conclusion: string): void {
    this.context.rules.push({ condition, conclusion });
  }

  reason(): string[] {
    const conclusions: string[] = [];
    
    for (const rule of this.context.rules) {
      if (this.context.facts.has(rule.condition)) {
        conclusions.push(rule.conclusion);
        this.addFact(rule.conclusion);
      }
    }
    
    return conclusions;
  }

  getConfidence(): number {
    return this.context.confidence;
  }

  updateConfidence(delta: number): void {
    this.context.confidence = Math.max(0, Math.min(1, this.context.confidence + delta));
  }

  getFacts(): string[] {
    return Array.from(this.context.facts);
  }

  clear(): void {
    this.context = { facts: new Set(), rules: [], confidence: 0.5 };
  }
}

// ==================== 决策系统 ====================

interface DecisionOption {
  id: string;
  description: string;
  score: number;
  factors: Record<string, number>;
}

export class DecisionSystem {
  private options: DecisionOption[] = [];
  private weights: Record<string, number> = {};

  addOption(option: DecisionOption): void {
    this.options.push(option);
  }

  setWeight(factor: string, weight: number): void {
    this.weights[factor] = weight;
  }

  decide(): DecisionOption | null {
    if (this.options.length === 0) return null;

    let bestOption = this.options[0];
    let bestScore = this.calculateScore(bestOption);

    for (let i = 1; i < this.options.length; i++) {
      const option = this.options[i];
      const score = this.calculateScore(option);
      if (score > bestScore) {
        bestScore = score;
        bestOption = option;
      }
    }

    return bestOption;
  }

  private calculateScore(option: DecisionOption): number {
    let score = option.score;
    
    for (const [factor, value] of Object.entries(option.factors)) {
      const weight = this.weights[factor] ?? 1;
      score += value * weight;
    }
    
    return score;
  }

  clear(): void {
    this.options = [];
  }
}

// ==================== 规划系统 ====================

interface PlanStep {
  id: string;
  action: string;
  preconditions: string[];
  effects: string[];
  cost: number;
}

interface Plan {
  steps: PlanStep[];
  totalCost: number;
}

export class PlanningSystem {
  private steps: PlanStep[] = [];

  addStep(step: PlanStep): void {
    this.steps.push(step);
  }

  plan(goal: string): Plan | null {
    const availableSteps = [...this.steps];
    const achieved = new Set<string>();
    const plan: PlanStep[] = [];
    let totalCost = 0;

    while (!achieved.has(goal)) {
      const applicable = availableSteps.filter(step =>
        step.preconditions.every(p => achieved.has(p))
      );

      if (applicable.length === 0) return null;

      // 选择成本最低的步骤
      let best = applicable[0];
      let bestCost = best.cost;
      
      for (let i = 1; i < applicable.length; i++) {
        if (applicable[i].cost < bestCost) {
          best = applicable[i];
          bestCost = best.cost;
        }
      }
      
      plan.push(best);
      totalCost += best.cost;
      
      for (const effect of best.effects) {
        achieved.add(effect);
      }

      const index = availableSteps.indexOf(best);
      availableSteps.splice(index, 1);
    }

    return { steps: plan, totalCost };
  }

  clear(): void {
    this.steps = [];
  }
}

// ==================== 反思系统 ====================

interface Reflection {
  id: string;
  timestamp: number;
  content: string;
  category: string;
  insights: string[];
}

export class ReflectionSystem {
  private reflections: ManagedArray<Reflection>;

  constructor(maxSize = 100) {
    this.reflections = new ManagedArray(maxSize);
  }

  reflect(content: string, category: string): Reflection {
    const reflection: Reflection = {
      id: generateId('reflection'),
      timestamp: now(),
      content,
      category,
      insights: this.extractInsights(content),
    };

    this.reflections.push(reflection);
    return reflection;
  }

  private extractInsights(content: string): string[] {
    const insights: string[] = [];
    const keywords = ['问题', '改进', '优化', '学习', '发现', '错误', '成功'];
    
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        insights.push(`包含关键词: ${keyword}`);
      }
    }

    return insights;
  }

  getRecentReflections(count: number = 10): Reflection[] {
    return this.reflections.slice(-count);
  }

  getByCategory(category: string): Reflection[] {
    return this.reflections.filter(r => r.category === category);
  }

  clear(): void {
    this.reflections.length = 0;
  }
}

// ==================== 注意力系统 ====================

interface AttentionItem {
  id: string;
  content: string;
  priority: number;
  timestamp: number;
  focusScore: number;
}

export class AttentionSystem {
  private items = new Map<string, AttentionItem>();
  private maxItems = 10;

  focus(id: string, content: string, priority: number = 0.5): void {
    const existing = this.items.get(id);
    if (existing) {
      existing.focusScore = Math.min(1, existing.focusScore + 0.1);
      existing.priority = priority;
      existing.timestamp = now();
    } else {
      if (this.items.size >= this.maxItems) {
        this.removeLowestPriority();
      }
      
      this.items.set(id, {
        id,
        content,
        priority,
        timestamp: now(),
        focusScore: 0.5,
      });
    }
  }

  private removeLowestPriority(): void {
    let lowestId: string | null = null;
    let lowestScore = Infinity;

    for (const [id, item] of this.items) {
      const score = item.priority * item.focusScore;
      if (score < lowestScore) {
        lowestScore = score;
        lowestId = id;
      }
    }

    if (lowestId) {
      this.items.delete(lowestId);
    }
  }

  getFocusedItems(): AttentionItem[] {
    return Array.from(this.items.values())
      .sort((a, b) => (b.priority * b.focusScore) - (a.priority * a.focusScore));
  }

  unfocus(id: string): void {
    this.items.delete(id);
  }

  clear(): void {
    this.items.clear();
  }
}

// ==================== 情感系统 ====================

interface Emotion {
  type: string;
  intensity: number;
  timestamp: number;
  trigger: string;
}

export class EmotionalSystem {
  private emotions: ManagedArray<Emotion>;
  private baselines: Record<string, number> = {
    joy: 0.5,
    trust: 0.5,
    fear: 0.2,
    surprise: 0.3,
    sadness: 0.2,
    disgust: 0.1,
    anger: 0.1,
    anticipation: 0.5,
  };

  constructor(maxSize = 100) {
    this.emotions = new ManagedArray(maxSize);
  }

  recordEmotion(type: string, intensity: number, trigger: string): void {
    const emotion: Emotion = {
      type,
      intensity: Math.max(0, Math.min(1, intensity)),
      timestamp: now(),
      trigger,
    };

    this.emotions.push(emotion);
    
    if (this.baselines[type] !== undefined) {
      this.baselines[type] = this.baselines[type] * 0.9 + intensity * 0.1;
    }
  }

  getCurrentMood(): Record<string, number> {
    return { ...this.baselines };
  }

  getRecentEmotions(count: number = 10): Emotion[] {
    return this.emotions.slice(-count);
  }

  getDominantEmotion(): string | null {
    let dominant: string | null = null;
    let highestIntensity = 0;

    for (const [type, intensity] of Object.entries(this.baselines)) {
      if (intensity > highestIntensity) {
        highestIntensity = intensity;
        dominant = type;
      }
    }

    return dominant;
  }

  clear(): void {
    this.emotions.length = 0;
  }
}

// ==================== 统一认知系统 ====================

export class SuperClawCognitiveSystem extends BaseSystem {
  readonly name = 'cognitive-system';
  
  public reasoning: ReasoningEngine;
  public decision: DecisionSystem;
  public planning: PlanningSystem;
  public reflection: ReflectionSystem;
  public attention: AttentionSystem;
  public emotion: EmotionalSystem;

  constructor() {
    super();
    this.reasoning = new ReasoningEngine();
    this.decision = new DecisionSystem();
    this.planning = new PlanningSystem();
    this.reflection = new ReflectionSystem();
    this.attention = new AttentionSystem();
    this.emotion = new EmotionalSystem();
  }

  think(context: string): {
    reasoning: string[];
    decision: any;
    attention: any[];
    mood: Record<string, number>;
  } {
    this.reasoning.addFact(context);
    const conclusions = this.reasoning.reason();
    this.attention.focus('current_context', context, 0.8);
    
    return {
      reasoning: conclusions,
      decision: this.decision.decide(),
      attention: this.attention.getFocusedItems(),
      mood: this.emotion.getCurrentMood(),
    };
  }

  reflect(content: string, category: string = 'general'): void {
    this.reflection.reflect(content, category);
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      facts: this.reasoning.getFacts().length,
      confidence: this.reasoning.getConfidence(),
      recentReflections: this.reflection.getRecentReflections(5).length,
      focusedItems: this.attention.getFocusedItems().length,
      dominantEmotion: this.emotion.getDominantEmotion(),
    };
  }

  clear(): void {
    this.reasoning.clear();
    this.decision.clear();
    this.planning.clear();
    this.reflection.clear();
    this.attention.clear();
    this.emotion.clear();
  }
}

// ==================== 全局实例 ====================

let globalCognitiveSystem: SuperClawCognitiveSystem | null = null;

export function getGlobalCognitiveSystem(): SuperClawCognitiveSystem {
  if (!globalCognitiveSystem) {
    globalCognitiveSystem = new SuperClawCognitiveSystem();
  }
  return globalCognitiveSystem;
}

export function resetGlobalCognitiveSystem(): void {
  globalCognitiveSystem = null;
}
