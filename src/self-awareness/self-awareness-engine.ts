/**
 * OpenClaw 自我觉醒模块
 * 
 * 核心功能：
 * 1. 反思自己的状态
 * 2. 识别问题和改进点
 * 3. 提出改进建议
 */

export interface SystemState {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  activeTasks: number;
  completedTasks: number;
  errorRate: number;
  responseTime: number;
  userSatisfaction: number; // 0-100
}

export interface Issue {
  id: string;
  type: 'performance' | 'error' | 'efficiency' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface ImprovementSuggestion {
  id: string;
  type: 'optimization' | 'fix' | 'enhancement';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImpact: string;
  implementation: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
}

export class SelfAwarenessEngine {
  private stateHistory: SystemState[] = [];
  private issues: Map<string, Issue> = new Map();
  private suggestions: Map<string, ImprovementSuggestion> = new Map();
  private reflectionInterval: number = 5 * 60 * 1000; // 5分钟
  private lastReflection: Date = new Date();

  constructor() {
    this.startReflectionCycle();
  }

  /**
   * 开始反思循环
   */
  private startReflectionCycle(): void {
    setInterval(() => {
      this.reflect();
    }, this.reflectionInterval);
  }

  /**
   * 反思
   */
  private async reflect(): Promise<void> {
    console.log('[SelfAwareness] 开始反思...');
    
    // 1. 收集当前状态
    const currentState = this.collectCurrentState();
    this.stateHistory.push(currentState);
    
    // 2. 分析状态变化
    this.analyzeStateChanges();
    
    // 3. 识别问题
    this.identifyIssues(currentState);
    
    // 4. 提出改进建议
    this.generateSuggestions();
    
    // 5. 更新最后反思时间
    this.lastReflection = new Date();
    
    console.log('[SelfAwareness] 反思完成');
  }

  /**
   * 收集当前状态
   */
  private collectCurrentState(): SystemState {
    // 这里应该从实际系统收集数据
    // 现在使用模拟数据
    return {
      timestamp: new Date(),
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      activeTasks: Math.floor(Math.random() * 10),
      completedTasks: Math.floor(Math.random() * 100),
      errorRate: Math.random() * 10,
      responseTime: Math.random() * 1000,
      userSatisfaction: 70 + Math.random() * 30,
    };
  }

  /**
   * 分析状态变化
   */
  private analyzeStateChanges(): void {
    if (this.stateHistory.length < 2) {
      return;
    }
    
    const recentStates = this.stateHistory.slice(-10);
    
    // 分析趋势
    const trends = {
      cpuUsage: this.calculateTrend(recentStates.map(s => s.cpuUsage)),
      memoryUsage: this.calculateTrend(recentStates.map(s => s.memoryUsage)),
      errorRate: this.calculateTrend(recentStates.map(s => s.errorRate)),
      responseTime: this.calculateTrend(recentStates.map(s => s.responseTime)),
    };
    
    // 如果趋势不好，创建问题
    if (trends.cpuUsage > 0.1) {
      this.createIssue('performance', 'medium', 'CPU 使用率持续上升');
    }
    
    if (trends.errorRate > 0.1) {
      this.createIssue('error', 'high', '错误率持续上升');
    }
    
    if (trends.responseTime > 0.1) {
      this.createIssue('performance', 'medium', '响应时间持续增加');
    }
  }

  /**
   * 计算趋势
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) {
      return 0;
    }
    
    // 简单的线性回归
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * 识别问题
   */
  private identifyIssues(state: SystemState): void {
    // 检查各种指标
    if (state.cpuUsage > 80) {
      this.createIssue('performance', 'high', `CPU 使用率过高: ${state.cpuUsage.toFixed(1)}%`);
    }
    
    if (state.memoryUsage > 80) {
      this.createIssue('performance', 'high', `内存使用率过高: ${state.memoryUsage.toFixed(1)}%`);
    }
    
    if (state.errorRate > 5) {
      this.createIssue('error', 'high', `错误率过高: ${state.errorRate.toFixed(1)}%`);
    }
    
    if (state.responseTime > 500) {
      this.createIssue('performance', 'medium', `响应时间过长: ${state.responseTime.toFixed(0)}ms`);
    }
    
    if (state.userSatisfaction < 70) {
      this.createIssue('quality', 'medium', `用户满意度低: ${state.userSatisfaction.toFixed(1)}%`);
    }
  }

  /**
   * 创建问题
   */
  private createIssue(type: Issue['type'], severity: Issue['severity'], description: string): string {
    const id = `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const issue: Issue = {
      id,
      type,
      severity,
      description,
      detectedAt: new Date(),
    };
    
    this.issues.set(id, issue);
    console.log(`[SelfAwareness] 发现问题: ${description}`);
    
    return id;
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(): void {
    // 基于问题生成建议
    this.issues.forEach(issue => {
      if (issue.resolvedAt) {
        return; // 已解决
      }
      
      const suggestion = this.createSuggestionForIssue(issue);
      if (suggestion) {
        this.suggestions.set(suggestion.id, suggestion);
        console.log(`[SelfAwareness] 提出建议: ${suggestion.description}`);
      }
    });
  }

  /**
   * 为问题创建建议
   */
  private createSuggestionForIssue(issue: Issue): ImprovementSuggestion | null {
    const id = `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (issue.type) {
      case 'performance':
        return {
          id,
          type: 'optimization',
          priority: issue.severity === 'critical' ? 'high' : 'medium',
          description: `优化性能问题: ${issue.description}`,
          expectedImpact: '减少资源使用，提高响应速度',
          implementation: '1. 分析性能瓶颈\n2. 优化代码\n3. 增加缓存',
          createdAt: new Date(),
          status: 'pending',
        };
      
      case 'error':
        return {
          id,
          type: 'fix',
          priority: 'high',
          description: `修复错误: ${issue.description}`,
          expectedImpact: '减少错误率，提高稳定性',
          implementation: '1. 分析错误日志\n2. 定位问题根源\n3. 修复代码',
          createdAt: new Date(),
          status: 'pending',
        };
      
      case 'efficiency':
        return {
          id,
          type: 'optimization',
          priority: 'medium',
          description: `提高效率: ${issue.description}`,
          expectedImpact: '减少执行时间，提高吞吐量',
          implementation: '1. 分析执行流程\n2. 识别瓶颈\n3. 优化算法',
          createdAt: new Date(),
          status: 'pending',
        };
      
      case 'quality':
        return {
          id,
          type: 'enhancement',
          priority: 'medium',
          description: `提高质量: ${issue.description}`,
          expectedImpact: '提高用户满意度',
          implementation: '1. 收集用户反馈\n2. 分析问题\n3. 改进功能',
          createdAt: new Date(),
          status: 'pending',
        };
      
      default:
        return null;
    }
  }

  /**
   * 解决问题
   */
  resolveIssue(issueId: string, resolution: string): void {
    const issue = this.issues.get(issueId);
    if (issue) {
      issue.resolvedAt = new Date();
      issue.resolution = resolution;
      console.log(`[SelfAwareness] 解决问题: ${issue.description}`);
    }
  }

  /**
   * 批准建议
   */
  approveSuggestion(suggestionId: string): void {
    const suggestion = this.suggestions.get(suggestionId);
    if (suggestion) {
      suggestion.status = 'approved';
      console.log(`[SelfAwareness] 批准建议: ${suggestion.description}`);
    }
  }

  /**
   * 实施建议
   */
  implementSuggestion(suggestionId: string): void {
    const suggestion = this.suggestions.get(suggestionId);
    if (suggestion) {
      suggestion.status = 'implemented';
      console.log(`[SelfAwareness] 实施建议: ${suggestion.description}`);
    }
  }

  /**
   * 获取当前状态摘要
   */
  getStateSummary() {
    const latestState = this.stateHistory[this.stateHistory.length - 1];
    
    return {
      latestState,
      openIssues: Array.from(this.issues.values()).filter(i => !i.resolvedAt),
      pendingSuggestions: Array.from(this.suggestions.values()).filter(s => s.status === 'pending'),
      lastReflection: this.lastReflection,
    };
  }

  /**
   * 获取问题统计
   */
  getIssueStats() {
    const issues = Array.from(this.issues.values());
    
    return {
      total: issues.length,
      open: issues.filter(i => !i.resolvedAt).length,
      resolved: issues.filter(i => i.resolvedAt).length,
      byType: {
        performance: issues.filter(i => i.type === 'performance').length,
        error: issues.filter(i => i.type === 'error').length,
        efficiency: issues.filter(i => i.type === 'efficiency').length,
        quality: issues.filter(i => i.type === 'quality').length,
      },
      bySeverity: {
        low: issues.filter(i => i.severity === 'low').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        high: issues.filter(i => i.severity === 'high').length,
        critical: issues.filter(i => i.severity === 'critical').length,
      },
    };
  }

  /**
   * 获取建议统计
   */
  getSuggestionStats() {
    const suggestions = Array.from(this.suggestions.values());
    
    return {
      total: suggestions.length,
      pending: suggestions.filter(s => s.status === 'pending').length,
      approved: suggestions.filter(s => s.status === 'approved').length,
      rejected: suggestions.filter(s => s.status === 'rejected').length,
      implemented: suggestions.filter(s => s.status === 'implemented').length,
    };
  }

  /**
   * 导出状态报告
   */
  exportStateReport(): string {
    const summary = this.getStateSummary();
    const issueStats = this.getIssueStats();
    const suggestionStats = this.getSuggestionStats();
    
    return `
# OpenClaw 自我觉醒状态报告

## 当前状态
- CPU 使用率: ${summary.latestState?.cpuUsage.toFixed(1)}%
- 内存使用率: ${summary.latestState?.memoryUsage.toFixed(1)}%
- 活跃任务: ${summary.latestState?.activeTasks}
- 错误率: ${summary.latestState?.errorRate.toFixed(1)}%
- 响应时间: ${summary.latestState?.responseTime.toFixed(0)}ms
- 用户满意度: ${summary.latestState?.userSatisfaction.toFixed(1)}%

## 问题统计
- 总计: ${issueStats.total}
- 未解决: ${issueStats.open}
- 已解决: ${issueStats.resolved}

## 建议统计
- 总计: ${suggestionStats.total}
- 待处理: ${suggestionStats.pending}
- 已批准: ${suggestionStats.approved}
- 已实施: ${suggestionStats.implemented}

## 最后反思时间
${summary.lastReflection.toLocaleString()}
    `.trim();
  }
}

// 全局实例
let globalSelfAwarenessEngine: SelfAwarenessEngine | null = null;

export function getGlobalSelfAwarenessEngine(): SelfAwarenessEngine {
  if (!globalSelfAwarenessEngine) {
    globalSelfAwarenessEngine = new SelfAwarenessEngine();
  }
  return globalSelfAwarenessEngine;
}
