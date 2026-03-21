/**
 * OpenClaw 模型推理链
 * 
 * 链式推理：
 * 1. 步骤分解
 * 2. 中间推理
 * 3. 结论推导
 */

export interface ReasoningStep {
  id: string;
  input: string;
  reasoning: string;
  output: string;
}

export class ModelReasoningChain {
  private steps: ReasoningStep[] = [];

  constructor() {
    console.log('[ReasoningChain] 初始化完成');
  }

  /**
   * 添加推理步骤
   */
  addStep(input: string, reasoning: string, output: string): string {
    const id = `step_${Date.now()}`;
    this.steps.push({ id, input, reasoning, output });
    return id;
  }

  /**
   * 获取推理链
   */
  getChain(): ReasoningStep[] {
    return [...this.steps];
  }

  /**
   * 获取最终结论
   */
  getConclusion(): string {
    if (this.steps.length === 0) return '';
    return this.steps[this.steps.length - 1].output;
  }

  /**
   * 生成推理报告
   */
  generateReport(): string {
    let report = '# 推理链\n\n';

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      report += `## 步骤 ${i + 1}\n`;
      report += `输入: ${step.input}\n`;
      report += `推理: ${step.reasoning}\n`;
      report += `输出: ${step.output}\n\n`;
    }

    report += `## 结论\n${this.getConclusion()}\n`;

    return report;
  }

  /**
   * 清空推理链
   */
  clear(): void {
    this.steps = [];
  }
}

let globalReasoningChain: ModelReasoningChain | null = null;

export function getGlobalReasoningChain(): ModelReasoningChain {
  if (!globalReasoningChain) {
    globalReasoningChain = new ModelReasoningChain();
  }
  return globalReasoningChain;
}
