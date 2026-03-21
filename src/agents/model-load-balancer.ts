/**
 * OpenClaw 模型负载均衡器
 * 
 * 负载均衡多个模型：
 * 1. 轮询调度
 * 2. 加权调度
 * 3. 最少连接
 * 4. 响应时间优先
 */

export interface ModelEndpoint {
  provider: string;
  model: string;
  weight: number;
  activeRequests: number;
  avgResponseTime: number;
  successRate: number;
  available: boolean;
}

export class ModelLoadBalancer {
  private endpoints: Map<string, ModelEndpoint> = new Map();
  private strategy: 'round-robin' | 'weighted' | 'least-connections' | 'response-time' = 'weighted';
  private roundRobinIndex: number = 0;

  constructor() {
    console.log('[LoadBalancer] 初始化完成');
  }

  /**
   * 添加端点
   */
  addEndpoint(provider: string, model: string, weight: number = 1): void {
    const key = `${provider}/${model}`;
    this.endpoints.set(key, {
      provider,
      model,
      weight,
      activeRequests: 0,
      avgResponseTime: 0,
      successRate: 100,
      available: true,
    });
  }

  /**
   * 选择端点
   */
  selectEndpoint(): ModelEndpoint | null {
    const available = Array.from(this.endpoints.values()).filter(e => e.available);
    if (available.length === 0) return null;

    switch (this.strategy) {
      case 'round-robin':
        return this.selectRoundRobin(available);
      case 'weighted':
        return this.selectWeighted(available);
      case 'least-connections':
        return this.selectLeastConnections(available);
      case 'response-time':
        return this.selectResponseTime(available);
      default:
        return available[0];
    }
  }

  /**
   * 轮询选择
   */
  private selectRoundRobin(endpoints: ModelEndpoint[]): ModelEndpoint {
    const endpoint = endpoints[this.roundRobinIndex % endpoints.length];
    this.roundRobinIndex++;
    return endpoint;
  }

  /**
   * 加权选择
   */
  private selectWeighted(endpoints: ModelEndpoint[]): ModelEndpoint {
    const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;

    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return endpoints[0];
  }

  /**
   * 最少连接选择
   */
  private selectLeastConnections(endpoints: ModelEndpoint[]): ModelEndpoint {
    return endpoints.reduce((min, e) => 
      e.activeRequests < min.activeRequests ? e : min
    );
  }

  /**
   * 响应时间优先选择
   */
  private selectResponseTime(endpoints: ModelEndpoint[]): ModelEndpoint {
    return endpoints.reduce((min, e) => 
      e.avgResponseTime < min.avgResponseTime ? e : min
    );
  }

  /**
   * 记录请求开始
   */
  recordRequestStart(provider: string, model: string): void {
    const key = `${provider}/${model}`;
    const endpoint = this.endpoints.get(key);
    if (endpoint) {
      endpoint.activeRequests++;
    }
  }

  /**
   * 记录请求结束
   */
  recordRequestEnd(provider: string, model: string, duration: number, success: boolean): void {
    const key = `${provider}/${model}`;
    const endpoint = this.endpoints.get(key);
    if (endpoint) {
      endpoint.activeRequests--;
      endpoint.avgResponseTime = (endpoint.avgResponseTime + duration) / 2;
      endpoint.successRate = success
        ? Math.min(100, endpoint.successRate + 1)
        : Math.max(0, endpoint.successRate - 1);
    }
  }

  /**
   * 设置端点可用性
   */
  setAvailability(provider: string, model: string, available: boolean): void {
    const key = `${provider}/${model}`;
    const endpoint = this.endpoints.get(key);
    if (endpoint) {
      endpoint.available = available;
    }
  }

  /**
   * 设置策略
   */
  setStrategy(strategy: ModelLoadBalancer['strategy']): void {
    this.strategy = strategy;
  }

  /**
   * 获取统计
   */
  getStats(): {
    endpointCount: number;
    availableCount: number;
    strategy: string;
  } {
    const availableCount = Array.from(this.endpoints.values()).filter(e => e.available).length;
    return {
      endpointCount: this.endpoints.size,
      availableCount,
      strategy: this.strategy,
    };
  }
}

let globalLoadBalancer: ModelLoadBalancer | null = null;

export function getGlobalLoadBalancer(): ModelLoadBalancer {
  if (!globalLoadBalancer) {
    globalLoadBalancer = new ModelLoadBalancer();
  }
  return globalLoadBalancer;
}
