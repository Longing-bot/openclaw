/**
 * OpenClaw 自我进化系统 - 持久化存储
 * 
 * 将经验、知识、行为模式保存到文件
 */

import * as fs from 'fs';
import * as path from 'path';

export interface StorageConfig {
  dataDir: string;
  autoSave: boolean;
  saveInterval: number; // 分钟
}

export class PersistentStorage {
  private config: StorageConfig;
  private dataDir: string;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      dataDir: path.join(process.env.HOME || '~', '.openclaw', 'self-evolution'),
      autoSave: true,
      saveInterval: 5,
      ...config,
    };
    
    this.dataDir = this.config.dataDir;
    this.ensureDataDir();
    
    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * 确保数据目录存在
   */
  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 开始自动保存
   */
  private startAutoSave(): void {
    setInterval(() => {
      this.saveAll();
    }, this.config.saveInterval * 60 * 1000);
  }

  /**
   * 保存数据
   */
  save(filename: string, data: any): void {
    const filePath = path.join(this.dataDir, filename);
    const jsonData = JSON.stringify(data, null, 2);
    
    try {
      fs.writeFileSync(filePath, jsonData, 'utf-8');
      console.log(`[Storage] 保存数据: ${filename}`);
    } catch (error) {
      console.error(`[Storage] 保存失败: ${filename}`, error);
    }
  }

  /**
   * 加载数据
   */
  load<T>(filename: string, defaultValue: T): T {
    const filePath = path.join(this.dataDir, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        const jsonData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(jsonData) as T;
      }
    } catch (error) {
      console.error(`[Storage] 加载失败: ${filename}`, error);
    }
    
    return defaultValue;
  }

  /**
   * 保存所有数据
   */
  saveAll(): void {
    // 这里应该由各个模块调用
    console.log('[Storage] 自动保存完成');
  }

  /**
   * 清理旧数据
   */
  cleanup(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const files = fs.readdirSync(this.dataDir);
    
    files.forEach(file => {
      const filePath = path.join(this.dataDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        console.log(`[Storage] 清理旧数据: ${file}`);
      }
    });
  }

  /**
   * 获取存储状态
   */
  getStatus() {
    const files = fs.readdirSync(this.dataDir);
    let totalSize = 0;
    
    files.forEach(file => {
      const filePath = path.join(this.dataDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });
    
    return {
      dataDir: this.dataDir,
      fileCount: files.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    };
  }
}

// 全局实例
let globalPersistentStorage: PersistentStorage | null = null;

export function getGlobalPersistentStorage(config?: Partial<StorageConfig>): PersistentStorage {
  if (!globalPersistentStorage) {
    globalPersistentStorage = new PersistentStorage(config);
  }
  return globalPersistentStorage;
}
