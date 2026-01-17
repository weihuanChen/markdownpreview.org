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
import { writingRules } from './writing'
import { academicRules } from './academic'

// ============================================================================
// 规则汇总
// ============================================================================

/**
 * 所有 P1 规则
 */
const baseRules: FormatRule[] = [
  ...whitespaceRules,
  ...headingRules,
  ...listRules,
  ...blockquoteRules,
  ...codeBlockRules,
  ...writingRules,
]

/**
 * 所有规则（含学术规则）
 */
export const allRules: FormatRule[] = [
  ...baseRules,
  ...academicRules,
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
  writingRules,
  academicRules,
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

import type { FormatRuleId } from '../engine'

/**
 * 预设配置
 */
export const presets = {
  /**
   * 标准配置：平衡的规则集，适合大多数场景
   */
  standard: {
    enabledRules: [
      'trailing-spaces',
      'eof-newline',
      'consecutive-blanks',
      'heading-space',
      'heading-blank-lines',
      'list-marker-style',
      'blockquote-space',
      'code-fence-style',
      'code-fence-spacing',
    ] as FormatRuleId[],
    maxConsecutiveBlankLines: 1,
    listIndentSize: 2,
    listMarker: '-' as const,
    headingBlankLinesBefore: 1,
    headingBlankLinesAfter: 1,
    codeFenceStyle: '```' as const,
  },

  /**
   * 质量模式：启用写作质量检查（lint-only），辅以基础安全修复
   */
  quality: {
    enabledRules: [
      'trailing-spaces',
      'eof-newline',
      'heading-space',
      'consecutive-blanks',
      'heading-depth',
      'long-paragraph',
    ] as FormatRuleId[],
    maxConsecutiveBlankLines: 1,
    listIndentSize: 2,
    listMarker: '-' as const,
    headingBlankLinesBefore: 1,
    headingBlankLinesAfter: 1,
    codeFenceStyle: '```' as const,
    maxHeadingDepth: 4,
    maxParagraphChars: 800,
  },

  /**
   * GitHub 风格：遵循 GitHub Flavored Markdown 规范
   * - 所有规则启用
   * - 严格的空行控制
   */
  github: {
    enabledRules: baseRules.map((r) => r.id),
    maxConsecutiveBlankLines: 1,
    listIndentSize: 2,
    listMarker: '-' as const,
    headingBlankLinesBefore: 1,
    headingBlankLinesAfter: 1,
    codeFenceStyle: '```' as const,
  },

  /**
   * 写作友好：最少干预，适合长文写作
   * - 只修复最基本的问题
   * - 允许更多空行用于视觉分隔
   */
  writing: {
    enabledRules: [
      'trailing-spaces',
      'eof-newline',
      'heading-space',
    ] as FormatRuleId[],
    maxConsecutiveBlankLines: 2,
    listIndentSize: 2,
    listMarker: '-' as const,
    headingBlankLinesBefore: 1,
    headingBlankLinesAfter: 1,
    codeFenceStyle: '```' as const,
  },

  /**
   * 严格模式：所有规则启用，最严格的格式化
   * - 适合代码文档、技术写作
   * - 统一所有格式
   */
  strict: {
    enabledRules: baseRules.map((r) => r.id),
    maxConsecutiveBlankLines: 1,
    listIndentSize: 2,
    listMarker: '-' as const,
    headingBlankLinesBefore: 1,
    headingBlankLinesAfter: 1,
    codeFenceStyle: '```' as const,
  },

  /**
   * IEEE 学术预设
   */
  ieee: {
    enabledRules: [
      'trailing-spaces',
      'eof-newline',
      'heading-space',
      'heading-blank-lines',
      'list-marker-style',
      'list-indent',
      'blockquote-space',
      'code-fence-style',
      'code-fence-spacing',
      'heading-numbering',
      'figure-caption-format',
      'table-caption-format',
      'section-depth',
      'paragraph-length',
      'citation-format',
      'reference-list-format',
      'figure-reference',
      'abstract-format',
      'keywords-format',
    ] as FormatRuleId[],
    figureFormat: 'Figure 1:',
    tableFormat: 'Table 1:',
    maxHeadingDepth: 4,
    maxParagraphChars: 800,
    citationStyle: 'ieee' as const,
  },

  /**
   * ACM 学术预设
   */
  acm: {
    enabledRules: [
      'trailing-spaces',
      'eof-newline',
      'heading-space',
      'heading-blank-lines',
      'list-marker-style',
      'list-indent',
      'blockquote-space',
      'code-fence-style',
      'code-fence-spacing',
      'heading-numbering',
      'figure-caption-format',
      'table-caption-format',
      'section-depth',
      'paragraph-length',
      'citation-format',
      'reference-list-format',
      'figure-reference',
      'abstract-format',
      'keywords-format',
    ] as FormatRuleId[],
    figureFormat: 'Figure 1.',
    tableFormat: 'Table 1.',
    maxHeadingDepth: 4,
    maxParagraphChars: 800,
    citationStyle: 'acm' as const,
  },

  /**
   * APA 学术预设
   */
  apa: {
    enabledRules: [
      'trailing-spaces',
      'eof-newline',
      'heading-space',
      'heading-blank-lines',
      'list-marker-style',
      'list-indent',
      'blockquote-space',
      'code-fence-style',
      'code-fence-spacing',
      'heading-numbering',
      'figure-caption-format',
      'table-caption-format',
      'section-depth',
      'paragraph-length',
      'citation-format',
      'reference-list-format',
      'figure-reference',
      'abstract-format',
      'keywords-format',
    ] as FormatRuleId[],
    figureFormat: 'Figure 1',
    tableFormat: 'Table 1',
    maxHeadingDepth: 4,
    maxParagraphChars: 600,
    citationStyle: 'apa' as const,
  },
} as const

export type PresetName = keyof typeof presets

/**
 * 预设元数据（用于 UI 显示）
 */
export const presetMeta: Record<PresetName, { 
  label: string
  description: string 
  rulesCount: number
}> = {
  standard: {
    label: 'Standard',
    description: 'Balanced rules for most use cases',
    rulesCount: presets.standard.enabledRules.length,
  },
  github: {
    label: 'GitHub',
    description: 'GitHub Flavored Markdown style',
    rulesCount: presets.github.enabledRules.length,
  },
  quality: {
    label: 'Quality',
    description: 'Writing-quality checks with safe fixes',
    rulesCount: presets.quality.enabledRules.length,
  },
  writing: {
    label: 'Writing',
    description: 'Minimal rules for prose and articles',
    rulesCount: presets.writing.enabledRules.length,
  },
  strict: {
    label: 'Strict',
    description: 'All rules for technical docs',
    rulesCount: presets.strict.enabledRules.length,
  },
  ieee: {
    label: 'IEEE',
    description: 'Academic preset for IEEE submissions',
    rulesCount: presets.ieee.enabledRules.length,
  },
  acm: {
    label: 'ACM',
    description: 'Academic preset for ACM submissions',
    rulesCount: presets.acm.enabledRules.length,
  },
  apa: {
    label: 'APA',
    description: 'Academic preset for APA style papers',
    rulesCount: presets.apa.enabledRules.length,
  },
}
