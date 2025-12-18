/**
 * 代码块相关规则
 * 
 * 包含：
 * - code-fence-style: fence 统一（```）
 * - code-fence-spacing: fence 前后空行
 */

import type { FormatRule, RuleOptions } from '../engine'

// ============================================================================
// code-fence-style: fence 统一
// ============================================================================

export const codeFenceStyleRule: FormatRule = {
  id: 'code-fence-style',
  name: 'formatter_rule_code_fence_style',
  description: 'formatter_rule_code_fence_style_desc',
  category: 'code',
  enabled: true,

  fix: (content: string, options?: RuleOptions): string => {
    const targetFence = options?.codeFenceStyle ?? '```'
    const alternateFence = targetFence === '```' ? '~~~' : '```'
    
    // 匹配 ~~~ 开头和结尾的代码块，替换为 ```
    // 需要保持配对：开头和结尾使用相同的 fence
    const fenceRegex = new RegExp(
      `^(${alternateFence})(\\w*)\\n([\\s\\S]*?)\\n(${alternateFence})$`,
      'gm'
    )
    
    return content.replace(fenceRegex, `${targetFence}$2\n$3\n${targetFence}`)
  },
}

// ============================================================================
// code-fence-spacing: fence 前后空行
// ============================================================================

export const codeFenceSpacingRule: FormatRule = {
  id: 'code-fence-spacing',
  name: 'formatter_rule_code_fence_spacing',
  description: 'formatter_rule_code_fence_spacing_desc',
  category: 'code',
  enabled: true,

  fix: (content: string): string => {
    const lines = content.split('\n')
    const result: string[] = []
    
    let inCodeBlock = false
    let codeBlockFence = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isFirstLine = i === 0
      const isLastLine = i === lines.length - 1
      
      // 检测代码块开始
      const fenceStartMatch = line.match(/^(```|~~~)(\w*)$/)
      const fenceEndMatch = line.match(/^(```|~~~)$/)
      
      if (!inCodeBlock && fenceStartMatch) {
        // 代码块开始
        inCodeBlock = true
        codeBlockFence = fenceStartMatch[1]
        
        // 确保代码块前有空行（除非是第一行）
        if (!isFirstLine) {
          // 检查前一行是否为空
          const prevLine = result[result.length - 1]
          if (prevLine !== undefined && prevLine.trim() !== '') {
            result.push('')
          }
        }
        
        result.push(line)
      } else if (inCodeBlock && fenceEndMatch && fenceEndMatch[1] === codeBlockFence) {
        // 代码块结束
        inCodeBlock = false
        result.push(line)
        
        // 确保代码块后有空行（除非是最后一行）
        if (!isLastLine) {
          const nextLine = lines[i + 1]
          if (nextLine !== undefined && nextLine.trim() !== '') {
            result.push('')
          }
        }
      } else {
        result.push(line)
      }
    }
    
    return result.join('\n')
  },
}

// ============================================================================
// 导出所有代码块规则
// ============================================================================

export const codeBlockRules: FormatRule[] = [
  codeFenceStyleRule,
  codeFenceSpacingRule,
]

