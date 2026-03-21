/**
 * OpenClaw Page Agent
 * 
 * 基于 page-agent 思想，原生实现的页面 GUI Agent
 * 核心：用自然语言控制网页界面
 */

// ==================== 类型定义 ====================

export interface PageAction {
  type: 'click' | 'fill' | 'select' | 'scroll' | 'navigate' | 'wait' | 'extract';
  target?: string;  // CSS 选择器或描述
  value?: string;   // 填充的值
  description: string;
}

export interface PageAgentConfig {
  language?: 'zh-CN' | 'en-US';
  maxRetries?: number;
  timeout?: number;
}

export interface ActionResult {
  success: boolean;
  action: PageAction;
  error?: string;
  extracted?: string;
}

// ==================== DOM 操作工具 ====================

class DOMHelper {
  /**
   * 查找元素（支持文本匹配）
   */
  static findElement(selector: string): Element | null {
    // 尝试 CSS 选择器
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch {}

    // 尝试文本匹配
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const text = el.textContent?.trim() || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      const placeholder = el.getAttribute('placeholder') || '';
      const title = el.getAttribute('title') || '';

      if (
        text.includes(selector) ||
        ariaLabel.includes(selector) ||
        placeholder.includes(selector) ||
        title.includes(selector)
      ) {
        return el;
      }
    }

    return null;
  }

  /**
   * 获取可交互元素列表
   */
  static getInteractiveElements(): Element[] {
    const selectors = [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[onclick]',
      '[tabindex]',
    ];

    return Array.from(document.querySelectorAll(selectors.join(',')))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
  }

  /**
   * 获取元素描述（用于 LLM 理解）
   */
  static getElementDescription(el: Element): string {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim().slice(0, 50) || '';
    const ariaLabel = el.getAttribute('aria-label') || '';
    const placeholder = el.getAttribute('placeholder') || '';
    const role = el.getAttribute('role') || '';
    const href = el.getAttribute('href') || '';

    const parts = [
      `<${tag}>`,
      text && `"${text}"`,
      ariaLabel && `aria-label="${ariaLabel}"`,
      placeholder && `placeholder="${placeholder}"`,
      role && `role="${role}"`,
      href && `href="${href.slice(0, 50)}"`,
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * 获取页面摘要
   */
  static getPageSummary(): string {
    const title = document.title;
    const url = window.location.href;
    const h1 = document.querySelector('h1')?.textContent?.trim() || '';
    
    const interactiveElements = this.getInteractiveElements()
      .slice(0, 20)
      .map((el, i) => `  ${i + 1}. ${this.getElementDescription(el)}`);

    return `
页面: ${title}
URL: ${url}
标题: ${h1}

可交互元素:
${interactiveElements.join('\n')}
    `.trim();
  }
}

// ==================== 动作执行器 ====================

class ActionExecutor {
  /**
   * 执行点击
   */
  static async click(target: string): Promise<ActionResult> {
    const el = DOMHelper.findElement(target);
    if (!el) {
      return { success: false, action: { type: 'click', target, description: `点击 ${target}` }, error: '找不到元素' };
    }

    try {
      (el as HTMLElement).click();
      return { success: true, action: { type: 'click', target, description: `点击 ${target}` } };
    } catch (error) {
      return { success: false, action: { type: 'click', target, description: `点击 ${target}` }, error: String(error) };
    }
  }

  /**
   * 执行填充
   */
  static async fill(target: string, value: string): Promise<ActionResult> {
    const el = DOMHelper.findElement(target) as HTMLInputElement;
    if (!el) {
      return { success: false, action: { type: 'fill', target, value, description: `在 ${target} 填入 ${value}` }, error: '找不到输入框' };
    }

    try {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true, action: { type: 'fill', target, value, description: `在 ${target} 填入 ${value}` } };
    } catch (error) {
      return { success: false, action: { type: 'fill', target, value, description: `在 ${target} 填入 ${value}` }, error: String(error) };
    }
  }

  /**
   * 执行滚动
   */
  static async scroll(direction: 'up' | 'down', amount = 500): Promise<ActionResult> {
    try {
      window.scrollBy(0, direction === 'down' ? amount : -amount);
      return { success: true, action: { type: 'scroll', description: `向${direction === 'down' ? '下' : '上'}滚动 ${amount}px` } };
    } catch (error) {
      return { success: false, action: { type: 'scroll', description: `滚动` }, error: String(error) };
    }
  }

  /**
   * 执行导航
   */
  static async navigate(url: string): Promise<ActionResult> {
    try {
      window.location.href = url;
      return { success: true, action: { type: 'navigate', value: url, description: `导航到 ${url}` } };
    } catch (error) {
      return { success: false, action: { type: 'navigate', value: url, description: `导航到 ${url}` }, error: String(error) };
    }
  }

  /**
   * 执行等待
   */
  static async wait(ms: number): Promise<ActionResult> {
    await new Promise(resolve => setTimeout(resolve, ms));
    return { success: true, action: { type: 'wait', description: `等待 ${ms}ms` } };
  }

  /**
   * 提取文本
   */
  static async extract(target?: string): Promise<ActionResult> {
    try {
      const text = target
        ? DOMHelper.findElement(target)?.textContent || ''
        : document.body.innerText.slice(0, 2000);
      
      return { 
        success: true, 
        action: { type: 'extract', target, description: `提取文本` },
        extracted: text.trim()
      };
    } catch (error) {
      return { success: false, action: { type: 'extract', target, description: `提取文本` }, error: String(error) };
    }
  }
}

// ==================== Page Agent 主类 ====================

export class PageAgent {
  private config: PageAgentConfig;
  private actionHistory: ActionResult[] = [];

  constructor(config: PageAgentConfig = {}) {
    this.config = {
      language: 'zh-CN',
      maxRetries: 3,
      timeout: 10000,
      ...config,
    };
  }

  /**
   * 执行动作
   */
  async execute(action: PageAction): Promise<ActionResult> {
    let result: ActionResult;

    switch (action.type) {
      case 'click':
        result = await ActionExecutor.click(action.target || '');
        break;
      case 'fill':
        result = await ActionExecutor.fill(action.target || '', action.value || '');
        break;
      case 'scroll':
        result = await ActionExecutor.scroll(
          action.description.includes('上') ? 'up' : 'down'
        );
        break;
      case 'navigate':
        result = await ActionExecutor.navigate(action.value || '');
        break;
      case 'wait':
        result = await ActionExecutor.wait(parseInt(action.value || '1000'));
        break;
      case 'extract':
        result = await ActionExecutor.extract(action.target);
        break;
      default:
        result = { success: false, action, error: `未知动作类型: ${action.type}` };
    }

    this.actionHistory.push(result);
    return result;
  }

  /**
   * 执行自然语言指令
   */
  async executeCommand(command: string): Promise<ActionResult> {
    const action = this.parseCommand(command);
    return this.execute(action);
  }

  /**
   * 解析自然语言为动作
   */
  private parseCommand(command: string): PageAction {
    const cmd = command.toLowerCase().trim();

    // 点击模式
    if (cmd.includes('点击') || cmd.includes('click')) {
      const target = command.replace(/点击|click/gi, '').trim();
      return { type: 'click', target, description: command };
    }

    // 填写模式
    if (cmd.includes('填写') || cmd.includes('输入') || cmd.includes('fill')) {
      const match = command.match(/(?:填写|输入|fill)\s*(.+?)(?:\s*(?:为|with|：)\s*(.+))?$/i);
      if (match) {
        return { type: 'fill', target: match[1], value: match[2] || '', description: command };
      }
    }

    // 滚动模式
    if (cmd.includes('滚动') || cmd.includes('scroll')) {
      const direction = cmd.includes('上') || cmd.includes('up') ? 'up' : 'down';
      return { type: 'scroll', description: command };
    }

    // 导航模式
    if (cmd.includes('打开') || cmd.includes('导航') || cmd.includes('navigate') || cmd.includes('go to')) {
      const url = command.replace(/打开|导航|navigate|go to/gi, '').trim();
      if (url.includes('http') || url.includes('.')) {
        return { type: 'navigate', value: url, description: command };
      }
    }

    // 提取模式
    if (cmd.includes('提取') || cmd.includes('获取') || cmd.includes('extract') || cmd.includes('get')) {
      return { type: 'extract', description: command };
    }

    // 默认：尝试点击
    return { type: 'click', target: command, description: command };
  }

  /**
   * 获取页面摘要
   */
  getPageSummary(): string {
    return DOMHelper.getPageSummary();
  }

  /**
   * 获取可交互元素
   */
  getInteractiveElements(): Array<{ index: number; description: string }> {
    return DOMHelper.getInteractiveElements().map((el, i) => ({
      index: i + 1,
      description: DOMHelper.getElementDescription(el),
    }));
  }

  /**
   * 获取动作历史
   */
  getHistory(): ActionResult[] {
    return [...this.actionHistory];
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.actionHistory = [];
  }
}

// ==================== 导出 ====================

export function createPageAgent(config?: PageAgentConfig): PageAgent {
  return new PageAgent(config);
}
