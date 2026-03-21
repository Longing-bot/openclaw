/**
 * OpenClaw 模型验证器
 * 
 * 验证模型输出：
 * 1. 格式验证
 * 2. 内容验证
 * 3. 逻辑验证
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ModelValidator {
  constructor() {
    console.log('[Validator] 初始化完成');
  }

  /**
   * 验证 JSON
   */
  validateJSON(text: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    try {
      JSON.parse(text);
    } catch (error) {
      result.valid = false;
      result.errors.push(`JSON 解析失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 验证代码
   */
  validateCode(code: string, language: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    // 检查基本语法
    if (language === 'javascript' || language === 'typescript') {
      if (!code.includes(';') && !code.includes('{')) {
        result.warnings.push('代码可能不完整');
      }
    }

    if (language === 'python') {
      if (!code.includes(':') && !code.includes('def ')) {
        result.warnings.push('代码可能不完整');
      }
    }

    return result;
  }

  /**
   * 验证响应长度
   */
  validateLength(text: string, minLength: number, maxLength: number): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    if (text.length < minLength) {
      result.valid = false;
      result.errors.push(`响应太短: ${text.length} < ${minLength}`);
    }

    if (text.length > maxLength) {
      result.warnings.push(`响应太长: ${text.length} > ${maxLength}`);
    }

    return result;
  }

  /**
   * 验证逻辑一致性
   */
  validateConsistency(responses: string[]): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    // 检查是否有矛盾
    const unique = new Set(responses);
    if (unique.size < responses.length * 0.5) {
      result.warnings.push('响应可能有重复');
    }

    return result;
  }
}

let globalValidator: ModelValidator | null = null;

export function getGlobalValidator(): ModelValidator {
  if (!globalValidator) {
    globalValidator = new ModelValidator();
  }
  return globalValidator;
}
