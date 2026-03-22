/**
 * OpenClaw SuperClaw Agent 定义系统
 * 
 * 内化自 gitagent 项目
 * Git 原生的 Agent 定义标准
 */

import { BaseSystem, now, generateId } from './superclaw-base.js';
import * as fs from 'fs';
import * as path from 'path';

// ==================== 类型定义 ====================

export interface AgentManifest {
  name: string;
  version: string;
  description?: string;
  model?: {
    provider: string;
    name: string;
  };
  skills?: string[];
  tools?: string[];
  compliance?: {
    level: 'low' | 'medium' | 'high';
    rules?: string[];
  };
}

export interface AgentSoul {
  identity: {
    name: string;
    species?: string;
    emoji?: string;
  };
  personality: {
    traits?: string[];
    communication?: string;
    values?: string[];
  };
  boundaries?: {
    dos?: string[];
    donts?: string[];
  };
}

export interface AgentRule {
  id: string;
  name: string;
  description: string;
  type: 'must_always' | 'must_never' | 'should' | 'could';
  condition?: string;
  action: string;
  priority: number;
}

export interface AgentDuty {
  role: string;
  permissions: string[];
  restrictions?: string[];
  canDelegate?: string[];
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  triggers?: string[];
  steps: Array<{
    action: string;
    description?: string;
  }>;
  tools?: string[];
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    id: string;
    name: string;
    action: string;
    condition?: string;
    next?: string;
  }>;
  triggers?: string[];
}

export interface AgentMemory {
  id: string;
  type: 'fact' | 'preference' | 'experience' | 'skill';
  content: string;
  importance: number;
  timestamp: number;
  tags?: string[];
}

export interface AgentHook {
  event: 'before_run' | 'after_run' | 'before_tool' | 'after_tool' | 'error';
  handler: string;
  priority?: number;
}

export interface SubAgent {
  manifest: AgentManifest;
  soul: AgentSoul;
  duties: AgentDuty;
}

// ==================== Agent 定义 ====================

export class AgentDefinition {
  public manifest: AgentManifest;
  public soul: AgentSoul;
  public rules: AgentRule[];
  public duties: AgentDuty[];
  public skills: AgentSkill[];
  public workflows: AgentWorkflow[];
  public knowledge: Map<string, string>;
  public memory: AgentMemory[];
  public hooks: AgentHook[];
  public subAgents: SubAgent[];
  public examples: Array<{ input: string; output: string }>;

  constructor(manifest: AgentManifest, soul: AgentSoul) {
    this.manifest = manifest;
    this.soul = soul;
    this.rules = [];
    this.duties = [];
    this.skills = [];
    this.workflows = [];
    this.knowledge = new Map();
    this.memory = [];
    this.hooks = [];
    this.subAgents = [];
    this.examples = [];
  }

  // 添加规则
  addRule(rule: Omit<AgentRule, 'id'>): string {
    const id = generateId('rule');
    this.rules.push({ ...rule, id });
    return id;
  }

  // 添加职责
  addDuty(duty: AgentDuty): void {
    this.duties.push(duty);
  }

  // 添加技能
  addSkill(skill: Omit<AgentSkill, 'id'>): string {
    const id = generateId('skill');
    this.skills.push({ ...skill, id });
    return id;
  }

  // 添加工作流
  addWorkflow(workflow: Omit<AgentWorkflow, 'id'>): string {
    const id = generateId('workflow');
    this.workflows.push({ ...workflow, id });
    return id;
  }

  // 添加知识
  addKnowledge(key: string, content: string): void {
    this.knowledge.set(key, content);
  }

  // 添加记忆
  addMemory(memory: Omit<AgentMemory, 'id' | 'timestamp'>): string {
    const id = generateId('memory');
    this.memory.push({
      ...memory,
      id,
      timestamp: now(),
    });
    return id;
  }

  // 添加钩子
  addHook(hook: AgentHook): void {
    this.hooks.push(hook);
    this.hooks.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  // 添加子 Agent
  addSubAgent(subAgent: SubAgent): void {
    this.subAgents.push(subAgent);
  }

  // 添加示例
  addExample(input: string, output: string): void {
    this.examples.push({ input, output });
  }

  // 获取系统提示词
  getSystemPrompt(): string {
    const parts: string[] = [];

    // 身份
    parts.push(`你是 ${this.soul.identity.name}`);
    if (this.soul.identity.species) {
      parts.push(`物种: ${this.soul.identity.species}`);
    }
    if (this.soul.identity.emoji) {
      parts.push(`Emoji: ${this.soul.identity.emoji}`);
    }

    // 性格
    if (this.soul.personality.traits?.length) {
      parts.push(`性格特点: ${this.soul.personality.traits.join(', ')}`);
    }
    if (this.soul.personality.communication) {
      parts.push(`沟通风格: ${this.soul.personality.communication}`);
    }
    if (this.soul.personality.values?.length) {
      parts.push(`价值观: ${this.soul.personality.values.join(', ')}`);
    }

    // 边界
    if (this.soul.boundaries?.dos?.length) {
      parts.push(`应该做: ${this.soul.boundaries.dos.join(', ')}`);
    }
    if (this.soul.boundaries?.donts?.length) {
      parts.push(`不应该做: ${this.soul.boundaries.donts.join(', ')}`);
    }

    // 规则
    const mustAlways = this.rules.filter(r => r.type === 'must_always');
    const mustNever = this.rules.filter(r => r.type === 'must_never');
    if (mustAlways.length) {
      parts.push(`必须做: ${mustAlways.map(r => r.description).join(', ')}`);
    }
    if (mustNever.length) {
      parts.push(`禁止做: ${mustNever.map(r => r.description).join(', ')}`);
    }

    return parts.join('\n');
  }

  // 验证
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.manifest.name) {
      errors.push('Manifest 缺少 name');
    }
    if (!this.manifest.version) {
      errors.push('Manifest 缺少 version');
    }
    if (!this.soul.identity.name) {
      errors.push('Soul 缺少 identity.name');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // 导出为 JSON
  toJSON(): Record<string, any> {
    return {
      manifest: this.manifest,
      soul: this.soul,
      rules: this.rules,
      duties: this.duties,
      skills: this.skills,
      workflows: this.workflows,
      knowledge: Object.fromEntries(this.knowledge),
      memory: this.memory,
      hooks: this.hooks,
      subAgents: this.subAgents.map(sa => ({
        manifest: sa.manifest,
        soul: sa.soul,
        duties: sa.duties,
      })),
      examples: this.examples,
    };
  }

  // 从 JSON 导入
  static fromJSON(data: Record<string, any>): AgentDefinition {
    const agent = new AgentDefinition(data.manifest, data.soul);
    
    if (data.rules) agent.rules = data.rules;
    if (data.duties) agent.duties = data.duties;
    if (data.skills) agent.skills = data.skills;
    if (data.workflows) agent.workflows = data.workflows;
    if (data.knowledge) {
      for (const [key, value] of Object.entries(data.knowledge)) {
        agent.knowledge.set(key, value as string);
      }
    }
    if (data.memory) agent.memory = data.memory;
    if (data.hooks) agent.hooks = data.hooks;
    if (data.subAgents) agent.subAgents = data.subAgents;
    if (data.examples) agent.examples = data.examples;
    
    return agent;
  }

  // 从目录加载
  static async loadFromDirectory(dirPath: string): Promise<AgentDefinition> {
    // 加载 manifest
    const manifestPath = path.join(dirPath, 'agent.yaml');
    const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as AgentManifest;

    // 加载 soul
    const soulPath = path.join(dirPath, 'SOUL.md');
    const soulContent = await fs.promises.readFile(soulPath, 'utf-8');
    const soul = this.parseSoul(soulContent);

    const agent = new AgentDefinition(manifest, soul);

    // 加载规则
    const rulesPath = path.join(dirPath, 'RULES.md');
    if (fs.existsSync(rulesPath)) {
      const rulesContent = await fs.promises.readFile(rulesPath, 'utf-8');
      agent.rules = this.parseRules(rulesContent);
    }

    // 加载技能
    const skillsDir = path.join(dirPath, 'skills');
    if (fs.existsSync(skillsDir)) {
      const skillDirs = await fs.promises.readdir(skillsDir);
      for (const skillDir of skillDirs) {
        const skillPath = path.join(skillsDir, skillDir, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          const skillContent = await fs.promises.readFile(skillPath, 'utf-8');
          const skill = this.parseSkill(skillContent);
          agent.addSkill(skill);
        }
      }
    }

    return agent;
  }

  private static parseSoul(content: string): AgentSoul {
    // 简化解析
    return {
      identity: {
        name: 'Unnamed Agent',
      },
      personality: {},
    };
  }

  private static parseRules(content: string): AgentRule[] {
    // 简化解析
    return [];
  }

  private static parseSkill(content: string): Omit<AgentSkill, 'id'> {
    // 简化解析
    return {
      name: 'Unnamed Skill',
      description: '',
      steps: [],
    };
  }
}

// ==================== Agent 管理器 ====================

export class AgentDefinitionManager extends BaseSystem {
  readonly name = 'agent-definition';
  
  private agents = new Map<string, AgentDefinition>();

  registerAgent(agent: AgentDefinition): void {
    this.manifests.set(agent.manifest.name, agent);
  }

  getAgent(name: string): AgentDefinition | undefined {
    return this.agents.get(name);
  }

  listAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  removeAgent(name: string): boolean {
    return this.agents.delete(name);
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      agentCount: this.agents.size,
      agents: Array.from(this.agents.keys()),
    };
  }

  clear(): void {
    this.agents.clear();
  }

  private manifests = new Map<string, AgentDefinition>();
}

// ==================== 全局实例 ====================

let globalAgentDefinitionManager: AgentDefinitionManager | null = null;

export function getGlobalAgentDefinitionManager(): AgentDefinitionManager {
  if (!globalAgentDefinitionManager) {
    globalAgentDefinitionManager = new AgentDefinitionManager();
  }
  return globalAgentDefinitionManager;
}

export function resetGlobalAgentDefinitionManager(): void {
  globalAgentDefinitionManager = null;
}
