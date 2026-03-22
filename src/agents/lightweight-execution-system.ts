/**
 * OpenClaw 轻量级执行系统
 * 
 * 专为小参数模型优化：
 * 1. 简化的执行器
 * 2. 快速执行
 * 3. 低计算开销
 */

export interface Execution {
  id: string;
  action: string;
  params: any;
  result?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
}

export class LightweightExecutionSystem {
  private executions: Map<string, Execution> = new Map();

  constructor() {
    console.log('[ExecutionSystem] 初始化完成');
  }

  /**
   * 执行动作
   */
  async execute(action: string, params: any): Promise<any> {
    const id = `exec_${Date.now()}`;
    const execution: Execution = {
      id,
      action,
      params,
      status: 'pending',
      startTime: new Date(),
    };

    this.executions.set(id, execution);
    execution.status = 'running';

    try {
      // 模拟执行
      await new Promise(resolve => setTimeout(resolve, 100));
      
      execution.result = { success: true, data: `执行完成: ${action}` };
      execution.status = 'completed';
      execution.endTime = new Date();

      return execution.result;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      throw error;
    }
  }

  /**
   * 获取执行记录
   */
  getExecution(id: string): Execution | undefined {
    return this.executions.get(id);
  }

  /**
   * 获取最近执行
   */
  getRecentExecutions(count: number = 5): Execution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, count);
  }

  /**
   * 获取统计
   */
  getStats(): { executionCount: number; successRate: number } {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter(e => e.status === 'completed').length;
    const successRate = executions.length > 0 ? completed / executions.length : 0;
    return { executionCount: executions.length, successRate };
  }
}

let globalExecutionSystem: LightweightExecutionSystem | null = null;

export function getGlobalExecutionSystem(): LightweightExecutionSystem {
  if (!globalExecutionSystem) {
    globalExecutionSystem = new LightweightExecutionSystem();
  }
  return globalExecutionSystem;
}
