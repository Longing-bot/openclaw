import { BaseSystem, now, generateId, ManagedArray } from "./superclaw-base.js";
/**
 * OpenClaw SuperClaw 监控系统 (优化版)
 * 
 * 设计原则：轻量化、高效率、低开销
 */

// ==================== 工具函数 ====================
// ==================== 监控系统 ====================

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

export class MonitoringSystem {
  private metrics: Metric[] = [];
  private maxMetrics = 1000;

  record(name: string, value: number, tags: Record<string, string> = {}): void {
    this.metrics.push({
      name,
      value,
      timestamp: now(),
      tags,
    });

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  query(name: string, since?: number): Metric[] {
    return this.metrics.filter(m => 
      m.name === name && 
      (!since || m.timestamp >= since)
    );
  }

  getAverage(name: string, since?: number): number {
    const metrics = this.query(name, since);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  clear(): void {
    this.metrics = [];
  }
}

// ==================== 性能分析器 ====================

interface PerformanceEntry {
  name: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

export class PerformanceAnalyzer {
  private entries: PerformanceEntry[] = [];
  private maxEntries = 100;

  startTimer(name: string): () => void {
    const start = now();
    
    return (success: boolean = true) => {
      const duration = now() - start;
      this.record(name, duration, success);
    };
  }

  record(name: string, duration: number, success: boolean = true): void {
    this.entries.push({
      name,
      duration,
      timestamp: now(),
      success,
    });

    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getStats(name: string): { avg: number; min: number; max: number; count: number; successRate: number } {
    const entries = this.entries.filter(e => e.name === name);
    if (entries.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0, successRate: 0 };
    }

    const durations = entries.map(e => e.duration);
    const successCount = entries.filter(e => e.success).length;

    return {
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: entries.length,
      successRate: successCount / entries.length,
    };
  }

  getSlowest(limit: number = 5): PerformanceEntry[] {
    return [...this.entries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  clear(): void {
    this.entries = [];
  }
}

// ==================== 健康检查器 ====================

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  message?: string;
}

export class HealthChecker {
  private checks = new Map<string, HealthCheck>();
  private checkFunctions = new Map<string, () => Promise<boolean>>();

  registerCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.checkFunctions.set(name, checkFn);
  }

  async runCheck(name: string): Promise<HealthCheck> {
    const checkFn = this.checkFunctions.get(name);
    if (!checkFn) {
      throw new Error(`Check not found: ${name}`);
    }

    try {
      const healthy = await checkFn();
      const check: HealthCheck = {
        name,
        status: healthy ? 'healthy' : 'unhealthy',
        lastCheck: now(),
        message: healthy ? 'OK' : 'Check failed',
      };
      this.checks.set(name, check);
      return check;
    } catch (error) {
      const check: HealthCheck = {
        name,
        status: 'unhealthy',
        lastCheck: now(),
        message: error instanceof Error ? error.message : String(error),
      };
      this.checks.set(name, check);
      return check;
    }
  }

  async runAllChecks(): Promise<HealthCheck[]> {
    const results: HealthCheck[] = [];
    
    for (const name of this.checkFunctions.keys()) {
      const check = await this.runCheck(name);
      results.push(check);
    }
    
    return results;
  }

  getOverallStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Array.from(this.checks.values()).map(c => c.status);
    
    if (statuses.every(s => s === 'healthy')) return 'healthy';
    if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
    return 'degraded';
  }

  clear(): void {
    this.checks.clear();
    this.checkFunctions.clear();
  }
}

// ==================== 日志系统 ====================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: any;
}

export class Logger {
  private entries: LogEntry[] = [];
  private maxEntries = 500;
  private minLevel: LogLevel = 'info';

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (this.levelPriority[level] < this.levelPriority[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: now(),
      data,
    };

    this.entries.push(entry);
    
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    const prefix = `[${level.toUpperCase()}] ${new Date(entry.timestamp).toISOString()}`;
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  getEntries(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.entries;
    
    if (level) {
      filtered = filtered.filter(e => e.level === level);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  clear(): void {
    this.entries = [];
  }
}

// ==================== 配置管理器 ====================

export class ConfigManager {
  private config: Record<string, any> = {};
  private watchers = new Map<string, Set<(value: any) => void>>();

  set(key: string, value: any): void {
    const oldValue = this.config[key];
    this.config[key] = value;

    if (oldValue !== value) {
      this.notifyWatchers(key, value);
    }
  }

  get<T>(key: string, defaultValue?: T): T {
    return this.config[key] ?? defaultValue;
  }

  has(key: string): boolean {
    return key in this.config;
  }

  delete(key: string): void {
    delete this.config[key];
    this.notifyWatchers(key, undefined);
  }

  watch(key: string, callback: (value: any) => void): () => void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    this.watchers.get(key)!.add(callback);

    return () => {
      this.watchers.get(key)?.delete(callback);
    };
  }

  private notifyWatchers(key: string, value: any): void {
    const callbacks = this.watchers.get(key);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(value);
        } catch (error) {
          console.error(`Config watcher error for ${key}:`, error);
        }
      }
    }
  }

  getAll(): Record<string, any> {
    return { ...this.config };
  }

  clear(): void {
    this.config = {};
    this.watchers.clear();
  }
}

// ==================== 统一监控系统 ====================

export class SuperClawMonitoringSystem {
  public metrics: MonitoringSystem;
  public performance: PerformanceAnalyzer;
  public health: HealthChecker;
  public logger: Logger;
  public config: ConfigManager;

  constructor() {
    this.metrics = new MonitoringSystem();
    this.performance = new PerformanceAnalyzer();
    this.health = new HealthChecker();
    this.logger = new Logger();
    this.config = new ConfigManager();

    // 注册默认健康检查
    this.registerDefaultChecks();
  }

  private registerDefaultChecks(): void {
    this.health.registerCheck('memory', async () => {
      const used = process.memoryUsage();
      return used.heapUsed < 500 * 1024 * 1024; // 500MB
    });

    this.health.registerCheck('uptime', async () => {
      return process.uptime() > 0;
    });
  }

  async getSystemStatus(): Promise<{
    health: 'healthy' | 'degraded' | 'unhealthy';
    metrics: Record<string, number>;
    performance: Record<string, any>;
    logs: number;
  }> {
    const healthStatus = this.health.getOverallStatus();

    return {
      health: healthStatus,
      metrics: {
        totalMetrics: this.metrics['metrics'].length,
        totalLogs: this.logger['entries'].length,
      },
      performance: {},
      logs: this.logger['entries'].length,
    };
  }

  getStats(): Record<string, any> {
    return {
      metrics: this.metrics['metrics'].length,
      logs: this.logger['entries'].length,
      healthChecks: this.health['checks'].size,
    };
  }

  clear(): void {
    this.metrics.clear();
    this.performance.clear();
    this.health.clear();
    this.logger.clear();
    this.config.clear();
  }
}

// ==================== 全局实例 ====================

let globalMonitoringSystem: SuperClawMonitoringSystem | null = null;

export function getGlobalMonitoringSystem(): SuperClawMonitoringSystem {
  if (!globalMonitoringSystem) {
    globalMonitoringSystem = new SuperClawMonitoringSystem();
  }
  return globalMonitoringSystem;
}

export function resetGlobalMonitoringSystem(): void {
  globalMonitoringSystem = null;
}
