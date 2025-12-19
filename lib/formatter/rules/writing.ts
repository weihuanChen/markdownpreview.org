/**
 * 写作质量规则（仅 Lint，不自动修复）
 * - heading-depth: 标题层级过深
 * - long-paragraph: 段落过长
 */

import type { FormatRule, RuleOptions, LintResult, LintContext } from '../engine'

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

// ---------------------------------------------------------------------------
// heading-depth: 标题层级过深
// ---------------------------------------------------------------------------

export const headingDepthRule: FormatRule = {
  id: 'heading-depth',
  name: 'formatter_rule_heading_depth',
  description: 'formatter_rule_heading_depth_desc',
  category: 'writing',
  enabled: false,
  lint: (content: string, options?: RuleOptions, context?: LintContext): LintResult[] => {
    const maxDepth = options?.maxHeadingDepth ?? 4
    const lines = content.split('\n')
    const results: LintResult[] = []
    const fenceState = { inFence: false, fence: null as string | null }
    const targetLines = context?.changedLines?.length ? new Set(context.changedLines) : null

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      if (isInCodeFence(line, fenceState)) return
      if (!line.startsWith('#')) return

      const match = line.match(/^(#+)\s+/)
      if (!match) return
      const depth = match[1].length
      if (depth > maxDepth) {
        if (targetLines && !targetLines.has(lineNumber)) return
        results.push({
          id: `heading-depth-${lineNumber}`,
          ruleId: 'heading-depth',
          messageKey: 'formatter_rule_heading_depth_desc',
          message: 'Heading depth exceeds limit',
          line: lineNumber,
        })
      }
    })

    return results
  },
}

// ---------------------------------------------------------------------------
// long-paragraph: 段落过长
// ---------------------------------------------------------------------------

export const longParagraphRule: FormatRule = {
  id: 'long-paragraph',
  name: 'formatter_rule_long_paragraph',
  description: 'formatter_rule_long_paragraph_desc',
  category: 'writing',
  enabled: false,
  lint: (content: string, options?: RuleOptions, context?: LintContext): LintResult[] => {
    const maxChars = options?.maxParagraphChars ?? 800
    const lines = content.split('\n')
    const results: LintResult[] = []
    const fenceState = { inFence: false, fence: null as string | null }
    const targetLines = context?.changedLines?.length ? new Set(context.changedLines) : null

    let buffer: string[] = []
    let startLine = 1

    const flushParagraph = (endLine: number) => {
      if (!buffer.length) return
      const paragraph = buffer.join(' ').trim()
      if (!paragraph) {
        buffer = []
        return
      }
      if (paragraph.length > maxChars) {
        const lineNumbers: number[] = []
        for (let i = startLine; i <= endLine; i++) {
          lineNumbers.push(i)
        }
        if (targetLines && !lineNumbers.some((line) => targetLines.has(line))) {
          buffer = []
          return
        }
        results.push({
          id: `long-paragraph-${startLine}`,
          ruleId: 'long-paragraph',
          messageKey: 'formatter_rule_long_paragraph_desc',
          message: 'Paragraph is too long',
          line: startLine,
          lines: lineNumbers,
        })
      }
      buffer = []
    }

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const inFence = isInCodeFence(line, fenceState)
      if (inFence) {
        flushParagraph(lineNumber - 1)
        return
      }

      if (line.trim() === '') {
        flushParagraph(lineNumber - 1)
        startLine = lineNumber + 1
        return
      }

      // 跳过标题行
      if (/^#{1,6}\s/.test(line)) {
        flushParagraph(lineNumber - 1)
        startLine = lineNumber + 1
        return
      }

      if (buffer.length === 0) {
        startLine = lineNumber
      }
      buffer.push(line.trim())
    })

    // 最后一段
    flushParagraph(lines.length)

    return results
  },
}

// ---------------------------------------------------------------------------
// 导出
// ---------------------------------------------------------------------------

export const writingRules: FormatRule[] = [
  headingDepthRule,
  longParagraphRule,
]
