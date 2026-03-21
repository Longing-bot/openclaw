/**
 * OpenClaw 零 Token 认证系统
 * 
 * 学习 openclaw-zero-token 后原生实现
 * 通过浏览器登录获取凭证，无需 API Token
 */

// ==================== 类型定义 ====================

export interface WebCredentials {
  cookie: string;
  bearer: string;
  userAgent: string;
  provider: string;
  expiresAt?: number;
}

export interface ProviderConfig {
  name: string;
  loginUrl: string;
  chatUrl: string;
  cookieDomain: string;
  sessionCookies: string[];
}

// ==================== 支持的平台配置 ====================

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  deepseek: {
    name: 'DeepSeek',
    loginUrl: 'https://chat.deepseek.com',
    chatUrl: 'https://chat.deepseek.com',
    cookieDomain: 'deepseek.com',
    sessionCookies: ['d_id', 'ds_session_id'],
  },
  qwen: {
    name: '通义千问',
    loginUrl: 'https://tongyi.aliyun.com/qianwen',
    chatUrl: 'https://tongyi.aliyun.com/qianwen',
    cookieDomain: 'aliyun.com',
    sessionCookies: ['cookie2', 'sgcookie'],
  },
  kimi: {
    name: 'Kimi',
    loginUrl: 'https://kimi.moonshot.cn',
    chatUrl: 'https://kimi.moonshot.cn',
    cookieDomain: 'moonshot.cn',
    sessionCookies: ['_moonshot_session'],
  },
  doubao: {
    name: '豆包',
    loginUrl: 'https://www.doubao.com',
    chatUrl: 'https://www.doubao.com',
    cookieDomain: 'doubao.com',
    sessionCookies: ['sessionid'],
  },
  glm: {
    name: '智谱GLM',
    loginUrl: 'https://chatglm.cn',
    chatUrl: 'https://chatglm.cn',
    cookieDomain: 'chatglm.cn',
    sessionCookies: ['chatglm_token'],
  },
  claude: {
    name: 'Claude',
    loginUrl: 'https://claude.ai',
    chatUrl: 'https://claude.ai',
    cookieDomain: 'claude.ai',
    sessionCookies: ['sessionKey'],
  },
  chatgpt: {
    name: 'ChatGPT',
    loginUrl: 'https://chat.openai.com',
    chatUrl: 'https://chat.openai.com',
    cookieDomain: 'openai.com',
    sessionCookies: ['__Secure-next-auth.session-token'],
  },
  gemini: {
    name: 'Gemini',
    loginUrl: 'https://gemini.google.com',
    chatUrl: 'https://gemini.google.com',
    cookieDomain: 'google.com',
    sessionCookies: ['__Secure-1PSID'],
  },
  grok: {
    name: 'Grok',
    loginUrl: 'https://grok.com',
    chatUrl: 'https://grok.com',
    cookieDomain: 'grok.com',
    sessionCookies: ['x_auth_token'],
  },
};

// ==================== 凭证存储 ====================

class CredentialStore {
  private credentials: Map<string, WebCredentials> = new Map();

  /**
   * 保存凭证
   */
  save(provider: string, credentials: WebCredentials): void {
    this.credentials.set(provider, credentials);
  }

  /**
   * 获取凭证
   */
  get(provider: string): WebCredentials | undefined {
    return this.credentials.get(provider);
  }

  /**
   * 检查凭证是否有效
   */
  isValid(provider: string): boolean {
    const cred = this.credentials.get(provider);
    if (!cred) return false;
    if (cred.expiresAt && Date.now() > cred.expiresAt) return false;
    return true;
  }

  /**
   * 删除凭证
   */
  remove(provider: string): void {
    this.credentials.delete(provider);
  }

  /**
   * 列出所有凭证
   */
  list(): Array<{ provider: string; valid: boolean }> {
    const result: Array<{ provider: string; valid: boolean }> = [];
    for (const [provider] of this.credentials) {
      result.push({
        provider,
        valid: this.isValid(provider),
      });
    }
    return result;
  }
}

// ==================== 浏览器认证管理器 ====================

export class BrowserAuthManager {
  private credentialStore: CredentialStore;

  constructor() {
    this.credentialStore = new CredentialStore();
  }

  /**
   * 获取登录 URL
   */
  getLoginUrl(provider: string): string | null {
    const config = PROVIDER_CONFIGS[provider];
    return config?.loginUrl || null;
  }

  /**
   * 检查登录状态
   */
  isLoggedIn(provider: string): boolean {
    return this.credentialStore.isValid(provider);
  }

  /**
   * 保存凭证（由浏览器插件或手动调用）
   */
  saveCredentials(provider: string, credentials: Omit<WebCredentials, 'provider'>): void {
    this.credentialStore.save(provider, {
      ...credentials,
      provider,
    });
  }

  /**
   * 获取凭证
   */
  getCredentials(provider: string): WebCredentials | undefined {
    return this.credentialStore.get(provider);
  }

  /**
   * 登出
   */
  logout(provider: string): void {
    this.credentialStore.remove(provider);
  }

  /**
   * 获取所有平台状态
   */
  getAllStatus(): Array<{ provider: string; name: string; loggedIn: boolean }> {
    return Object.entries(PROVIDER_CONFIGS).map(([key, config]) => ({
      provider: key,
      name: config.name,
      loggedIn: this.isLoggedIn(key),
    }));
  }

  /**
   * 获取可用的平台列表
   */
  getAvailableProviders(): string[] {
    return Object.keys(PROVIDER_CONFIGS);
  }
}

// ==================== 零 Token 提供者 ====================

export class ZeroTokenProvider {
  private authManager: BrowserAuthManager;

  constructor() {
    this.authManager = new BrowserAuthManager();
  }

  /**
   * 获取登录状态
   */
  getLoginStatus(): Array<{ provider: string; name: string; loggedIn: boolean }> {
    return this.authManager.getAllStatus();
  }

  /**
   * 获取登录 URL
   */
  getLoginUrl(provider: string): string | null {
    return this.authManager.getLoginUrl(provider);
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn(provider: string): boolean {
    return this.authManager.isLoggedIn(provider);
  }

  /**
   * 保存凭证
   */
  saveCredentials(provider: string, credentials: Omit<WebCredentials, 'provider'>): void {
    this.authManager.saveCredentials(provider, credentials);
  }

  /**
   * 获取凭证
   */
  getCredentials(provider: string): WebCredentials | undefined {
    return this.authManager.getCredentials(provider);
  }

  /**
   * 登出
   */
  logout(provider: string): void {
    this.authManager.logout(provider);
  }
}

// ==================== 导出 ====================

export function createZeroTokenProvider(): ZeroTokenProvider {
  return new ZeroTokenProvider();
}

export function createBrowserAuthManager(): BrowserAuthManager {
  return new BrowserAuthManager();
}
