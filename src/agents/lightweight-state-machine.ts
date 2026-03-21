/**
 * OpenClaw 轻量级状态机
 * 
 * 专为小参数模型优化：
 * 1. 简化的状态管理
 * 2. 快速状态切换
 * 3. 低计算开销
 */

export interface State {
  name: string;
  onEnter?: () => void;
  onExit?: () => void;
  transitions: Map<string, string>;
}

export class LightweightStateMachine {
  private states: Map<string, State> = new Map();
  private currentState: string | null = null;

  constructor() {
    console.log('[StateMachine] 初始化完成');
  }

  /**
   * 添加状态
   */
  addState(name: string, onEnter?: () => void, onExit?: () => void): void {
    this.states.set(name, {
      name,
      onEnter,
      onExit,
      transitions: new Map(),
    });
  }

  /**
   * 添加转换
   */
  addTransition(from: string, event: string, to: string): void {
    const state = this.states.get(from);
    if (state) {
      state.transitions.set(event, to);
    }
  }

  /**
   * 设置初始状态
   */
  setInitialState(name: string): void {
    if (this.states.has(name)) {
      this.currentState = name;
      const state = this.states.get(name)!;
      state.onEnter?.();
    }
  }

  /**
   * 处理事件
   */
  handleEvent(event: string): boolean {
    if (!this.currentState) return false;

    const state = this.states.get(this.currentState);
    if (!state) return false;

    const nextState = state.transitions.get(event);
    if (!nextState) return false;

    // 执行转换
    state.onExit?.();
    this.currentState = nextState;
    const newState = this.states.get(nextState)!;
    newState.onEnter?.();

    return true;
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): string | null {
    return this.currentState;
  }

  /**
   * 获取可用事件
   */
  getAvailableEvents(): string[] {
    if (!this.currentState) return [];

    const state = this.states.get(this.currentState);
    if (!state) return [];

    return Array.from(state.transitions.keys());
  }
}

let globalStateMachine: LightweightStateMachine | null = null;

export function getGlobalStateMachine(): LightweightStateMachine {
  if (!globalStateMachine) {
    globalStateMachine = new LightweightStateMachine();
  }
  return globalStateMachine;
}
