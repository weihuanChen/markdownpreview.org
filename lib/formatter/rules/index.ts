/**
 * 规则注册表
 * 
 * 统一导出所有规则，并在引擎中注册
 */

import { formatEngine, type FormatRule } from '../engine'

// 导入各分类规则
import { whitespaceRules } from './whitespace'
import { headingRules } from './heading'
import { listRules } from './list'
import { blockquoteRules } from './blockquote'
import { codeBlockRules } from './code-block'

// ============================================================================
// 规则汇总
// ============================================================================

/**
 * 所有 P1 规则
 */
export const allRules: FormatRule[] = [
  ...whitespaceRules,
  ...headingRules,
  ...listRules,
  ...blockquoteRules,
  ...codeBlockRules,
]

/**
 * 按分类导出规则
 */
export {
  whitespaceRules,
  headingRules,
  listRules,
  blockquoteRules,
  codeBlockRules,
}

// ============================================================================
// 规则注册
// ============================================================================

/**
 * 初始化：将所有规则注册到引擎
 * 
 * 使用方式：
 * ```ts
 * import { initializeRules } from '@/lib/formatter/rules'
 * initializeRules()
 * ```
 */
export function initializeRules(): void {
  formatEngine.registerAll(allRules)
}

/**
 * 获取规则统计信息
 */
export function getRuleStats(): {
  total: number
  byCategory: Record<string, number>
  enabled: number
  disabled: number
} {
  const byCategory: Record<string, number> = {}
  let enabled = 0
  let disabled = 0

  for (const rule of allRules) {
    byCategory[rule.category] = (byCategory[rule.category] || 0) + 1
    if (rule.enabled) {
      enabled++
    } else {
      disabled++
    }
  }

  return {
    total: allRules.length,
    byCategory,
    enabled,
    disabled,
  }
}

// ============================================================================
// 预设配置
// ============================================================================

/**
 * 预设配置（P2 功能预留）
 */
export const presets = {
  /**
   * 标准配置：所有规则默认配置
   */
  standard: {
    enabledRules: allRules.filter((r) => r.enabled).map((r) => r.id),
    maxConsecutiveBlankLines: 1,
    listIndentSize: 2,
    listMarker: '-' as const,
    headingBlankLinesBefore: 1,
    headingBlankLinesAfter: 1,
    codeFenceStyle: '```' as const,
  },

  /**
   * GitHub 风格
   */
  github: {
    enabledRules: allRules.filter((r) => r.enabled).map((r) => r.id),
    maxConsecutiveBlankLines: 1,
    listIndentSize: 2,
    listMarker: '-' as const,
    headingBlankLinesBefore: 1,
    headingBlankLinesAfter: 1,
    codeFenceStyle: '```' as const,
  },

  /**
   * 写作友好：更宽松的规则
   */
  writing: {
    enabledRules: [
      'trailing-spaces',
      'eof-newline',
      'heading-space',
    ],
    maxConsecutiveBlankLines: 2,
    listIndentSize: 2,
    listMarker: '-' as const,
    headingBlankLinesBefore: 1,
    headingBlankLinesAfter: 1,
    codeFenceStyle: '```' as const,
  },
} as const

export type PresetName = keyof typeof presets

