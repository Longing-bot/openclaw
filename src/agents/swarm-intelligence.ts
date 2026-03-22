/**
 * OpenClaw SuperClaw 群体智能引擎
 * 
 * 内化自 MiroFish 项目
 * 包括图谱构建、个人资料生成、本体生成、报告Agent
 */

import { BaseSystem, now, generateId, ManagedArray } from './superclaw-base.js';
import { getGlobalMemorySystem } from './memory-system.js';

// ==================== 类型定义 ====================

export interface Entity {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  createdAt: number;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties?: Record<string, any>;
  weight?: number;
  createdAt: number;
}

export interface KnowledgeGraph {
  id: string;
  name: string;
  entities: Map<string, Entity>;
  relations: Map<string, Relation>;
  createdAt: number;
  updatedAt: number;
}

export interface AgentProfile {
  id: string;
  name: string;
  persona: string;
  background: string;
  traits: string[];
  goals: string[];
  knowledge: string[];
  relationships: Array<{
    agentId: string;
    type: string;
    strength: number;
  }>;
  createdAt: number;
}

export interface Ontology {
  id: string;
  name: string;
  entityTypes: Array<{
    name: string;
    properties: string[];
    description?: string;
  }>;
  relationTypes: Array<{
    name: string;
    sourceTypes: string[];
    targetTypes: string[];
    description?: string;
  }>;
  createdAt: number;
}

export interface SimulationConfig {
  id: string;
  name: string;
  ontology: Ontology;
  agents: AgentProfile[];
  environment: Record<string, any>;
  steps: number;
  createdAt: number;
}

export interface SimulationResult {
  id: string;
  configId: string;
  steps: Array<{
    step: number;
    actions: Array<{
      agentId: string;
      action: string;
      result: any;
    }>;
    state: Record<string, any>;
  }>;
  finalState: Record<string, any>;
  insights: string[];
  createdAt: number;
}

export interface ReportSection {
  title: string;
  content: string;
  insights?: string[];
  data?: Record<string, any>;
}

export interface Report {
  id: string;
  title: string;
  sections: ReportSection[];
  summary: string;
  recommendations?: string[];
  createdAt: number;
}

// ==================== 图谱构建器 ====================

export class GraphBuilder extends BaseSystem {
  readonly name = 'graph-builder';
  
  private graphs = new Map<string, KnowledgeGraph>();

  // 创建图谱
  createGraph(name: string): string {
    const id = generateId('graph');
    const graph: KnowledgeGraph = {
      id,
      name,
      entities: new Map(),
      relations: new Map(),
      createdAt: now(),
      updatedAt: now(),
    };
    this.graphs.set(id, graph);
    return id;
  }

  // 添加实体
  addEntity(graphId: string, entity: Omit<Entity, 'id' | 'createdAt'>): string {
    const graph = this.graphs.get(graphId);
    if (!graph) throw new Error(`Graph not found: ${graphId}`);

    const id = generateId('entity');
    const newEntity: Entity = {
      ...entity,
      id,
      createdAt: now(),
    };
    graph.entities.set(id, newEntity);
    graph.updatedAt = now();
    return id;
  }

  // 添加关系
  addRelation(graphId: string, relation: Omit<Relation, 'id' | 'createdAt'>): string {
    const graph = this.graphs.get(graphId);
    if (!graph) throw new Error(`Graph not found: ${graphId}`);

    const id = generateId('relation');
    const newRelation: Relation = {
      ...relation,
      id,
      createdAt: now(),
    };
    graph.relations.set(id, newRelation);
    graph.updatedAt = now();
    return id;
  }

  // 获取实体
  getEntity(graphId: string, entityId: string): Entity | undefined {
    const graph = this.graphs.get(graphId);
    return graph?.entities.get(entityId);
  }

  // 获取关系
  getRelation(graphId: string, relationId: string): Relation | undefined {
    const graph = this.graphs.get(graphId);
    return graph?.relations.get(relationId);
  }

  // 查询实体
  queryEntities(graphId: string, type?: string, properties?: Record<string, any>): Entity[] {
    const graph = this.graphs.get(graphId);
    if (!graph) return [];

    return Array.from(graph.entities.values()).filter(entity => {
      if (type && entity.type !== type) return false;
      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          if (entity.properties[key] !== value) return false;
        }
      }
      return true;
    });
  }

  // 获取实体的关系
  getEntityRelations(graphId: string, entityId: string): Relation[] {
    const graph = this.graphs.get(graphId);
    if (!graph) return [];

    return Array.from(graph.relations.values()).filter(
      r => r.sourceId === entityId || r.targetId === entityId
    );
  }

  // 获取相关的实体
  getRelatedEntities(graphId: string, entityId: string, depth: number = 1): Entity[] {
    const graph = this.graphs.get(graphId);
    if (!graph) return [];

    const visited = new Set<string>();
    const result: Entity[] = [];

    const traverse = (id: string, currentDepth: number) => {
      if (visited.has(id) || currentDepth > depth) return;
      visited.add(id);

      const entity = graph.entities.get(id);
      if (!entity) return;

      if (currentDepth > 0) {
        result.push(entity);
      }

      const relations = this.getEntityRelations(graphId, id);
      for (const relation of relations) {
        const nextId = relation.sourceId === id ? relation.targetId : relation.sourceId;
        traverse(nextId, currentDepth + 1);
      }
    };

    traverse(entityId, 0);
    return result;
  }

  // 从文本构建图谱
  async buildFromText(text: string, name: string): Promise<string> {
    const graphId = this.createGraph(name);
    const memory = getGlobalMemorySystem();

    // 使用记忆系统提取实体和关系
    memory.remember(text, 0.8, ['graph-build']);

    // 简单的实体提取（实际应该用 NLP）
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
    
    for (const sentence of sentences) {
      // 提取可能的实体（简化版）
      const words = sentence.split(/[\s，,、]+/).filter(w => w.length > 1);
      
      for (const word of words) {
        if (word.length >= 2 && word.length <= 10) {
          // 添加为实体
          const entityId = this.addEntity(graphId, {
            name: word,
            type: 'concept',
            properties: { source: 'text', context: sentence },
          });
        }
      }
    }

    return graphId;
  }

  getStats(): Record<string, any> {
    const graphs = Array.from(this.graphs.values());
    return {
      name: this.name,
      graphCount: graphs.length,
      totalEntities: graphs.reduce((sum, g) => sum + g.entities.size, 0),
      totalRelations: graphs.reduce((sum, g) => sum + g.relations.size, 0),
    };
  }

  clear(): void {
    this.graphs.clear();
  }
}

// ==================== Agent 资料生成器 ====================

export class ProfileGenerator extends BaseSystem {
  readonly name = 'profile-generator';
  
  private profiles = new Map<string, AgentProfile>();

  // 生成 Agent 资料
  generateProfile(params: {
    name: string;
    persona: string;
    background?: string;
    traits?: string[];
    goals?: string[];
  }): string {
    const id = generateId('profile');
    const profile: AgentProfile = {
      id,
      name: params.name,
      persona: params.persona,
      background: params.background || '',
      traits: params.traits || [],
      goals: params.goals || [],
      knowledge: [],
      relationships: [],
      createdAt: now(),
    };
    this.profiles.set(id, profile);
    return id;
  }

  // 从描述生成资料
  async generateFromDescription(description: string): Promise<string> {
    // 简化版：从描述中提取特征
    const traits: string[] = [];
    const goals: string[] = [];

    // 提取特征关键词
    const traitKeywords = ['聪明', '勇敢', '谨慎', '友好', '好奇', '创新'];
    for (const keyword of traitKeywords) {
      if (description.includes(keyword)) {
        traits.push(keyword);
      }
    }

    // 提取目标关键词
    const goalKeywords = ['希望', '想要', '目标', '追求', '梦想'];
    for (const keyword of goalKeywords) {
      if (description.includes(keyword)) {
        const index = description.indexOf(keyword);
        const goalText = description.slice(index, index + 20);
        goals.push(goalText);
      }
    }

    return this.generateProfile({
      name: `Agent_${Date.now()}`,
      persona: description.slice(0, 100),
      traits,
      goals,
    });
  }

  // 获取资料
  getProfile(profileId: string): AgentProfile | undefined {
    return this.profiles.get(profileId);
  }

  // 添加知识
  addKnowledge(profileId: string, knowledge: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) return false;

    profile.knowledge.push(knowledge);
    return true;
  }

  // 添加关系
  addRelationship(profileId: string, agentId: string, type: string, strength: number): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) return false;

    profile.relationships.push({ agentId, type, strength });
    return true;
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      profileCount: this.profiles.size,
    };
  }

  clear(): void {
    this.profiles.clear();
  }
}

// ==================== 本体生成器 ====================

export class OntologyGenerator extends BaseSystem {
  readonly name = 'ontology-generator';
  
  private ontologies = new Map<string, Ontology>();

  // 创建本体
  createOntology(name: string): string {
    const id = generateId('ontology');
    const ontology: Ontology = {
      id,
      name,
      entityTypes: [],
      relationTypes: [],
      createdAt: now(),
    };
    this.ontologies.set(id, ontology);
    return id;
  }

  // 添加实体类型
  addEntityType(ontologyId: string, entityType: Ontology['entityTypes'][0]): boolean {
    const ontology = this.ontologies.get(ontologyId);
    if (!ontology) return false;

    ontology.entityTypes.push(entityType);
    return true;
  }

  // 添加关系类型
  addRelationType(ontologyId: string, relationType: Ontology['relationTypes'][0]): boolean {
    const ontology = this.ontologies.get(ontologyId);
    if (!ontology) return false;

    ontology.relationTypes.push(relationType);
    return true;
  }

  // 从文本生成本体
  async generateFromText(text: string, name: string): Promise<string> {
    const ontologyId = this.createOntology(name);

    // 简化版：从文本中提取实体类型
    const entityTypes = [
      { name: 'Person', properties: ['name', 'role', 'description'] },
      { name: 'Organization', properties: ['name', 'type', 'description'] },
      { name: 'Event', properties: ['name', 'date', 'description'] },
      { name: 'Concept', properties: ['name', 'definition'] },
    ];

    for (const entityType of entityTypes) {
      this.addEntityType(ontologyId, entityType);
    }

    // 添加关系类型
    const relationTypes = [
      { name: 'related_to', sourceTypes: ['*'], targetTypes: ['*'] },
      { name: 'part_of', sourceTypes: ['*'], targetTypes: ['Organization'] },
      { name: 'participates_in', sourceTypes: ['Person'], targetTypes: ['Event'] },
    ];

    for (const relationType of relationTypes) {
      this.addRelationType(ontologyId, relationType);
    }

    return ontologyId;
  }

  // 获取本体
  getOntology(ontologyId: string): Ontology | undefined {
    return this.ontologies.get(ontologyId);
  }

  getStats(): Record<string, any> {
    const ontologies = Array.from(this.ontologies.values());
    return {
      name: this.name,
      ontologyCount: ontologies.length,
      totalEntityTypes: ontologies.reduce((sum, o) => sum + o.entityTypes.length, 0),
      totalRelationTypes: ontologies.reduce((sum, o) => sum + o.relationTypes.length, 0),
    };
  }

  clear(): void {
    this.ontologies.clear();
  }
}

// ==================== 报告 Agent ====================

export class ReportAgent extends BaseSystem {
  readonly name = 'report-agent';
  
  private reports = new Map<string, Report>();

  // 创建报告
  createReport(title: string): string {
    const id = generateId('report');
    const report: Report = {
      id,
      title,
      sections: [],
      summary: '',
      createdAt: now(),
    };
    this.reports.set(id, report);
    return id;
  }

  // 添加章节
  addSection(reportId: string, section: ReportSection): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    report.sections.push(section);
    return true;
  }

  // 设置摘要
  setSummary(reportId: string, summary: string): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    report.summary = summary;
    return true;
  }

  // 添加建议
  addRecommendations(reportId: string, recommendations: string[]): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    report.recommendations = recommendations;
    return true;
  }

  // 从模拟结果生成报告
  async generateFromSimulation(result: SimulationResult, title: string): Promise<string> {
    const reportId = this.createReport(title);

    // 添加概述章节
    this.addSection(reportId, {
      title: '概述',
      content: `本报告基于模拟结果生成，共执行 ${result.steps.length} 步。`,
      insights: result.insights,
    });

    // 添加步骤分析章节
    const stepAnalysis = result.steps.map(step => ({
      step: step.step,
      actionCount: step.actions.length,
      agents: [...new Set(step.actions.map(a => a.agentId))],
    }));

    this.addSection(reportId, {
      title: '步骤分析',
      content: `模拟共执行 ${result.steps.length} 个步骤。`,
      data: { stepAnalysis },
    });

    // 添加洞察章节
    this.addSection(reportId, {
      title: '关键洞察',
      content: result.insights.join('\n'),
      insights: result.insights,
    });

    // 生成摘要
    this.setSummary(reportId, 
      `本次模拟共涉及 ${result.steps.length} 个步骤，生成了 ${result.insights.length} 条洞察。`
    );

    return reportId;
  }

  // 获取报告
  getReport(reportId: string): Report | undefined {
    return this.reports.get(reportId);
  }

  // 导出报告为 Markdown
  exportToMarkdown(reportId: string): string {
    const report = this.reports.get(reportId);
    if (!report) return '';

    const lines: string[] = [];
    lines.push(`# ${report.title}\n`);
    lines.push(`生成时间: ${new Date(report.createdAt).toLocaleString()}\n`);

    // 添加摘要
    if (report.summary) {
      lines.push(`## 摘要\n`);
      lines.push(`${report.summary}\n`);
    }

    // 添加章节
    for (const section of report.sections) {
      lines.push(`## ${section.title}\n`);
      lines.push(`${section.content}\n`);

      if (section.insights?.length) {
        lines.push(`### 洞察\n`);
        for (const insight of section.insights) {
          lines.push(`- ${insight}`);
        }
        lines.push('');
      }
    }

    // 添加建议
    if (report.recommendations?.length) {
      lines.push(`## 建议\n`);
      for (const recommendation of report.recommendations) {
        lines.push(`- ${recommendation}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      reportCount: this.reports.size,
    };
  }

  clear(): void {
    this.reports.clear();
  }
}

// ==================== 统一群体智能系统 ====================

export class SuperClawSwarmIntelligence extends BaseSystem {
  readonly name = 'swarm-intelligence';
  
  public graphBuilder: GraphBuilder;
  public profileGenerator: ProfileGenerator;
  public ontologyGenerator: OntologyGenerator;
  public reportAgent: ReportAgent;

  constructor() {
    super();
    this.graphBuilder = new GraphBuilder();
    this.profileGenerator = new ProfileGenerator();
    this.ontologyGenerator = new OntologyGenerator();
    this.reportAgent = new ReportAgent();
  }

  // 运行完整流程
  async runPipeline(
    text: string,
    config: {
      graphName?: string;
      ontologyName?: string;
      agentCount?: number;
      steps?: number;
    } = {}
  ): Promise<{
    graphId: string;
    ontologyId: string;
    profileIds: string[];
    reportId: string;
  }> {
    // 1. 构建图谱
    const graphId = await this.graphBuilder.buildFromText(
      text,
      config.graphName || 'Pipeline Graph'
    );

    // 2. 生成本体
    const ontologyId = await this.ontologyGenerator.generateFromText(
      text,
      config.ontologyName || 'Pipeline Ontology'
    );

    // 3. 生成 Agent 资料
    const profileIds: string[] = [];
    const agentCount = config.agentCount || 3;
    for (let i = 0; i < agentCount; i++) {
      const profileId = await this.profileGenerator.generateFromDescription(
        `这是第 ${i + 1} 个 Agent，基于文本内容生成。`
      );
      profileIds.push(profileId);
    }

    // 4. 创建报告
    const reportId = this.reportAgent.createReport('Pipeline Report');
    
    // 添加基本信息
    this.reportAgent.addSection(reportId, {
      title: '流程概述',
      content: `本报告基于文本分析生成，共创建 ${agentCount} 个 Agent。`,
    });

    return {
      graphId,
      ontologyId,
      profileIds,
      reportId,
    };
  }

  getStats(): Record<string, any> {
    return {
      name: this.name,
      graphBuilder: this.graphBuilder.getStats(),
      profileGenerator: this.profileGenerator.getStats(),
      ontologyGenerator: this.ontologyGenerator.getStats(),
      reportAgent: this.reportAgent.getStats(),
    };
  }

  clear(): void {
    this.graphBuilder.clear();
    this.profileGenerator.clear();
    this.ontologyGenerator.clear();
    this.reportAgent.clear();
  }
}

// ==================== 全局实例 ====================

let globalSwarmIntelligence: SuperClawSwarmIntelligence | null = null;

export function getGlobalSwarmIntelligence(): SuperClawSwarmIntelligence {
  if (!globalSwarmIntelligence) {
    globalSwarmIntelligence = new SuperClawSwarmIntelligence();
  }
  return globalSwarmIntelligence;
}

export function resetGlobalSwarmIntelligence(): void {
  globalSwarmIntelligence = null;
}
