/**
 * 标题相关规则
 * 
 * 包含：
 * - heading-space: # 后必须有空格
 * - heading-blank-lines: 标题前后空行一致
 */

import type { FormatRule, RuleOptions } from '../engine'

// ============================================================================
// heading-space: # 后必须有空格
// ============================================================================

export const headingSpaceRule: FormatRule = {
  id: 'heading-space',
  name: 'formatter_rule_heading_space',
  description: 'formatter_rule_heading_space_desc',
  category: 'heading',
  enabled: true,

  fix: (content: string): string => {
    // 匹配行首的 1-6 个 # 后面紧跟非空格非 # 的字符
    // 例如：#标题 → # 标题
    // 但不影响：# 标题、##、# （空标题）
    return content.replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
  },
}

// ============================================================================
// heading-blank-lines: 标题前后空行一致
// ============================================================================

export const headingBlankLinesRule: FormatRule = {
  id: 'heading-blank-lines',
  name: 'formatter_rule_heading_blank_lines',
  description: 'formatter_rule_heading_blank_lines_desc',
  category: 'heading',
  enabled: true,

  fix: (content: string, options?: RuleOptions): string => {
    const blanksBefore = options?.headingBlankLinesBefore ?? 1
    const blanksAfter = options?.headingBlankLinesAfter ?? 1
    
    // 保护代码块
    const codeBlockRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g
    const codeBlocks: string[] = []
    
    let processedContent = content.replace(codeBlockRegex, (match) => {
      codeBlocks.push(match)
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`
    })
    
    const lines = processedContent.split('\n')
    const result: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isHeading = /^#{1,6}\s/.test(line)
      const isFirstLine = i === 0
      
      if (isHeading) {
        // 确保标题前有正确数量的空行（除非是第一行）
        if (!isFirstLine) {
          // 移除之前多余的空行
          while (result.length > 0 && result[result.length - 1].trim() === '') {
            result.pop()
          }
          // 添加指定数量的空行
          for (let j = 0; j < blanksBefore; j++) {
            result.push('')
          }
        }
        
        result.push(line)
        
        // 检查下一行是否存在且非空
        const nextLineIndex = i + 1
        if (nextLineIndex < lines.length) {
          const nextLine = lines[nextLineIndex]
          const nextIsEmpty = nextLine.trim() === ''
          const nextIsHeading = /^#{1,6}\s/.test(nextLine)
          
          // 如果下一行不是空行也不是标题，需要添加空行
          if (!nextIsEmpty && !nextIsHeading) {
            for (let j = 0; j < blanksAfter; j++) {
              result.push('')
            }
          }
        }
      } else {
        result.push(line)
      }
    }
    
    processedContent = result.join('\n')
    
    // 恢复代码块
    for (let i = 0; i < codeBlocks.length; i++) {
      processedContent = processedContent.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i])
    }
    
    return processedContent
  },
}

// ============================================================================
// 导出所有标题规则
// ============================================================================

export const headingRules: FormatRule[] = [
  headingSpaceRule,
  headingBlankLinesRule,
]

