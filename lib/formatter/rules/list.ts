/**
 * 列表相关规则
 * 
 * 包含：
 * - list-marker-style: 统一列表符号
 * - list-indent: 列表缩进统一
 */

import type { FormatRule, RuleOptions } from '../engine'

// ============================================================================
// list-marker-style: 统一列表符号
// ============================================================================

export const listMarkerStyleRule: FormatRule = {
  id: 'list-marker-style',
  name: 'formatter_rule_list_marker_style',
  description: 'formatter_rule_list_marker_style_desc',
  category: 'list',
  enabled: true,

  fix: (content: string, options?: RuleOptions): string => {
    const marker = options?.listMarker ?? '-'
    
    // 保护代码块
    const codeBlockRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g
    const codeBlocks: string[] = []
    
    let processedContent = content.replace(codeBlockRegex, (match) => {
      codeBlocks.push(match)
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`
    })
    
    // 匹配无序列表项：行首空白 + [*+-] + 空格 + 内容
    // 将 * 或 + 替换为指定的 marker（默认 -）
    processedContent = processedContent.replace(
      /^(\s*)([*+-])(\s+)/gm,
      (_, indent, _oldMarker, space) => `${indent}${marker}${space}`
    )
    
    // 恢复代码块
    for (let i = 0; i < codeBlocks.length; i++) {
      processedContent = processedContent.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i])
    }
    
    return processedContent
  },
}

// ============================================================================
// list-indent: 列表缩进统一
// ============================================================================

export const listIndentRule: FormatRule = {
  id: 'list-indent',
  name: 'formatter_rule_list_indent',
  description: 'formatter_rule_list_indent_desc',
  category: 'list',
  enabled: true,

  fix: (content: string, options?: RuleOptions): string => {
    const indentSize = options?.listIndentSize ?? 2
    
    // 保护代码块
    const codeBlockRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g
    const codeBlocks: string[] = []
    
    let processedContent = content.replace(codeBlockRegex, (match) => {
      codeBlocks.push(match)
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`
    })
    
    const lines = processedContent.split('\n')
    const result: string[] = []
    
    // 追踪列表层级
    let inList = false
    let baseIndent = 0
    
    for (const line of lines) {
      // 检测列表项：无序 (-、*、+) 或有序 (1.、2. 等)
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s/)
      
      if (listMatch) {
        const currentIndent = listMatch[1].length
        
        if (!inList) {
          // 进入列表
          inList = true
          baseIndent = currentIndent
        }
        
        // 计算相对于基础缩进的层级
        const relativeIndent = currentIndent - baseIndent
        
        // 规范化缩进层级（每层使用 indentSize 个空格）
        // 容忍范围：原缩进 / 2 或 / 4 来判断层级
        const level = Math.round(relativeIndent / 2) // 假设原缩进可能是 2 或 4
        const normalizedIndent = ' '.repeat(baseIndent + level * indentSize)
        
        // 替换缩进
        const newLine = line.replace(/^(\s*)([-*+]|\d+\.)(\s)/, `${normalizedIndent}$2 `)
        result.push(newLine)
      } else {
        // 非列表行
        if (line.trim() === '') {
          // 空行可能结束列表上下文
          // 但如果下一行还是列表，则保持
        } else if (!/^\s+/.test(line)) {
          // 非缩进的非空行，结束列表上下文
          inList = false
        }
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
// 导出所有列表规则
// ============================================================================

export const listRules: FormatRule[] = [
  listMarkerStyleRule,
  listIndentRule,
]

