/**
 * 空白字符相关规则
 * 
 * 包含：
 * - trailing-spaces: 移除行尾空格
 * - eof-newline: 文件末尾保留一个空行
 * - consecutive-blanks: 多余空行压缩
 */

import type { FormatRule, RuleOptions } from '../engine'

// ============================================================================
// trailing-spaces: 移除行尾空格
// ============================================================================

export const trailingSpacesRule: FormatRule = {
  id: 'trailing-spaces',
  name: 'formatter_rule_trailing_spaces',
  description: 'formatter_rule_trailing_spaces_desc',
  category: 'whitespace',
  enabled: true,

  fix: (content: string): string => {
    // 处理代码块：保护代码块内的行尾空格
    const codeBlockRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g
    const codeBlocks: string[] = []
    
    // 提取代码块并用占位符替换
    let processedContent = content.replace(codeBlockRegex, (match) => {
      codeBlocks.push(match)
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`
    })
    
    // 移除非代码块区域的行尾空格
    processedContent = processedContent.replace(/[ \t]+$/gm, '')
    
    // 恢复代码块
    for (let i = 0; i < codeBlocks.length; i++) {
      processedContent = processedContent.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i])
    }
    
    return processedContent
  },
}

// ============================================================================
// eof-newline: 文件末尾保留一个空行
// ============================================================================

export const eofNewlineRule: FormatRule = {
  id: 'eof-newline',
  name: 'formatter_rule_eof_newline',
  description: 'formatter_rule_eof_newline_desc',
  category: 'whitespace',
  enabled: true,

  fix: (content: string): string => {
    if (!content) return '\n'
    
    // 移除末尾所有空白字符，然后添加一个换行符
    return content.trimEnd() + '\n'
  },
}

// ============================================================================
// consecutive-blanks: 多余空行压缩
// ============================================================================

export const consecutiveBlanksRule: FormatRule = {
  id: 'consecutive-blanks',
  name: 'formatter_rule_consecutive_blanks',
  description: 'formatter_rule_consecutive_blanks_desc',
  category: 'whitespace',
  enabled: true,

  fix: (content: string, options?: RuleOptions): string => {
    const maxBlanks = options?.maxConsecutiveBlankLines ?? 1
    
    // 处理代码块：保护代码块内的空行
    const codeBlockRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g
    const codeBlocks: string[] = []
    
    // 提取代码块并用占位符替换
    let processedContent = content.replace(codeBlockRegex, (match) => {
      codeBlocks.push(match)
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`
    })
    
    // 构建匹配连续空行的正则（保留 maxBlanks 个空行）
    // 连续空行 = 连续 2+ 个换行符之间只有空白字符
    const blankLinePattern = /\n([ \t]*\n){2,}/g
    
    // 替换为最多 maxBlanks + 1 个换行符
    const replacement = '\n' + '\n'.repeat(maxBlanks)
    processedContent = processedContent.replace(blankLinePattern, replacement)
    
    // 恢复代码块
    for (let i = 0; i < codeBlocks.length; i++) {
      processedContent = processedContent.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i])
    }
    
    return processedContent
  },
}

// ============================================================================
// 导出所有空白字符规则
// ============================================================================

export const whitespaceRules: FormatRule[] = [
  trailingSpacesRule,
  eofNewlineRule,
  consecutiveBlanksRule,
]

