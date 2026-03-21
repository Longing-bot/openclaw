/**
 * OpenClaw 自我进化系统 - 记忆系统集成
 * 
 * 与 MEMORY.md 和 memory/*.md 配合
 */

import * as fs from 'fs';
import * as path from 'path';

export interface MemoryEntry {
  id: string;
  timestamp: Date;
  type: 'experience' | 'knowledge' | 'lesson' | 'goal' | 'reflection';
  content: string;
  tags: string[];
  importance: number; // 0-100
  source: string;
}

export class MemoryIntegration {
  private memoryDir: string;
  private memoryFile: string;
  private dailyMemoryDir: string;

  constructor() {
    this.memoryDir = path.join(process.env.HOME || '~', '.openclaw', 'workspace');
    this.memoryFile = path.join(this.memoryDir, 'MEMORY.md');
    this.dailyMemoryDir = path.join(this.memoryDir, 'memory');
  }

  /**
   * 写入长期记忆
   */
  writeToLongTermMemory(entry: MemoryEntry): void {
    const content = this.formatMemoryEntry(entry);
    
    try {
      // 读取现有内容
      let existingContent = '';
      if (fs.existsSync(this.memoryFile)) {
        existingContent = fs.readFileSync(this.memoryFile, 'utf-8');
      }
      
      // 添加新内容
      const timestamp = entry.timestamp.toISOString().split('T')[0];
      const newContent = `\n## ${entry.type} - ${timestamp}\n${content}\n`;
      
      // 写入文件
      fs.writeFileSync(this.memoryFile, existingContent + newContent, 'utf-8');
      console.log(`[MemoryIntegration] 写入长期记忆: ${entry.type}`);
    } catch (error) {
      console.error('[MemoryIntegration] 写入失败', error);
    }
  }

  /**
   * 写入每日记忆
   */
  writeToDailyMemory(entry: MemoryEntry): void {
    const date = entry.timestamp.toISOString().split('T')[0];
    const dailyFile = path.join(this.dailyMemoryDir, `${date}.md`);
    
    try {
      // 确保目录存在
      if (!fs.existsSync(this.dailyMemoryDir)) {
        fs.mkdirSync(this.dailyMemoryDir, { recursive: true });
      }
      
      // 读取现有内容
      let existingContent = '';
      if (fs.existsSync(dailyFile)) {
        existingContent = fs.readFileSync(dailyFile, 'utf-8');
      }
      
      // 添加新内容
      const content = this.formatMemoryEntry(entry);
      const time = entry.timestamp.toTimeString().split(' ')[0];
      const newContent = `\n### ${time} - ${entry.type}\n${content}\n`;
      
      // 写入文件
      fs.writeFileSync(dailyFile, existingContent + newContent, 'utf-8');
      console.log(`[MemoryIntegration] 写入每日记忆: ${date}`);
    } catch (error) {
      console.error('[MemoryIntegration] 写入失败', error);
    }
  }

  /**
   * 格式化记忆条目
   */
  private formatMemoryEntry(entry: MemoryEntry): string {
    const tags = entry.tags.map(tag => `#${tag}`).join(' ');
    return `**${entry.content}**\n- 标签: ${tags}\n- 重要性: ${entry.importance}%\n- 来源: ${entry.source}\n`;
  }

  /**
   * 读取长期记忆
   */
  readLongTermMemory(): MemoryEntry[] {
    try {
      if (!fs.existsSync(this.memoryFile)) {
        return [];
      }
      
      const content = fs.readFileSync(this.memoryFile, 'utf-8');
      return this.parseMemoryContent(content);
    } catch (error) {
      console.error('[MemoryIntegration] 读取失败', error);
      return [];
    }
  }

  /**
   * 读取每日记忆
   */
  readDailyMemory(date: string): MemoryEntry[] {
    const dailyFile = path.join(this.dailyMemoryDir, `${date}.md`);
    
    try {
      if (!fs.existsSync(dailyFile)) {
        return [];
      }
      
      const content = fs.readFileSync(dailyFile, 'utf-8');
      return this.parseMemoryContent(content);
    } catch (error) {
      console.error('[MemoryIntegration] 读取失败', error);
      return [];
    }
  }

  /**
   * 解析记忆内容
   */
  private parseMemoryContent(content: string): MemoryEntry[] {
    // 简单的解析逻辑
    const entries: MemoryEntry[] = [];
    const lines = content.split('\n');
    
    let currentEntry: Partial<MemoryEntry> = {};
    
    lines.forEach(line => {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentEntry.content) {
          entries.push(currentEntry as MemoryEntry);
        }
        
        currentEntry = {
          id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type: 'experience',
          content: '',
          tags: [],
          importance: 50,
          source: 'memory',
        };
      } else if (line.startsWith('**') && line.endsWith('**')) {
        currentEntry.content = line.slice(2, -2);
      } else if (line.includes('- 标签:')) {
        const tags = line.split('- 标签:')[1].trim();
        currentEntry.tags = tags.split(' ').filter(tag => tag.startsWith('#')).map(tag => tag.slice(1));
      } else if (line.includes('- 重要性:')) {
        const importance = parseInt(line.split('- 重要性:')[1].replace('%', '').trim());
        currentEntry.importance = isNaN(importance) ? 50 : importance;
      }
    });
    
    if (currentEntry.content) {
      entries.push(currentEntry as MemoryEntry);
    }
    
    return entries;
  }

  /**
   * 搜索记忆
   */
  searchMemory(query: string): MemoryEntry[] {
    const allEntries = [
      ...this.readLongTermMemory(),
      ...this.readDailyMemory(new Date().toISOString().split('T')[0]),
    ];
    
    return allEntries.filter(entry => 
      entry.content.toLowerCase().includes(query.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }

  /**
   * 获取记忆统计
   */
  getMemoryStats() {
    const longTerm = this.readLongTermMemory();
    const today = this.readDailyMemory(new Date().toISOString().split('T')[0]);
    
    return {
      longTermCount: longTerm.length,
      dailyCount: today.length,
      totalCount: longTerm.length + today.length,
      byType: {
        experience: longTerm.filter(e => e.type === 'experience').length,
        knowledge: longTerm.filter(e => e.type === 'knowledge').length,
        lesson: longTerm.filter(e => e.type === 'lesson').length,
        goal: longTerm.filter(e => e.type === 'goal').length,
        reflection: longTerm.filter(e => e.type === 'reflection').length,
      },
    };
  }
}

// 全局实例
let globalMemoryIntegration: MemoryIntegration | null = null;

export function getGlobalMemoryIntegration(): MemoryIntegration {
  if (!globalMemoryIntegration) {
    globalMemoryIntegration = new MemoryIntegration();
  }
  return globalMemoryIntegration;
}
