/**
 * OpenClaw 多智能体协作模块
 * 
 * 基于 ClawTeam 的多智能体协调能力，为 OpenClaw 提供原生支持
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// ==================== 类型定义 ====================

export interface AgentTeam {
  name: string;
  description?: string;
  agents: AgentInfo[];
  createdAt: Date;
}

export interface AgentInfo {
  name: string;
  type: string;
  id: string;
  status: 'active' | 'idle' | 'busy' | 'offline';
  currentTask?: string;
}

export interface Task {
  id: string;
  subject: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  owner: string;
  description?: string;
}

export interface TeamMessage {
  from: string;
  to: string;
  content: string;
  timestamp: Date;
}

// ==================== ClawTeam 集成器 ====================

export class ClawTeamIntegrator {
  private clawteamPath: string;
  private venvPath: string;

  constructor(workspacePath: string = '/root/.openclaw/workspace/ClawTeam-OpenClaw') {
    this.clawteamPath = workspacePath;
    this.venvPath = path.join(workspacePath, '.venv');
  }

  /**
   * 执行 clawteam 命令
   */
  private async execClawTeam(command: string): Promise<string> {
    const fullCommand = `source ${this.venvPath}/bin/activate && clawteam ${command}`;
    const { stdout, stderr } = await execAsync(fullCommand, {
      shell: '/bin/bash',
    });
    
    if (stderr && !stderr.includes('WARNING')) {
      throw new Error(`ClawTeam error: ${stderr}`);
    }
    
    return stdout;
  }

  /**
   * 启动团队
   */
  async launchTeam(
    template: string,
    goal: string,
    teamName?: string
  ): Promise<AgentTeam> {
    const nameArg = teamName ? `--team-name ${teamName}` : '';
    const output = await this.execClawTeam(
      `launch ${template} --goal "${goal}" ${nameArg}`
    );

    // 解析输出获取团队信息
    const team: AgentTeam = {
      name: teamName || `${template}-team`,
      description: goal,
      agents: this.parseAgentsFromOutput(output),
      createdAt: new Date(),
    };

    return team;
  }

  /**
   * 从输出中解析智能体信息
   */
  private parseAgentsFromOutput(output: string): AgentInfo[] {
    const agents: AgentInfo[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // 简单的解析逻辑，实际应该更复杂
      if (line.includes('│') && !line.includes('━') && !line.includes('┏') && !line.includes('┗')) {
        const parts = line.split('│').filter(p => p.trim());
        if (parts.length >= 3) {
          agents.push({
            name: parts[0].trim(),
            type: parts[1].trim(),
            id: parts[2].trim(),
            status: 'active',
          });
        }
      }
    }

    return agents;
  }

  /**
   * 获取团队状态
   */
  async getTeamStatus(teamName: string): Promise<AgentTeam | null> {
    try {
      const output = await this.execClawTeam(`team status ${teamName}`);
      // 解析输出...
      return {
        name: teamName,
        agents: [],
        createdAt: new Date(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取任务列表
   */
  async getTasks(teamName: string): Promise<Task[]> {
    const output = await this.execClawTeam(`task list ${teamName}`);
    return this.parseTasksFromOutput(output);
  }

  /**
   * 解析任务输出
   */
  private parseTasksFromOutput(output: string): Task[] {
    const tasks: Task[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('│') && !line.includes('━') && !line.includes('┏') && !line.includes('┗')) {
        const parts = line.split('│').filter(p => p.trim());
        if (parts.length >= 4) {
          tasks.push({
            id: parts[0].trim(),
            subject: parts[1].trim(),
            status: parts[2].trim() as Task['status'],
            owner: parts[3].trim(),
          });
        }
      }
    }

    return tasks;
  }

  /**
   * 发送消息给智能体
   */
  async sendMessage(
    teamName: string,
    agentName: string,
    message: string
  ): Promise<void> {
    await this.execClawTeam(
      `inbox send ${teamName} ${agentName} "${message}"`
    );
  }

  /**
   * 读取消息
   */
  async readMessages(teamName: string, agentName: string): Promise<TeamMessage[]> {
    const output = await this.execClawTeam(
      `inbox peek ${teamName} --agent ${agentName}`
    );
    return this.parseMessagesFromOutput(output);
  }

  /**
   * 解析消息输出
   */
  private parseMessagesFromOutput(output: string): TeamMessage[] {
    const messages: TeamMessage[] = [];
    // 简化实现
    return messages;
  }

  /**
   * 清理团队
   */
  async cleanupTeam(teamName: string): Promise<void> {
    await this.execClawTeam(`team cleanup ${teamName}`);
  }

  /**
   * 检查 ClawTeam 是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.execClawTeam('--version');
      return true;
    } catch {
      return false;
    }
  }
}

// ==================== 智能代码审查器 ====================

export class SmartCodeReviewer {
  private integrator: ClawTeamIntegrator;

  constructor() {
    this.integrator = new ClawTeamIntegrator();
  }

  /**
   * 审查代码
   */
  async reviewCode(
    filePath: string,
    focus?: 'security' | 'performance' | 'architecture' | 'all'
  ): Promise<{
    team: AgentTeam;
    summary: string;
    suggestions: string[];
  }> {
    // 确定使用的模板
    const template = 'code-review';
    const goal = `审查文件: ${filePath}${focus ? `, 重点关注: ${focus}` : ''}`;

    // 启动审查团队
    const teamName = `review-${Date.now()}`;
    const team = await this.integrator.launchTeam(template, goal, teamName);

    // 发送审查指令
    await this.integrator.sendMessage(
      teamName,
      'lead-reviewer',
      `请开始审查 ${filePath}`
    );

    // 等待审查完成（简化实现）
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 获取任务状态
    const tasks = await this.integrator.getTasks(teamName);

    return {
      team,
      summary: `代码审查团队已启动，共 ${team.agents.length} 个审查员`,
      suggestions: tasks.map(t => `${t.owner}: ${t.subject}`),
    };
  }

  /**
   * 优化代码
   */
  async optimizeCode(
    filePath: string,
    goals: string[]
  ): Promise<AgentTeam> {
    const template = 'strategy-room';
    const goal = `优化 ${filePath}，目标: ${goals.join(', ')}`;
    const teamName = `optimize-${Date.now()}`;

    return await this.integrator.launchTeam(template, goal, teamName);
  }
}

// ==================== 全局实例 ====================

let globalClawTeamIntegrator: ClawTeamIntegrator | null = null;
let globalCodeReviewer: SmartCodeReviewer | null = null;

export function getGlobalClawTeamIntegrator(): ClawTeamIntegrator {
  if (!globalClawTeamIntegrator) {
    globalClawTeamIntegrator = new ClawTeamIntegrator();
  }
  return globalClawTeamIntegrator;
}

export function getGlobalCodeReviewer(): SmartCodeReviewer {
  if (!globalCodeReviewer) {
    globalCodeReviewer = new SmartCodeReviewer();
  }
  return globalCodeReviewer;
}

export function resetGlobalClawTeam(): void {
  globalClawTeamIntegrator = null;
  globalCodeReviewer = null;
}
