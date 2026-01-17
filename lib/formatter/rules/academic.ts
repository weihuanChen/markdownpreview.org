/**
 * 学术格式规则
 * - heading-numbering: 检查标题编号一致性
 * - figure-caption-format: 检查图表标题格式
 * - table-caption-format: 检查表格标题格式
 * - section-depth: 检查章节层级深度（复用 heading-depth）
 * - paragraph-length: 检查段落长度（复用 long-paragraph）
 */

import type { FormatRule, RuleOptions, LintResult, LintContext } from '../engine'
import { headingDepthRule, longParagraphRule } from './writing'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isInCodeFence(line: string, fenceState: { inFence: boolean; fence: string | null }): boolean {
  const match = line.match(/^(```|~~~)/)
  if (match) {
    if (!fenceState.inFence) {
      fenceState.inFence = true
      fenceState.fence = match[1]
    } else if (fenceState.fence === match[1]) {
      fenceState.inFence = false
      fenceState.fence = null
    }
  }
  return fenceState.inFence
}

function parseCaptionFormat(format: string | undefined, fallbackLabel: string, fallbackPunctuation: ':' | '.' | '' = ':') {
  const normalized = format?.trim() ?? ''
  const match = normalized.match(/^([A-Za-z.]+)\s+1\s*([.:])?/)
  return {
    label: match?.[1] ?? fallbackLabel,
    punctuation: (match?.[2] as ':' | '.' | '') ?? fallbackPunctuation,
  }
}

function matchCaption(line: string, labels: string[]): { label: string; number: number; punctuation: string; caption: string } | null {
  if (!labels.length) return null
  const pattern = new RegExp(`^(${labels.map((label) => escapeRegex(label)).join('|')})\\s+(\\d+)([.:])?\\s+(.+)`, 'i')
  const match = line.match(pattern)
  if (!match) return null
  return {
    label: match[1],
    number: Number.parseInt(match[2], 10),
    punctuation: match[3] ?? '',
    caption: match[4]?.trim() ?? '',
  }
}

// ---------------------------------------------------------------------------
// heading-numbering: 检查标题编号一致性
// ---------------------------------------------------------------------------

export const headingNumberingRule: FormatRule = {
  id: 'heading-numbering',
  name: 'formatter_rule_heading_numbering',
  description: 'formatter_rule_heading_numbering_desc',
  category: 'academic',
  enabled: false,
  lint: (content: string, _options?: RuleOptions, context?: LintContext): LintResult[] => {
    const lines = content.split('\n')
    const results: LintResult[] = []
    const fenceState = { inFence: false, fence: null as string | null }
    const targetLines = context?.changedLines?.length ? new Set(context.changedLines) : null
    let stack: number[] = []
    let numberingSeen = false

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      if (isInCodeFence(line, fenceState)) return
      if (!/^#{1,6}\s/.test(line)) return

      const text = line.replace(/^#{1,6}\s+/, '')
      const match = text.match(/^(\d+(?:\.\d+)*)(?:[.)])?\s+(.+)/)

      if (!match) {
        if (numberingSeen && (!targetLines || targetLines.has(lineNumber))) {
          results.push({
            id: `heading-numbering-missing-${lineNumber}`,
            ruleId: 'heading-numbering',
            messageKey: 'formatter_rule_heading_numbering_missing',
            message: 'Heading numbering is missing or malformed',
            line: lineNumber,
          })
        }
        return
      }

      numberingSeen = true
      const numbers = match[1].split('.').map((n) => Number.parseInt(n, 10)).filter((n) => !Number.isNaN(n))
      const headingLevel = (line.match(/^#+/)?.[0].length ?? 1)
      const depth = numbers.length
      const issues: { id: string; key: string; message: string }[] = []

      if (depth !== headingLevel) {
        issues.push({
          id: `depth-${lineNumber}`,
          key: 'formatter_rule_heading_numbering_depth',
          message: 'Heading numbering depth should match heading level',
        })
      }

      if (stack.length < depth - 1) {
        issues.push({
          id: `hierarchy-${lineNumber}`,
          key: 'formatter_rule_heading_numbering_hierarchy',
          message: 'Heading numbering skipped a parent level',
        })
      } else {
        for (let i = 0; i < Math.min(depth - 1, stack.length); i++) {
          if (numbers[i] !== stack[i]) {
            issues.push({
              id: `prefix-${lineNumber}`,
              key: 'formatter_rule_heading_numbering_prefix',
              message: 'Heading numbering prefix is inconsistent',
            })
            break
          }
        }
      }

      let expectedCurrent: number | null = null
      if (stack.length >= depth) {
        expectedCurrent = stack[depth - 1] + 1
      } else if (stack.length === depth - 1) {
        expectedCurrent = 1
      }

      if (expectedCurrent !== null && numbers[depth - 1] !== expectedCurrent) {
        const expectedPath = [...numbers.slice(0, depth - 1), expectedCurrent].join('.')
        issues.push({
          id: `sequence-${lineNumber}`,
          key: 'formatter_rule_heading_numbering_sequence',
          message: `Heading number should be ${expectedPath}`,
        })
      }

      if (issues.length && (!targetLines || targetLines.has(lineNumber))) {
        const issue = issues[0]
        results.push({
          id: `heading-numbering-${issue.id}`,
          ruleId: 'heading-numbering',
          messageKey: issue.key,
          message: issue.message,
          line: lineNumber,
        })
      }

      const nextStack = stack.slice(0, depth)
      nextStack[depth - 1] = numbers[depth - 1]
      stack = nextStack
    })

    return results
  },
}

// ---------------------------------------------------------------------------
// figure-caption-format: 检查图表标题格式
// ---------------------------------------------------------------------------

export const figureCaptionRule: FormatRule = {
  id: 'figure-caption-format',
  name: 'formatter_rule_figure_caption_format',
  description: 'formatter_rule_figure_caption_format_desc',
  category: 'academic',
  enabled: false,
  lint: (content: string, options?: RuleOptions, context?: LintContext): LintResult[] => {
    const { label, punctuation } = parseCaptionFormat(options?.figureFormat, 'Figure', ':')
    const expectedLabel = label.toLowerCase()
    const labels = Array.from(new Set([label, 'Figure', 'Fig.', 'Fig'])).filter(Boolean)
    const lines = content.split('\n')
    const results: LintResult[] = []
    const fenceState = { inFence: false, fence: null as string | null }
    const targetLines = context?.changedLines?.length ? new Set(context.changedLines) : null
    let lastNumber = 0

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      if (isInCodeFence(line, fenceState)) return

      const match = matchCaption(line, labels)
      if (!match) return
      if (targetLines && !targetLines.has(lineNumber)) return

      const issues: LintResult[] = []

      if (match.label.toLowerCase() !== expectedLabel) {
        issues.push({
          id: `figure-caption-label-${lineNumber}`,
          ruleId: 'figure-caption-format',
          messageKey: 'formatter_rule_figure_caption_format_label',
          message: 'Figure caption label is inconsistent',
          line: lineNumber,
        })
      }

      if (match.punctuation !== punctuation) {
        issues.push({
          id: `figure-caption-punctuation-${lineNumber}`,
          ruleId: 'figure-caption-format',
          messageKey: 'formatter_rule_figure_caption_format_punctuation',
          message: 'Figure caption should use the configured punctuation',
          line: lineNumber,
        })
      }

      if (match.number !== lastNumber + 1) {
        issues.push({
          id: `figure-caption-sequence-${lineNumber}`,
          ruleId: 'figure-caption-format',
          messageKey: 'formatter_rule_figure_caption_format_sequence',
          message: `Figure numbering should continue with ${lastNumber + 1}`,
          line: lineNumber,
        })
      }

      if (!match.caption) {
        issues.push({
          id: `figure-caption-empty-${lineNumber}`,
          ruleId: 'figure-caption-format',
          messageKey: 'formatter_rule_figure_caption_format_desc',
          message: 'Figure caption should include descriptive text',
          line: lineNumber,
        })
      }

      if (issues.length) {
        results.push(issues[0])
      }

      lastNumber = match.number
    })

    return results
  },
}

// ---------------------------------------------------------------------------
// table-caption-format: 检查表格标题格式
// ---------------------------------------------------------------------------

export const tableCaptionRule: FormatRule = {
  id: 'table-caption-format',
  name: 'formatter_rule_table_caption_format',
  description: 'formatter_rule_table_caption_format_desc',
  category: 'academic',
  enabled: false,
  lint: (content: string, options?: RuleOptions, context?: LintContext): LintResult[] => {
    const { label, punctuation } = parseCaptionFormat(options?.tableFormat, 'Table', ':')
    const expectedLabel = label.toLowerCase()
    const labels = Array.from(new Set([label, 'Table', 'Tab.', 'Tab'])).filter(Boolean)
    const lines = content.split('\n')
    const results: LintResult[] = []
    const fenceState = { inFence: false, fence: null as string | null }
    const targetLines = context?.changedLines?.length ? new Set(context.changedLines) : null
    let lastNumber = 0

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      if (isInCodeFence(line, fenceState)) return

      const match = matchCaption(line, labels)
      if (!match) return
      if (targetLines && !targetLines.has(lineNumber)) return

      const issues: LintResult[] = []

      if (match.label.toLowerCase() !== expectedLabel) {
        issues.push({
          id: `table-caption-label-${lineNumber}`,
          ruleId: 'table-caption-format',
          messageKey: 'formatter_rule_table_caption_format_label',
          message: 'Table caption label is inconsistent',
          line: lineNumber,
        })
      }

      if (match.punctuation !== punctuation) {
        issues.push({
          id: `table-caption-punctuation-${lineNumber}`,
          ruleId: 'table-caption-format',
          messageKey: 'formatter_rule_table_caption_format_punctuation',
          message: 'Table caption should use the configured punctuation',
          line: lineNumber,
        })
      }

      if (match.number !== lastNumber + 1) {
        issues.push({
          id: `table-caption-sequence-${lineNumber}`,
          ruleId: 'table-caption-format',
          messageKey: 'formatter_rule_table_caption_format_sequence',
          message: `Table numbering should continue with ${lastNumber + 1}`,
          line: lineNumber,
        })
      }

      if (!match.caption) {
        issues.push({
          id: `table-caption-empty-${lineNumber}`,
          ruleId: 'table-caption-format',
          messageKey: 'formatter_rule_table_caption_format_desc',
          message: 'Table caption should include descriptive text',
          line: lineNumber,
        })
      }

      if (issues.length) {
        results.push(issues[0])
      }

      lastNumber = match.number
    })

    return results
  },
}

// ---------------------------------------------------------------------------
// section-depth: 复用 heading-depth
// ---------------------------------------------------------------------------

export const sectionDepthRule: FormatRule = {
  id: 'section-depth',
  name: 'formatter_rule_section_depth',
  description: 'formatter_rule_section_depth_desc',
  category: 'academic',
  enabled: false,
  lint: (content: string, options?: RuleOptions, context?: LintContext): LintResult[] => {
    const results = headingDepthRule.lint ? headingDepthRule.lint(content, options, context) : []
    return results.map((item, index) => ({
      ...item,
      id: `section-depth-${item.line ?? index}`,
      ruleId: 'section-depth',
      messageKey: 'formatter_rule_section_depth_desc',
      message: 'Section depth exceeds limit',
    }))
  },
}

// ---------------------------------------------------------------------------
// paragraph-length: 复用 long-paragraph
// ---------------------------------------------------------------------------

export const paragraphLengthRule: FormatRule = {
  id: 'paragraph-length',
  name: 'formatter_rule_paragraph_length',
  description: 'formatter_rule_paragraph_length_desc',
  category: 'academic',
  enabled: false,
  lint: (content: string, options?: RuleOptions, context?: LintContext): LintResult[] => {
    const results = longParagraphRule.lint ? longParagraphRule.lint(content, options, context) : []
    return results.map((item, index) => ({
      ...item,
      id: `paragraph-length-${item.line ?? index}`,
      ruleId: 'paragraph-length',
      messageKey: 'formatter_rule_paragraph_length_desc',
      message: 'Paragraph is too long for the configured academic style',
    }))
  },
}

// ---------------------------------------------------------------------------
// citation-format: 检查引用格式（IEEE/ACM/APA）
// ---------------------------------------------------------------------------

export const citationFormatRule: FormatRule = {
  id: 'citation-format',
  name: 'formatter_rule_citation_format',
  description: 'formatter_rule_citation_format_desc',
  category: 'academic',
  enabled: false,
  lint: (content: string, options?: RuleOptions, context?: LintContext): LintResult[] => {
    const style = options?.citationStyle ?? 'ieee'
    const lines = content.split('\n')
    const results: LintResult[] = []
    const fenceState = { inFence: false, fence: null as string | null }
    const targetLines = context?.changedLines?.length ? new Set(context.changedLines) : null

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      if (isInCodeFence(line, fenceState)) return
      if (targetLines && !targetLines.has(lineNumber)) return

      const hasBracketCitation = /\[\d+(?:\s*,\s*\d+|\s*-\s*\d+)?\]/.test(line)
      const hasApaCitation = /\([A-Z][A-Za-z.\s]+?,\s*\d{4}[a-z]?\)/.test(line)

      if ((style === 'ieee' || style === 'acm') && hasApaCitation) {
        results.push({
          id: `citation-format-style-${lineNumber}`,
          ruleId: 'citation-format',
          messageKey: 'formatter_rule_citation_format_style',
          message: 'Citations should use bracketed numeric style (e.g., [1]).',
          line: lineNumber,
        })
      } else if (style === 'apa' && hasBracketCitation) {
        results.push({
          id: `citation-format-style-${lineNumber}`,
          ruleId: 'citation-format',
          messageKey: 'formatter_rule_citation_format_style_apa',
          message: 'Citations should use APA author-year style (e.g., (Smith, 2024)).',
          line: lineNumber,
        })
      }
    })

    return results
  },
}

// ---------------------------------------------------------------------------
// reference-list-format: 检查参考文献列表格式
// ---------------------------------------------------------------------------

export const referenceListFormatRule: FormatRule = {
  id: 'reference-list-format',
  name: 'formatter_rule_reference_list_format',
  description: 'formatter_rule_reference_list_format_desc',
  category: 'academic',
  enabled: false,
  lint: (content: string, options?: RuleOptions, context?: LintContext): LintResult[] => {
    const style = options?.citationStyle ?? 'ieee'
    const lines = content.split('\n')
    const results: LintResult[] = []
    const fenceState = { inFence: false, fence: null as string | null }
    const targetLines = context?.changedLines?.length ? new Set(context.changedLines) : null

    let inReferences = false
    let referenceHeadingDepth = 0
    let expectedNumber = 1

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      if (isInCodeFence(line, fenceState)) return

      const headingMatch = line.match(/^(#+)\s+(References|参考文献|Bibliography)/i)
      if (headingMatch) {
        inReferences = true
        referenceHeadingDepth = headingMatch[1].length
        expectedNumber = 1
        return
      }

      if (inReferences && /^#+\s+/.test(line)) {
        const depth = line.match(/^(#+)/)?.[1].length ?? 0
        if (depth <= referenceHeadingDepth) {
          inReferences = false
        }
      }

      if (!inReferences) return
      if (targetLines && !targetLines.has(lineNumber)) return
      if (!line.trim()) return

      if (style === 'ieee' || style === 'acm') {
        const match = line.match(/^\s*\[(\d+)\]\s+.+/)
        if (!match) {
          results.push({
            id: `reference-list-format-style-${lineNumber}`,
            ruleId: 'reference-list-format',
            messageKey: 'formatter_rule_reference_list_format_style_numeric',
            message: 'References should use bracketed numeric entries (e.g., [1]).',
            line: lineNumber,
          })
          return
        }
        const num = Number.parseInt(match[1], 10)
        if (num !== expectedNumber) {
          results.push({
            id: `reference-list-format-seq-${lineNumber}`,
            ruleId: 'reference-list-format',
            messageKey: 'formatter_rule_reference_list_format_sequence',
            message: `Reference numbering should continue with [${expectedNumber}].`,
            line: lineNumber,
          })
          expectedNumber = num
        }
        expectedNumber = num + 1
      } else if (style === 'apa') {
        if (/^\s*\[\d+\]/.test(line)) {
          results.push({
            id: `reference-list-format-style-${lineNumber}`,
            ruleId: 'reference-list-format',
            messageKey: 'formatter_rule_reference_list_format_style_apa',
            message: 'APA reference entries should not be bracket-numbered.',
            line: lineNumber,
          })
          return
        }
        if (!/[A-Za-z].*\(\d{4}[a-z]?\)/.test(line)) {
          results.push({
            id: `reference-list-format-pattern-${lineNumber}`,
            ruleId: 'reference-list-format',
            messageKey: 'formatter_rule_reference_list_format_pattern',
            message: 'APA references should start with author and year (e.g., Smith, J. (2024)).',
            line: lineNumber,
          })
        }
      }
    })

    return results
  },
}

// ---------------------------------------------------------------------------
// figure-reference: 检查图表引用是否先于定义
// ---------------------------------------------------------------------------

export const figureReferenceRule: FormatRule = {
  id: 'figure-reference',
  name: 'formatter_rule_figure_reference',
  description: 'formatter_rule_figure_reference_desc',
  category: 'academic',
  enabled: false,
  lint: (content: string, options?: RuleOptions, context?: LintContext): LintResult[] => {
    const { label } = parseCaptionFormat(options?.figureFormat, 'Figure', ':')
    const labels = Array.from(new Set([label, 'Figure', 'Fig.', 'Fig'])).filter(Boolean)
    const lines = content.split('\n')
    const results: LintResult[] = []
    const fenceState = { inFence: false, fence: null as string | null }
    const targetLines = context?.changedLines?.length ? new Set(context.changedLines) : null

    const captionLines: Record<number, number> = {}
    lines.forEach((line, index) => {
      if (isInCodeFence(line, fenceState)) return
      const match = matchCaption(line, labels)
      if (match) {
        captionLines[match.number] = index + 1
      }
    })

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      if (isInCodeFence(line, fenceState)) return
      if (targetLines && !targetLines.has(lineNumber)) return

      const refMatch = line.match(/\b(Figure|Fig\.)\s+(\d+)\b/i)
      if (!refMatch) return

      const figureNumber = Number.parseInt(refMatch[2], 10)
      const captionLine = captionLines[figureNumber]
      if (!captionLine) {
        results.push({
          id: `figure-reference-missing-${lineNumber}`,
          ruleId: 'figure-reference',
          messageKey: 'formatter_rule_figure_reference_missing',
          message: `Figure ${figureNumber} is referenced before it is defined.`,
          line: lineNumber,
        })
      } else if (lineNumber < captionLine) {
        results.push({
          id: `figure-reference-order-${lineNumber}`,
          ruleId: 'figure-reference',
          messageKey: 'formatter_rule_figure_reference_order',
          message: `Figure ${figureNumber} should be defined before it is referenced.`,
          line: lineNumber,
        })
      }
    })

    return results
  },
}

// ---------------------------------------------------------------------------
// abstract-format: 检查摘要部分格式
// ---------------------------------------------------------------------------

export const abstractFormatRule: FormatRule = {
  id: 'abstract-format',
  name: 'formatter_rule_abstract_format',
  description: 'formatter_rule_abstract_format_desc',
  category: 'academic',
  enabled: false,
  lint: (content: string, _options?: RuleOptions, _context?: LintContext): LintResult[] => {
    const lines = content.split('\n')
    let abstractHeadingLine: number | null = null

    for (let i = 0; i < lines.length; i++) {
      if (/^#{1,6}\s+(Abstract|摘要)/i.test(lines[i])) {
        abstractHeadingLine = i + 1
        break
      }
    }

    if (abstractHeadingLine === null) {
      return [
        {
          id: 'abstract-format-missing',
          ruleId: 'abstract-format',
          messageKey: 'formatter_rule_abstract_format_missing',
          message: 'Abstract section is missing.',
          line: 1,
        },
      ]
    }

    let contentLength = 0
    for (let i = abstractHeadingLine; i < lines.length; i++) {
      const line = lines[i]
      if (/^#{1,6}\s+/.test(line)) break
      if (!line.trim()) continue
      contentLength += line.trim().length
      if (contentLength > 0) break
    }

    if (contentLength === 0) {
      return [
        {
          id: 'abstract-format-empty',
          ruleId: 'abstract-format',
          messageKey: 'formatter_rule_abstract_format_empty',
          message: 'Abstract section has no content.',
          line: abstractHeadingLine,
        },
      ]
    }

    return []
  },
}

// ---------------------------------------------------------------------------
// keywords-format: 检查关键词格式
// ---------------------------------------------------------------------------

export const keywordsFormatRule: FormatRule = {
  id: 'keywords-format',
  name: 'formatter_rule_keywords_format',
  description: 'formatter_rule_keywords_format_desc',
  category: 'academic',
  enabled: false,
  lint: (content: string, _options?: RuleOptions, _context?: LintContext): LintResult[] => {
    const lines = content.split('\n')
    let keywordsHeadingLine: number | null = null
    let keywordsLine: { text: string; line: number } | null = null

    for (let i = 0; i < lines.length; i++) {
      if (/^#{1,6}\s+(Keywords|关键词)/i.test(lines[i])) {
        keywordsHeadingLine = i + 1
        // 查找下一行非空内容
        for (let j = i + 1; j < lines.length; j++) {
          if (/^#{1,6}\s+/.test(lines[j])) break
          if (lines[j].trim()) {
            keywordsLine = { text: lines[j].trim(), line: j + 1 }
            break
          }
        }
        break
      }
    }

    if (!keywordsHeadingLine) {
      return [
        {
          id: 'keywords-format-missing',
          ruleId: 'keywords-format',
          messageKey: 'formatter_rule_keywords_format_missing',
          message: 'Keywords section is missing.',
          line: 1,
        },
      ]
    }

    if (!keywordsLine) {
      return [
        {
          id: 'keywords-format-empty',
          ruleId: 'keywords-format',
          messageKey: 'formatter_rule_keywords_format_empty',
          message: 'Keywords section has no content.',
          line: keywordsHeadingLine,
        },
      ]
    }

    const parts = keywordsLine.text.split(/[,;，；]/).map((p) => p.trim()).filter(Boolean)
    if (parts.length === 0) {
      return [
        {
          id: 'keywords-format-invalid',
          ruleId: 'keywords-format',
          messageKey: 'formatter_rule_keywords_format_invalid',
          message: 'Keywords should be a comma- or semicolon-separated list.',
          line: keywordsLine.line,
        },
      ]
    }

    if (parts.length > 12) {
      return [
        {
          id: 'keywords-format-count',
          ruleId: 'keywords-format',
          messageKey: 'formatter_rule_keywords_format_count',
          message: 'Too many keywords; keep the list concise.',
          line: keywordsLine.line,
        },
      ]
    }

    return []
  },
}

// ---------------------------------------------------------------------------
// 导出
// ---------------------------------------------------------------------------

export const academicRules: FormatRule[] = [
  headingNumberingRule,
  figureCaptionRule,
  tableCaptionRule,
  sectionDepthRule,
  paragraphLengthRule,
  citationFormatRule,
  referenceListFormatRule,
  figureReferenceRule,
  abstractFormatRule,
  keywordsFormatRule,
]
