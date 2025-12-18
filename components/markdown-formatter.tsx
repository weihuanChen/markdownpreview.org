"use client"

import type { CSSProperties } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Diff, Decoration, Hunk, markEdits, tokenize } from "react-diff-view"
import "react-diff-view/style/index.css"
import { parse as parseDiff } from "gitdiff-parser"
import {
  Wand2,
  Check,
  Undo2,
  Copy,
  Eye,
  GitCompare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Settings2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useFormatter, type FormatterMode } from "@/hooks/use-formatter"
import { allRules, presets, presetMeta, type FormatRuleId, type PresetName, type RuleCategory } from "@/lib/formatter"

// 动态导入编辑器和预览组件
const CodeMirrorEditor = dynamic(() => import("@/components/code-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading editor...
    </div>
  ),
})

const MarkdownPreview = dynamic(
  () => import("@/components/markdown-preview").then((mod) => mod.MarkdownPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading preview...
      </div>
    ),
  }
)

// ============================================================================
// 示例内容
// ============================================================================

const SAMPLE_MARKDOWN = `#Hello World
This is a sample markdown document with some formatting issues.

##Features
*  Item one
*  Item two
*  Item three

>This is a quote without proper spacing

\`\`\`javascript
function hello() {
  console.log("Hello!")
}
\`\`\`
Some text right after the code block.

### Trailing spaces   
This line has trailing spaces.   


Too many blank lines above.

####Another heading without space after #
`

// ============================================================================
// Diff 生成工具
// ============================================================================

function createUnifiedDiff(original: string, formatted: string): string {
  const originalLines = original.split('\n')
  const formattedLines = formatted.split('\n')
  
  let diff = 'diff --git a/original.md b/formatted.md\n'
  diff += 'index 0000000..0000000 100644\n'
  diff += '--- a/original.md\n'
  diff += '+++ b/formatted.md\n'
  
  // 简单的统一 diff 生成
  const maxLines = Math.max(originalLines.length, formattedLines.length)
  let hunkStart = -1
  let hunkLines: string[] = []
  let oldStart = 1
  let newStart = 1
  let oldCount = 0
  let newCount = 0
  
  const flushHunk = () => {
    if (hunkLines.length > 0) {
      diff += `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@\n`
      diff += hunkLines.join('\n') + '\n'
      hunkLines = []
    }
  }
  
  let i = 0
  let j = 0
  
  while (i < originalLines.length || j < formattedLines.length) {
    const origLine = originalLines[i] ?? ''
    const formLine = formattedLines[j] ?? ''
    
    if (i < originalLines.length && j < formattedLines.length && origLine === formLine) {
      // 相同行
      if (hunkLines.length > 0) {
        hunkLines.push(` ${origLine}`)
        oldCount++
        newCount++
      }
      i++
      j++
    } else {
      // 不同行
      if (hunkLines.length === 0) {
        oldStart = i + 1
        newStart = j + 1
        oldCount = 0
        newCount = 0
      }
      
      if (i < originalLines.length && (j >= formattedLines.length || origLine !== formLine)) {
        hunkLines.push(`-${origLine}`)
        oldCount++
        i++
      }
      if (j < formattedLines.length && (i >= originalLines.length || origLine !== formLine)) {
        hunkLines.push(`+${formLine}`)
        newCount++
        j++
      }
    }
    
    // 如果连续多行相同，刷新 hunk
    if (hunkLines.length > 0 && i < originalLines.length && j < formattedLines.length) {
      let lookAhead = 0
      while (
        i + lookAhead < originalLines.length &&
        j + lookAhead < formattedLines.length &&
        originalLines[i + lookAhead] === formattedLines[j + lookAhead]
      ) {
        lookAhead++
      }
      if (lookAhead > 3) {
        // 添加一些上下文行然后刷新
        for (let k = 0; k < Math.min(3, lookAhead); k++) {
          hunkLines.push(` ${originalLines[i + k]}`)
          oldCount++
          newCount++
        }
        i += Math.min(3, lookAhead)
        j += Math.min(3, lookAhead)
        flushHunk()
      }
    }
  }
  
  flushHunk()
  
  return diff
}

// ============================================================================
// 主组件
// ============================================================================

// 规则分类信息
const RULE_CATEGORIES: { id: RuleCategory; label: string; icon: string }[] = [
  { id: 'whitespace', label: 'Whitespace', icon: '⎵' },
  { id: 'heading', label: 'Headings', icon: '#' },
  { id: 'list', label: 'Lists', icon: '•' },
  { id: 'blockquote', label: 'Blockquotes', icon: '>' },
  { id: 'code', label: 'Code', icon: '`' },
]

// 预设顺序
const PRESET_ORDER: PresetName[] = ['standard', 'github', 'writing', 'strict']

type LintSeverity = 'error' | 'warning' | 'info'

interface LintResult {
  id: string
  ruleId: FormatRuleId
  severity: LintSeverity
  message: string
}

const LINT_SEVERITY_META: Record<LintSeverity, { label: string; tone: string }> = {
  error: { label: 'Error', tone: 'text-red-600 dark:text-red-300 border-red-500/30 bg-red-500/5' },
  warning: { label: 'Warning', tone: 'text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/5' },
  info: { label: 'Info', tone: 'text-blue-700 dark:text-blue-300 border-blue-500/30 bg-blue-500/5' },
}

const RULE_SEVERITY_BY_CATEGORY: Record<RuleCategory, LintSeverity> = {
  whitespace: 'info',
  heading: 'warning',
  list: 'warning',
  blockquote: 'info',
  code: 'warning',
}

export function MarkdownFormatter() {
  const { theme } = useTheme()
  
  // 使用 formatter hook
  const {
    content,
    setContent,
    result,
    runFormat,
    runFormatWithRules,
    applyFormat,
    undo,
    canUndo,
    isFormatting,
    hasUnsavedChanges,
    // 新增：模式和规则管理
    mode,
    setMode,
    ruleStates,
    toggleRule,
    enableAllRules,
    disableAllRules,
    currentPreset,
    applyPreset,
  } = useFormatter({ initialContent: "" })
  
  // UI 状态
  const [viewMode, setViewMode] = useState<"diff" | "preview">("diff")
  const [showRules, setShowRules] = useState(false)
  const [copied, setCopied] = useState(false)
  const [diffType, setDiffType] = useState<"word" | "block">("word")
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false)
  const [selectedRuleIds, setSelectedRuleIds] = useState<FormatRuleId[]>([])
  
  // 解析 diff
  const diffData = useMemo(() => {
    if (!result?.hasChanges) return null
    
    try {
      const diffText = createUnifiedDiff(result.original, result.formatted)
      const files = parseDiff(diffText)
      return { files, diffText }
    } catch (error) {
      console.error('Failed to parse diff:', error)
      return null
    }
  }, [result])
  
  const hunks = diffData?.files?.[0]?.hunks ?? []
  
  // Diff tokens
  const tokens = useMemo(() => {
    if (!hunks.length) return null
    return tokenize(hunks, {
      enhancers: [markEdits(hunks, { type: diffType })],
    })
  }, [hunks, diffType])
  
  // Diff 主题样式
  const diffThemeStyles = useMemo<CSSProperties>(() => {
    const lightInsert = "#e6f7ea"
    const lightDelete = "#fdecef"
    const darkInsert = "rgba(34,197,94,0.16)"
    const darkDelete = "rgba(239,68,68,0.16)"

    return {
      "--diff-background-color": "transparent",
      "--diff-text-color": "var(--foreground)",
      "--diff-gutter-insert-background-color": theme === "dark" ? darkInsert : lightInsert,
      "--diff-gutter-delete-background-color": theme === "dark" ? darkDelete : lightDelete,
      "--diff-code-insert-background-color": theme === "dark" ? "rgba(34,197,94,0.14)" : "#e6f7ea",
      "--diff-code-delete-background-color": theme === "dark" ? "rgba(239,68,68,0.14)" : "#fdecef",
      "--diff-code-insert-edit-background-color": theme === "dark" ? "rgba(34,197,94,0.4)" : "#97f295",
      "--diff-code-delete-edit-background-color": theme === "dark" ? "rgba(239,68,68,0.4)" : "#ffb6ba",
      "--diff-selection-background-color": theme === "dark" ? "rgba(59,130,246,0.18)" : "#b3d7ff",
    }
  }, [theme])
  
  // 处理复制
  const handleCopy = useCallback(async () => {
    const textToCopy = result?.formatted ?? content
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [result, content])
  
  // 加载示例
  const loadSample = useCallback(() => {
    setContent(SAMPLE_MARKDOWN)
  }, [setContent])
  
  // 统计信息
  const stats = useMemo(() => {
    if (!result?.appliedRules) return null
    return {
      rulesApplied: result.appliedRules.length,
      hasChanges: result.hasChanges,
    }
  }, [result])
  
  // 获取规则信息
  const getRuleInfo = (ruleId: FormatRuleId) => {
    return allRules.find(r => r.id === ruleId)
  }

  // 按分类分组的规则
  const rulesByCategory = useMemo(() => {
    const grouped: Record<RuleCategory, typeof ruleStates> = {
      whitespace: [],
      heading: [],
      list: [],
      blockquote: [],
      code: [],
    }
    
    ruleStates.forEach(ruleState => {
      const rule = allRules.find(r => r.id === ruleState.id)
      if (rule) {
        grouped[rule.category].push(ruleState)
      }
    })
    
    return grouped
  }, [ruleStates])

  // 启用的规则数量
  const enabledCount = useMemo(() => 
    ruleStates.filter(r => r.enabled).length,
    [ruleStates]
  )

  const lintResults = useMemo<LintResult[]>(() => {
    if (!result?.appliedRules?.length) return []
    return result.appliedRules.map((ruleId, index) => {
      const rule = allRules.find(r => r.id === ruleId)
      const severity = rule ? RULE_SEVERITY_BY_CATEGORY[rule.category] : 'warning'
      return {
        id: `${ruleId}-${index}`,
        ruleId,
        severity,
        message: 'Auto-fixable formatting issue.',
      }
    })
  }, [result])

  const lintSummary = useMemo(() => {
    const bySeverity: Record<LintSeverity, number> = {
      error: 0,
      warning: 0,
      info: 0,
    }
    for (const item of lintResults) {
      bySeverity[item.severity] += 1
    }
    return {
      total: lintResults.length,
      bySeverity,
    }
  }, [lintResults])

  const lintGroups = useMemo(() => {
    const grouped: Record<LintSeverity, Record<FormatRuleId, LintResult[]>> = {
      error: {} as Record<FormatRuleId, LintResult[]>,
      warning: {} as Record<FormatRuleId, LintResult[]>,
      info: {} as Record<FormatRuleId, LintResult[]>,
    }
    for (const item of lintResults) {
      const bucket = grouped[item.severity]
      if (!bucket[item.ruleId]) {
        bucket[item.ruleId] = []
      }
      bucket[item.ruleId].push(item)
    }
    return grouped
  }, [lintResults])

  const lintRuleIds = useMemo(() => new Set(lintResults.map((item) => item.ruleId)), [lintResults])

  useEffect(() => {
    setSelectedRuleIds((prev) => prev.filter((ruleId) => lintRuleIds.has(ruleId)))
  }, [lintRuleIds])

  const toggleSelectedRule = useCallback((ruleId: FormatRuleId) => {
    setSelectedRuleIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    )
  }, [])

  const handleFixSelected = useCallback(() => {
    if (!selectedRuleIds.length) return
    runFormatWithRules(selectedRuleIds)
  }, [runFormatWithRules, selectedRuleIds])

  return (
    <section className="w-full py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Markdown Formatter
              </h1>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
                <Button
                  size="sm"
                  variant={mode === "simple" ? "default" : "ghost"}
                  onClick={() => setMode("simple")}
                  className={
                    mode === "simple"
                      ? "!bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Simple
                </Button>
                <Button
                  size="sm"
                  variant={mode === "advanced" ? "default" : "ghost"}
                  onClick={() => {
                    setMode("advanced")
                    setShowAdvancedPanel(true)
                  }}
                  className={
                    mode === "advanced"
                      ? "!bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                  Advanced
                </Button>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Automatically format and beautify your Markdown. Preview changes with diff view before applying.
            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20">
              Safe formatting only
            </span>
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Editor */}
          <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Input</h2>
                <p className="text-xs text-muted-foreground">Paste or type your Markdown</p>
              </div>
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    Unsaved changes
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSample}
                  className="text-xs border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                >
                  Load Sample
                </Button>
              </div>
            </div>
            <div className="h-[400px] lg:h-[500px] overflow-hidden">
              <CodeMirrorEditor
                value={content}
                onChange={setContent}
                theme={theme}
              />
            </div>
          </div>

          {/* Right: Diff/Preview */}
          <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1">
                  <Button
                    size="sm"
                    variant={viewMode === "diff" ? "default" : "outline"}
                    onClick={() => setViewMode("diff")}
                    className={
                      viewMode === "diff"
                        ? "!bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
                        : "border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                    }
                  >
                    <GitCompare className="h-3.5 w-3.5 mr-1" />
                    Diff
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "preview" ? "default" : "outline"}
                    onClick={() => setViewMode("preview")}
                    className={
                      viewMode === "preview"
                        ? "!bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
                        : "border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                    }
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Preview
                  </Button>
                </div>
                
                {viewMode === "diff" && result?.hasChanges && (
                  <div className="flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1">
                    <Button
                      size="sm"
                      variant={diffType === "word" ? "default" : "outline"}
                      onClick={() => setDiffType("word")}
                      className={
                        diffType === "word"
                          ? "!bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
                          : "border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                      }
                    >
                      Word
                    </Button>
                    <Button
                      size="sm"
                      variant={diffType === "block" ? "default" : "outline"}
                      onClick={() => setDiffType("block")}
                      className={
                        diffType === "block"
                          ? "!bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
                          : "border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                      }
                    >
                      Block
                    </Button>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-xs border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            
            <div className="h-[400px] lg:h-[500px] overflow-auto">
              {viewMode === "diff" ? (
                result?.hasChanges && diffData ? (
                  <div style={diffThemeStyles} className="text-sm">
                    <Diff
                      viewType="unified"
                      diffType="modify"
                      hunks={hunks}
                      tokens={tokens ?? undefined}
                    >
                      {(hunksToRender) =>
                        hunksToRender.flatMap((hunk, index) => [
                          <Decoration key={`decoration-${index}`}>
                            <div className="diff-hunk-anchor" />
                          </Decoration>,
                          <Hunk
                            key={`${hunk.content}-${hunk.oldStart}-${hunk.newStart}-${index}`}
                            hunk={hunk}
                          />,
                        ])
                      }
                    </Diff>
                  </div>
                ) : result && !result.hasChanges ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3 p-8">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                      <div>
                        <p className="text-sm font-medium text-foreground">No changes needed</p>
                        <p className="text-xs text-muted-foreground">Your Markdown is already well formatted!</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2 p-8">
                      <GitCompare className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Click "Format" to see changes
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <MarkdownPreview content={result?.formatted ?? content} />
              )}
            </div>
          </div>
        </div>

        {/* Advanced Mode: Rules Panel */}
        {mode === "advanced" && showAdvancedPanel && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Rule Configuration</h2>
                  <p className="text-xs text-muted-foreground">
                    {enabledCount} of {ruleStates.length} rules enabled
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Preset Selector */}
                <div className="flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1 py-0.5">
                  {PRESET_ORDER.map((presetId) => {
                    const meta = presetMeta[presetId]
                    const isActive = currentPreset === presetId
                    return (
                      <Button
                        key={presetId}
                        size="sm"
                        variant={isActive ? "default" : "ghost"}
                        onClick={() => applyPreset(presetId)}
                        className={
                          isActive
                            ? "!bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2] text-xs h-7"
                            : "text-muted-foreground hover:text-foreground text-xs h-7"
                        }
                        title={`${meta.description} (${meta.rulesCount} rules)`}
                      >
                        {meta.label}
                      </Button>
                    )
                  })}
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-1 border-l border-border pl-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={enableAllRules}
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    Enable All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={disableAllRules}
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    Disable All
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAdvancedPanel(false)}
                  className="h-7 w-7 p-0"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Rules Grid */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {RULE_CATEGORIES.map((category) => (
                  <div key={category.id} className="space-y-2">
                    {/* Category Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <span className="text-lg font-mono">{category.icon}</span>
                      <span className="text-sm font-medium text-foreground">{category.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {rulesByCategory[category.id].filter(r => r.enabled).length}/{rulesByCategory[category.id].length}
                      </span>
                    </div>
                    
                    {/* Rules List */}
                    <div className="space-y-1">
                      {rulesByCategory[category.id].map((ruleState) => {
                        const rule = getRuleInfo(ruleState.id)
                        return (
                          <button
                            key={ruleState.id}
                            onClick={() => toggleRule(ruleState.id)}
                            className={`
                              w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs
                              transition-colors duration-150
                              ${ruleState.enabled 
                                ? 'bg-primary/10 text-foreground hover:bg-primary/15' 
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                              }
                            `}
                          >
                            {ruleState.enabled ? (
                              <ToggleRight className="h-4 w-4 text-primary flex-shrink-0" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="truncate font-mono text-[11px]">
                              {ruleState.id}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Advanced Panel Toggle */}
        {mode === "advanced" && !showAdvancedPanel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedPanel(true)}
            className="w-full border-dashed border-border text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Show Rule Configuration ({enabledCount}/{ruleStates.length} enabled)
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        )}

        {/* Lint Results Panel */}
        {mode === "advanced" && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Lint Results</h2>
                  <p className="text-xs text-muted-foreground">
                    Grouped by rule and severity
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded border border-border bg-muted/50">
                  {lintSummary.total} total
                </span>
                <span className="px-2 py-1 rounded border border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-300">
                  {lintSummary.bySeverity.error} error
                </span>
                <span className="px-2 py-1 rounded border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300">
                  {lintSummary.bySeverity.warning} warning
                </span>
                <span className="px-2 py-1 rounded border border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300">
                  {lintSummary.bySeverity.info} info
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Selected</span>
                  <span className="px-2 py-0.5 rounded border border-border bg-background text-foreground">
                    {selectedRuleIds.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={runFormat}
                    disabled={!content || isFormatting}
                    className="text-xs border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                  >
                    Fix All
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleFixSelected}
                    disabled={!content || isFormatting || selectedRuleIds.length === 0}
                    className="text-xs !bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
                  >
                    Fix Selected
                  </Button>
                </div>
              </div>

              {lintResults.length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {result ? "No lint issues detected" : "Run Format to generate lint results"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result ? "Your current content passes all enabled rules." : "Lint results will appear after formatting."}
                    </p>
                  </div>
                </div>
              ) : (
                (['error', 'warning', 'info'] as LintSeverity[]).map((severity) => {
                  const byRule = lintGroups[severity]
                  const entries = Object.entries(byRule)
                  if (!entries.length) return null

                  const meta = LINT_SEVERITY_META[severity]
                  const severityCount = lintSummary.bySeverity[severity]

                  return (
                    <div key={severity} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            severity === 'error'
                              ? 'text-red-500'
                              : severity === 'warning'
                              ? 'text-amber-500'
                              : 'text-blue-500'
                          }`}
                        />
                        {meta.label} · {severityCount}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {entries.map(([ruleId, items]) => (
                          <button
                            key={ruleId}
                            type="button"
                            onClick={() => toggleSelectedRule(ruleId as FormatRuleId)}
                            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${meta.tone} ${
                              selectedRuleIds.includes(ruleId as FormatRuleId)
                                ? 'ring-1 ring-[var(--brand-blue)]'
                                : 'hover:bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] text-foreground truncate">
                                {ruleId}
                              </span>
                              <span className="text-[10px] font-semibold">
                                {items.length} issue{items.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {selectedRuleIds.includes(ruleId as FormatRuleId) && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--brand-blue)]">
                                <Check className="h-3 w-3" />
                                Selected
                              </div>
                            )}
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {items[0]?.message}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={runFormat}
                disabled={!content || isFormatting}
                className="!bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
              >
                {isFormatting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Formatting...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Format
                  </>
                )}
              </Button>
              
              {result?.hasChanges && (
                <Button
                  onClick={applyFormat}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-500/10"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Apply Changes
                </Button>
              )}
              
              <Button
                onClick={undo}
                variant="outline"
                disabled={!canUndo}
                className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Undo
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              {stats && result?.hasChanges && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                    {stats.rulesApplied} rule{stats.rulesApplied !== 1 ? 's' : ''} applied
                  </span>
                </div>
              )}
              
              {/* Mode indicator */}
              {mode === "advanced" && (
                <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  {enabledCount}/{ruleStates.length} rules
                </span>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRules(!showRules)}
                className="text-xs border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
              >
                <Info className="h-3.5 w-3.5 mr-1" />
                {showRules ? "Hide applied" : "Show applied"}
                {showRules ? (
                  <ChevronUp className="h-3.5 w-3.5 ml-1" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Applied Rules Panel */}
          {showRules && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {result?.appliedRules?.length ? 'Applied Rules' : 'Enabled Rules'}
                </h3>
                {mode === "simple" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMode("advanced")
                      setShowAdvancedPanel(true)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Settings2 className="h-3.5 w-3.5 mr-1" />
                    Customize rules
                  </Button>
                )}
              </div>
              {result?.appliedRules && result.appliedRules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {result.appliedRules.map((ruleId) => {
                    const rule = getRuleInfo(ruleId)
                    return (
                      <div
                        key={ruleId}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-500/30 bg-green-500/5"
                      >
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-foreground font-mono">{ruleId}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ruleStates.filter(r => r.enabled).map((ruleState) => (
                    <div
                      key={ruleState.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground font-mono">{ruleState.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">About Markdown Formatter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">✓</span>
                Safe Formatting
              </h3>
              <p className="text-muted-foreground">
                Only applies 100% safe fixes that won't change your content's meaning. Review all changes before applying.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">⚡</span>
                Diff Preview
              </h3>
              <p className="text-muted-foreground">
                See exactly what changes will be made with our side-by-side diff view. No surprises.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">↩</span>
                Undo Support
              </h3>
              <p className="text-muted-foreground">
                Made a mistake? Simply undo to restore your previous content. Full history support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
