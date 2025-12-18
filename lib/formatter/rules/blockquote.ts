/**
 * 引用相关规则
 * 
 * 包含：
 * - blockquote-space: > 后空格规范
 */

import type { FormatRule } from '../engine'

// ============================================================================
// blockquote-space: > 后空格规范
// ============================================================================

export const blockquoteSpaceRule: FormatRule = {
  id: 'blockquote-space',
  name: 'formatter_rule_blockquote_space',
  description: 'formatter_rule_blockquote_space_desc',
  category: 'blockquote',
  enabled: true,

  fix: (content: string): string => {
    // 保护代码块
    const codeBlockRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g
    const codeBlocks: string[] = []
    
    let processedContent = content.replace(codeBlockRegex, (match) => {
      codeBlocks.push(match)
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`
    })
    
    // 处理多层引用：>>text → >> text，>text → > text
    // 但保留空引用行：> 或 >>（末尾无内容）
    processedContent = processedContent.replace(
      /^(>+)([^\s>])/gm,
      '$1 $2'
    )
    
    // 规范化多个 > 之间的空格：> > > → >>>
    // 先将 > 后的空格去掉（如果后面还是 >）
    processedContent = processedContent.replace(
      /^(>)\s+(?=>)/gm,
      '$1'
    )
    
    // 恢复代码块
    for (let i = 0; i < codeBlocks.length; i++) {
      processedContent = processedContent.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i])
    }
    
    return processedContent
  },
}

// ============================================================================
// 导出所有引用规则
// ============================================================================

export const blockquoteRules: FormatRule[] = [
  blockquoteSpaceRule,
]

