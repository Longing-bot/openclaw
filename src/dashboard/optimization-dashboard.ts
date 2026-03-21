/**
 * OpenClaw 优化仪表板
 * 
 * 实时监控所有优化器的性能指标
 */

import { getGlobalContextOptimizer } from '../context-engine/context-optimizer.js';
import { getGlobalClawTeamIntegrator } from '../multi-agent/clawteam-integration.js';
import { getGlobalAutonomousOptimizer } from '../self-awareness/self-driven.js';

export interface DashboardMetrics {
  timestamp: Date;
  contextEngine: {
    cacheHitRate: number;
    averageAssembleTime: number;
    totalAssembles: number;
    compressionRatio: number;
  };
  multiAgent: {
    teamsActive: number;
    agentsActive: number;
    tasksCompleted: number;
  };
  selfAwareness: {
    activeGoals: number;
    completedGoals: number;
    lastReflection: Date;
    improvementAreas: number;
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

export class OptimizationDashboard {
  private metricsHistory: DashboardMetrics[] = [];
  private maxHistorySize = 100;
  private startTime = Date.now();

  /**
   * 收集当前指标
   */
  async collectMetrics(): Promise<DashboardMetrics> {
    const contextOptimizer = getGlobalContextOptimizer();
    const contextMetrics = contextOptimizer.getMetrics();
    const cacheStats = contextOptimizer.getCacheStats();

    // 多智能体指标（简化实现）
    const multiAgentMetrics = {
      teamsActive: 0,
      agentsActive: 0,
      tasksCompleted: 0,
    };

    // 自我意识指标
    const autonomousOptimizer = getGlobalAutonomousOptimizer();
    const engineStatus = autonomousOptimizer.getEngine().getStatus();

    const metrics: DashboardMetrics = {
      timestamp: new Date(),
      contextEngine: {
        cacheHitRate: cacheStats.hitRate,
        averageAssembleTime: contextMetrics.averageAssembleTime,
        totalAssembles: contextMetrics.assembleCount,
        compressionRatio: contextMetrics.bytesFreed / (contextMetrics.totalTokensProcessed * 4 || 1),
      },
      multiAgent: multiAgentMetrics,
      selfAwareness: {
        activeGoals: engineStatus.activeGoals,
        completedGoals: engineStatus.completedGoals,
        lastReflection: engineStatus.lastReflection,
        improvementAreas: engineStatus.improvementAreas,
      },
      system: {
        uptime: Date.now() - this.startTime,
        memoryUsage: process.memoryUsage(),
      },
    };

    // 记录历史
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    return metrics;
  }

  /**
   * 获取性能趋势
   */
  getTrends(minutes = 30): {
    cacheHitRate: 'improving' | 'stable' | 'declining';
    assembleTime: 'improving' | 'stable' | 'declining';
  } {
    const recentMetrics = this.metricsHistory.slice(-Math.ceil(minutes / 5));
    if (recentMetrics.length < 2) {
      return { cacheHitRate: 'stable', assembleTime: 'stable' };
    }

    const first = recentMetrics[0];
    const last = recentMetrics[recentMetrics.length - 1];

    const cacheHitTrend = last.contextEngine.cacheHitRate - first.contextEngine.cacheHitRate;
    const timeTrend = first.contextEngine.averageAssembleTime - last.contextEngine.averageAssembleTime;

    return {
      cacheHitRate: cacheHitTrend > 0.05 ? 'improving' : cacheHitTrend < -0.05 ? 'declining' : 'stable',
      assembleTime: timeTrend > 10 ? 'improving' : timeTrend < -10 ? 'declining' : 'stable',
    };
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latest) return '暂无数据';

    const trends = this.getTrends();
    const uptimeMinutes = Math.floor(latest.system.uptime / 1000 / 60);

    return `
📊 OpenClaw 优化仪表板
━━━━━━━━━━━━━━━━━━━━━
⏰ 运行时间: ${uptimeMinutes} 分钟

🎯 上下文引擎
  • 缓存命中率: ${(latest.contextEngine.cacheHitRate * 100).toFixed(1)}% (${trends.cacheHitRate === 'improving' ? '↑' : trends.cacheHitRate === 'declining' ? '↓' : '→'})
  • 平均组装时间: ${latest.contextEngine.averageAssembleTime.toFixed(2)}ms
  • 总组装次数: ${latest.contextEngine.totalAssembles}
  • 压缩率: ${(latest.contextEngine.compressionRatio * 100).toFixed(1)}%

🤖 多智能体
  • 活跃团队: ${latest.multiAgent.teamsActive}
  • 活跃智能体: ${latest.multiAgent.agentsActive}
  • 完成任务: ${latest.multiAgent.tasksCompleted}

🧠 自我意识
  • 进行中目标: ${latest.selfAwareness.activeGoals}
  • 已完成目标: ${latest.selfAwareness.completedGoals}
  • 待改进领域: ${latest.selfAwareness.improvementAreas}

💻 系统
  • 内存使用: ${(latest.system.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)}MB
    `.trim();
  }

  /**
   * 获取历史指标
   */
  getHistory(): DashboardMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.metricsHistory = [];
  }
}

// 全局实例
let globalDashboard: OptimizationDashboard | null = null;

export function getGlobalDashboard(): OptimizationDashboard {
  if (!globalDashboard) {
    globalDashboard = new OptimizationDashboard();
  }
  return globalDashboard;
}

export function resetGlobalDashboard(): void {
  globalDashboard = null;
}
