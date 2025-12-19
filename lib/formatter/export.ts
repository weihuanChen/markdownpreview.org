/**
 * 报告导出工具
 * 
 * 支持导出格式：
 * - JSON: 结构化数据，便于程序处理
 * - Markdown: 人类可读的报告
 * - SARIF: 标准静态分析结果格式（用于 CI/CD）
 */

import type { FormatResult, LintResult, FormatRuleId } from './engine'
import { allRules } from './rules'

// ============================================================================
// JSON 导出
// ============================================================================

export interface ExportData {
  generatedAt: string
  appliedRules: FormatRuleId[]
  lintResults: LintResult[]
  changedLines: number[]
  hasChanges: boolean
  originalLength: number
  formattedLength: number
  original?: string
  formatted?: string
}

export function exportToJSON(result: FormatResult, includeContent = false): string {
  const data: ExportData = {
    generatedAt: new Date().toISOString(),
    appliedRules: result.appliedRules,
    lintResults: result.lintResults,
    changedLines: result.changedLines,
    hasChanges: result.hasChanges,
    originalLength: result.original.length,
    formattedLength: result.formatted.length,
  }

  if (includeContent) {
    data.original = result.original
    data.formatted = result.formatted
  }

  return JSON.stringify(data, null, 2)
}

// ============================================================================
// Markdown 导出
// ============================================================================

export function exportToMarkdown(result: FormatResult): string {
  const lines: string[] = []
  
  lines.push('# Markdown Formatter Report')
  lines.push('')
  lines.push(`- Generated: ${new Date().toISOString()}`)
  lines.push(`- Applied rules: ${result.appliedRules.length}`)
  lines.push(`- Lint issues: ${result.lintResults.length}`)
  lines.push(`- Changed lines: ${result.changedLines.join(', ') || 'N/A'}`)
  lines.push('')
  
  // Lint Results
  lines.push('## Lint Results')
  if (!result.lintResults.length) {
    lines.push('- None')
  } else {
    // 按严重级别分组
    const bySeverity: Record<string, LintResult[]> = {
      error: [],
      warning: [],
      info: [],
    }
    
    result.lintResults.forEach(item => {
      bySeverity[item.severity] = bySeverity[item.severity] || []
      bySeverity[item.severity].push(item)
    })
    
    for (const severity of ['error', 'warning', 'info'] as const) {
      if (bySeverity[severity].length === 0) continue
      
      lines.push('')
      lines.push(`### ${severity.toUpperCase()}`)
      bySeverity[severity].forEach(item => {
        const lineInfo = item.lines && item.lines.length > 1
          ? `lines ${item.lines.join(', ')}`
          : `line ${item.line ?? 'n/a'}`
        lines.push(`- **${item.ruleId}** @ ${lineInfo} — ${item.message}`)
      })
    }
  }
  
  lines.push('')
  lines.push('---')
  lines.push('')
  
  // Applied Rules
  if (result.appliedRules.length > 0) {
    lines.push('## Applied Rules')
    result.appliedRules.forEach(ruleId => {
      const rule = allRules.find(r => r.id === ruleId)
      lines.push(`- ${ruleId}${rule ? ` (${rule.name})` : ''}`)
    })
    lines.push('')
  }
  
  // Content (可选)
  lines.push('### Original')
  lines.push('```markdown')
  lines.push(result.original)
  lines.push('```')
  lines.push('')
  lines.push('### Formatted')
  lines.push('```markdown')
  lines.push(result.formatted)
  lines.push('```')
  
  return lines.join('\n')
}

// ============================================================================
// SARIF 导出
// ============================================================================

export interface SARIFLog {
  version: string
  $schema: string
  runs: SARIFRun[]
}

export interface SARIFRun {
  tool: {
    driver: {
      name: string
      version: string
      rules?: SARIFRule[]
    }
  }
  results: SARIFResult[]
}

export interface SARIFRule {
  id: string
  name: string
  shortDescription: {
    text: string
  }
  fullDescription?: {
    text: string
  }
  defaultConfiguration?: {
    level: string
  }
}

export interface SARIFResult {
  ruleId: string
  level: 'error' | 'warning' | 'note'
  message: {
    text: string
  }
  locations: SARIFLocation[]
}

export interface SARIFLocation {
  physicalLocation: {
    artifactLocation: {
      uri: string
    }
    region: {
      startLine: number
      startColumn?: number
      endLine?: number
      endColumn?: number
    }
  }
}

function severityToSARIFLevel(severity: string): 'error' | 'warning' | 'note' {
  switch (severity) {
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
    default:
      return 'note'
  }
}

export function exportToSARIF(result: FormatResult, fileUri = 'file:///example.md'): string {
  // 构建规则描述
  const rules: SARIFRule[] = []
  const ruleIds = new Set<string>()
  
  result.lintResults.forEach(lint => {
    if (ruleIds.has(lint.ruleId)) return
    ruleIds.add(lint.ruleId)
    
    const rule = allRules.find(r => r.id === lint.ruleId)
    rules.push({
      id: lint.ruleId,
      name: rule?.name || lint.ruleId,
      shortDescription: {
        text: rule?.description || lint.message,
      },
      defaultConfiguration: {
        level: severityToSARIFLevel(lint.severity),
      },
    })
  })
  
  // 构建结果
  const results: SARIFResult[] = result.lintResults.map(lint => {
    const startLine = lint.line ?? 1
    const endLine = lint.lines && lint.lines.length > 1
      ? Math.max(...lint.lines)
      : startLine
    
    return {
      ruleId: lint.ruleId,
      level: severityToSARIFLevel(lint.severity),
      message: {
        text: lint.message,
      },
      locations: [{
        physicalLocation: {
          artifactLocation: {
            uri: fileUri,
          },
          region: {
            startLine,
            endLine,
          },
        },
      }],
    }
  })
  
  const log: SARIFLog = {
    version: '2.1.0',
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    runs: [{
      tool: {
        driver: {
          name: 'Markdown Formatter',
          version: '1.0.0',
          rules: rules.length > 0 ? rules : undefined,
        },
      },
      results,
    }],
  }
  
  return JSON.stringify(log, null, 2)
}

