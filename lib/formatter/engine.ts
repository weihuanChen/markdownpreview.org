/**
 * Markdown Formatter Engine
 * 
 * P1 阶段：只实现 Safe Fix（100% 确定性规则）
 * P2 阶段：增加 Lint 检测能力
 */

// ============================================================================
// 类型定义
// ============================================================================

export type FormatRuleId =
  // 空白字符规则
  | 'trailing-spaces'
  | 'eof-newline'
  | 'consecutive-blanks'
  // 标题规则
  | 'heading-space'
  | 'heading-blank-lines'
  // 列表规则
  | 'list-marker-style'
  | 'list-indent'
  // 引用规则
  | 'blockquote-space'
  // 代码块规则
  | 'code-fence-style'
  | 'code-fence-spacing'

export type RuleCategory = 'whitespace' | 'heading' | 'list' | 'blockquote' | 'code'

export interface RuleOptions {
  /** 段落间最大空行数，默认 1 */
  maxConsecutiveBlankLines?: number
  /** 列表缩进空格数，默认 2 */
  listIndentSize?: number
  /** 列表符号，默认 '-' */
  listMarker?: '-' | '*' | '+'
  /** 标题前空行数，默认 1 */
  headingBlankLinesBefore?: number
  /** 标题后空行数，默认 1 */
  headingBlankLinesAfter?: number
  /** 代码块 fence 符号，默认 '```' */
  codeFenceStyle?: '```' | '~~~'
}

export interface FormatRule {
  /** 规则唯一标识 */
  id: FormatRuleId
  /** 规则名称（用于 i18n key） */
  name: string
  /** 规则描述（用于 i18n key） */
  description: string
  /** 规则分类 */
  category: RuleCategory
  /** 是否默认启用 */
  enabled: boolean
  /**
   * 执行格式化修复
   * @param content 原始内容
   * @param options 规则配置
   * @returns 修复后的内容
   */
  fix: (content: string, options?: RuleOptions) => string
}

export interface FormatResult {
  /** 原始内容 */
  original: string
  /** 格式化后内容 */
  formatted: string
  /** 应用的规则列表 */
  appliedRules: FormatRuleId[]
  /** 是否有变更 */
  hasChanges: boolean
}

export interface FormatEngineOptions extends RuleOptions {
  /** 要启用的规则，不传则使用默认配置 */
  enabledRules?: FormatRuleId[]
  /** 要禁用的规则 */
  disabledRules?: FormatRuleId[]
}

// ============================================================================
// 规则引擎
// ============================================================================

class FormatEngine {
  private rules: Map<FormatRuleId, FormatRule> = new Map()
  private defaultOptions: RuleOptions = {
    maxConsecutiveBlankLines: 1,
    listIndentSize: 2,
    listMarker: '-',
    headingBlankLinesBefore: 1,
    headingBlankLinesAfter: 1,
    codeFenceStyle: '```',
  }

  /**
   * 注册规则
   */
  register(rule: FormatRule): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * 批量注册规则
   */
  registerAll(rules: FormatRule[]): void {
    for (const rule of rules) {
      this.register(rule)
    }
  }

  /**
   * 获取所有已注册的规则
   */
  getRules(): FormatRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * 获取单个规则
   */
  getRule(id: FormatRuleId): FormatRule | undefined {
    return this.rules.get(id)
  }

  /**
   * 按分类获取规则
   */
  getRulesByCategory(category: RuleCategory): FormatRule[] {
    return this.getRules().filter((rule) => rule.category === category)
  }

  /**
   * 执行格式化
   */
  format(content: string, options?: FormatEngineOptions): FormatResult {
    const mergedOptions: RuleOptions = {
      ...this.defaultOptions,
      ...options,
    }

    const enabledRules = this.getEnabledRules(options)
    const appliedRules: FormatRuleId[] = []
    let result = content

    // 按固定顺序执行规则，避免规则冲突
    const ruleOrder: FormatRuleId[] = [
      // 1. 先处理代码块（保护代码块内容不被其他规则影响）
      'code-fence-style',
      'code-fence-spacing',
      // 2. 处理行级空白
      'trailing-spaces',
      // 3. 处理标题
      'heading-space',
      'heading-blank-lines',
      // 4. 处理列表
      'list-marker-style',
      'list-indent',
      // 5. 处理引用
      'blockquote-space',
      // 6. 处理段落级空白（最后处理，避免被其他规则破坏）
      'consecutive-blanks',
      'eof-newline',
    ]

    for (const ruleId of ruleOrder) {
      if (!enabledRules.has(ruleId)) continue

      const rule = this.rules.get(ruleId)
      if (!rule) continue

      const before = result
      result = rule.fix(result, mergedOptions)

      if (before !== result) {
        appliedRules.push(ruleId)
      }
    }

    return {
      original: content,
      formatted: result,
      appliedRules,
      hasChanges: content !== result,
    }
  }

  /**
   * 获取启用的规则集合
   */
  private getEnabledRules(options?: FormatEngineOptions): Set<FormatRuleId> {
    let enabledRules: Set<FormatRuleId>

    if (options?.enabledRules) {
      // 如果指定了启用列表，只使用指定的规则
      enabledRules = new Set(options.enabledRules)
    } else {
      // 否则使用默认启用的规则
      enabledRules = new Set(
        this.getRules()
          .filter((rule) => rule.enabled)
          .map((rule) => rule.id)
      )
    }

    // 移除禁用的规则
    if (options?.disabledRules) {
      for (const ruleId of options.disabledRules) {
        enabledRules.delete(ruleId)
      }
    }

    return enabledRules
  }

  /**
   * 设置默认配置
   */
  setDefaultOptions(options: Partial<RuleOptions>): void {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options,
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultOptions(): RuleOptions {
    return { ...this.defaultOptions }
  }
}

// ============================================================================
// 导出单例
// ============================================================================

export const formatEngine = new FormatEngine()

// 便捷函数
export const format = (content: string, options?: FormatEngineOptions): FormatResult => {
  return formatEngine.format(content, options)
}

export const registerRule = (rule: FormatRule): void => {
  formatEngine.register(rule)
}

export const registerRules = (rules: FormatRule[]): void => {
  formatEngine.registerAll(rules)
}

