/**
 * OpenClaw 中文支持模块
 * 
 * 学习 openclaw-cn 后内化的原生中文支持
 */

// ==================== 命令中文翻译 ====================

export interface CommandI18n {
  key: string;
  zhName: string;
  zhDescription: string;
  zhAliases?: string[];
  group: CommandGroup;
}

export type CommandGroup =
  | "conversation"
  | "model"
  | "info"
  | "session"
  | "advanced"
  | "other";

export const COMMAND_GROUP_LABELS: Record<CommandGroup, string> = {
  conversation: "💬 对话控制",
  model: "🤖 模型设置",
  info: "ℹ️ 信息查询",
  session: "📝 会话管理",
  advanced: "⚙️ 高级功能",
  other: "📦 其他",
};

export const COMMANDS_I18N: CommandI18n[] = [
  // 对话控制
  { key: "new", zhName: "新对话", zhDescription: "开始新的对话", zhAliases: ["新对话", "新会话", "清空"], group: "conversation" },
  { key: "stop", zhName: "停止", zhDescription: "停止当前回复", zhAliases: ["停止", "停", "取消"], group: "conversation" },
  { key: "reset", zhName: "重置", zhDescription: "重置当前会话", zhAliases: ["重置", "重置会话"], group: "conversation" },
  { key: "compact", zhName: "压缩", zhDescription: "压缩会话上下文", zhAliases: ["压缩", "压缩上下文"], group: "conversation" },

  // 模型设置
  { key: "model", zhName: "模型", zhDescription: "查看或切换 AI 模型", zhAliases: ["模型", "切换模型", "换模型"], group: "model" },
  { key: "models", zhName: "模型列表", zhDescription: "列出可用的模型", zhAliases: ["模型列表", "所有模型"], group: "model" },
  { key: "think", zhName: "思考", zhDescription: "设置思考深度", zhAliases: ["思考", "思考模式"], group: "model" },
  { key: "reasoning", zhName: "推理", zhDescription: "切换推理过程显示", zhAliases: ["推理", "显示推理"], group: "model" },

  // 信息查询
  { key: "status", zhName: "状态", zhDescription: "查看系统状态", zhAliases: ["状态", "系统状态"], group: "info" },
  { key: "help", zhName: "帮助", zhDescription: "显示帮助信息", zhAliases: ["帮助", "帮助信息"], group: "info" },

  // 会话管理
  { key: "sessions", zhName: "会话", zhDescription: "管理会话", zhAliases: ["会话", "会话列表"], group: "session" },
  { key: "resume", zhName: "恢复", zhDescription: "恢复会话", zhAliases: ["恢复", "恢复会话"], group: "session" },
  { key: "fork", zhName: "分支", zhDescription: "分支会话", zhAliases: ["分支", "分支会话"], group: "session" },

  // 高级功能
  { key: "reasoning", zhName: "推理", zhDescription: "设置推理模式", zhAliases: ["推理模式"], group: "advanced" },
  { key: "exec", zhName: "执行", zhDescription: "设置执行默认值", zhAliases: ["执行", "执行设置"], group: "advanced" },
  { key: "tts", zhName: "语音", zhDescription: "配置文字转语音", zhAliases: ["语音", "TTS", "朗读"], group: "advanced" },
  { key: "cron", zhName: "定时", zhDescription: "管理定时任务", zhAliases: ["定时", "定时任务", "提醒"], group: "advanced" },

  // 其他
  { key: "approve", zhName: "批准", zhDescription: "批准或拒绝执行请求", zhAliases: ["批准", "授权"], group: "other" },
  { key: "config", zhName: "配置", zhDescription: "查看或设置配置值", zhAliases: ["配置", "设置"], group: "other" },
  { key: "bash", zhName: "命令行", zhDescription: "运行主机 Shell 命令", zhAliases: ["命令行", "shell", "终端"], group: "other" },
];

// ==================== 中文别名映射 ====================

let cachedZhAliasMap: Map<string, string> | null = null;

export function getZhAliasToKeyMap(): Map<string, string> {
  if (cachedZhAliasMap) return cachedZhAliasMap;

  const map = new Map<string, string>();
  for (const cmd of COMMANDS_I18N) {
    if (cmd.zhAliases) {
      for (const alias of cmd.zhAliases) {
        const normalized = alias.trim().toLowerCase();
        if (normalized && !map.has(normalized)) {
          map.set(normalized, cmd.key);
        }
      }
    }
  }
  cachedZhAliasMap = map;
  return map;
}

export function getCommandI18n(key: string): CommandI18n | undefined {
  return COMMANDS_I18N.find((cmd) => cmd.key === key);
}

export function matchZhCommandAlias(text: string): string | null {
  const normalized = text.trim().toLowerCase();
  return getZhAliasToKeyMap().get(normalized) ?? null;
}

// ==================== 中文帮助菜单 ====================

export function generateZhHelpMenu(): string {
  const groups = new Map<CommandGroup, CommandI18n[]>();

  for (const cmd of COMMANDS_I18N) {
    if (!groups.has(cmd.group)) {
      groups.set(cmd.group, []);
    }
    groups.get(cmd.group)!.push(cmd);
  }

  let menu = "🦞 OpenClaw 中文命令菜单\n\n";

  for (const [group, cmds] of groups) {
    menu += `${COMMAND_GROUP_LABELS[group]}\n`;
    for (const cmd of cmds) {
      const aliases = cmd.zhAliases ? ` (${cmd.zhAliases.join(", ")})` : "";
      menu += `  /${cmd.zhName} - ${cmd.zhDescription}${aliases}\n`;
    }
    menu += "\n";
  }

  return menu;
}

// ==================== 渠道中文适配 ====================

export interface ChannelZhConfig {
  name: string;
  zhName: string;
  zhDescription: string;
  setupGuide?: string;
}

export const CHANNELS_ZH: ChannelZhConfig[] = [
  { name: "qqbot", zhName: "QQ 机器人", zhDescription: "基于 OneBot/NapCat 的 QQ 渠道" },
  { name: "feishu", zhName: "飞书", zhDescription: "飞书机器人集成（WebSocket）" },
  { name: "dingtalk", zhName: "钉钉", zhDescription: "钉钉机器人集成" },
  { name: "wecom", zhName: "企业微信", zhDescription: "企业微信机器人集成" },
  { name: "wechat", zhName: "微信", zhDescription: "微信渠道（开发中）" },
  { name: "telegram", zhName: "Telegram", zhDescription: "Telegram 机器人" },
  { name: "discord", zhName: "Discord", zhDescription: "Discord 机器人" },
];

export function getChannelZhConfig(name: string): ChannelZhConfig | undefined {
  return CHANNELS_ZH.find(c => c.name === name);
}
