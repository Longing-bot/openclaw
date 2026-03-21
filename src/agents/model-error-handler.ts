/**
 * OpenClaw 模型错误处理器
 * 
 * 处理模型错误：
 * 1. 错误分类
 * 2. 错误恢复
 * 3. 错误报告
 */

export interface ModelError {
  type: 'rate_limit' | 'timeout' | 'invalid_request' | 'server_error' | 'unknown';
  message: string;
  code?: string;
  retryable: boolean;
  retryAfter?: number;
}

export class ModelErrorHandler {
  constructor() {
    console.log('[ErrorHandler] 初始化完成');
  }

  /**
   * 分类错误
   */
  classifyError(error: any): ModelError {
    const message = error?.message || String(error);
    const code = error?.code;

    // 速率限制
    if (message.includes('rate limit') || message.includes('429')) {
      return {
        type: 'rate_limit',
        message,
        code,
        retryable: true,
        retryAfter: 60,
      };
    }

    // 超时
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return {
        type: 'timeout',
        message,
        code,
        retryable: true,
      };
    }

    // 无效请求
    if (message.includes('invalid') || message.includes('400')) {
      return {
        type: 'invalid_request',
        message,
        code,
        retryable: false,
      };
    }

    // 服务器错误
    if (message.includes('server') || message.includes('500')) {
      return {
        type: 'server_error',
        message,
        code,
        retryable: true,
      };
    }

    // 未知错误
    return {
      type: 'unknown',
      message,
      code,
      retryable: false,
    };
  }

  /**
   * 处理错误
   */
  async handleError(error: any, retryFn: () => Promise<any>): Promise<any> {
    const classified = this.classifyError(error);

    if (classified.retryable && classified.retryAfter) {
      console.log(`[ErrorHandler] 等待 ${classified.retryAfter} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, classified.retryAfter! * 1000));
      return retryFn();
    }

    throw error;
  }

  /**
   * 生成错误报告
   */
  generateErrorReport(error: ModelError): string {
    return `
# 模型错误报告

## 错误类型
${error.type}

## 错误信息
${error.message}

## 错误代码
${error.code || '无'}

## 可重试
${error.retryable ? '是' : '否'}

## 重试延迟
${error.retryAfter ? `${error.retryAfter} 秒` : '无'}
    `.trim();
  }
}

let globalErrorHandler: ModelErrorHandler | null = null;

export function getGlobalErrorHandler(): ModelErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ModelErrorHandler();
  }
  return globalErrorHandler;
}
