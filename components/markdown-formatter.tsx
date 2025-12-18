"use client"

import type { CSSProperties } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Diff, Decoration, Hunk, markEdits, tokenize } from "react-diff-view"
import "react-diff-view/style/index.css"
import { parseDiff } from "gitdiff-parser"
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
} from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useFormatter } from "@/hooks/use-formatter"
import { allRules, type FormatRuleId } from "@/lib/formatter"

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

export function MarkdownFormatter() {
  const { theme } = useTheme()
  
  // 使用 formatter hook
  const {
    content,
    setContent,
    result,
    runFormat,
    applyFormat,
    undo,
    canUndo,
    isFormatting,
    hasUnsavedChanges,
  } = useFormatter({ initialContent: "" })
  
  // UI 状态
  const [viewMode, setViewMode] = useState<"diff" | "preview">("diff")
  const [showRules, setShowRules] = useState(false)
  const [copied, setCopied] = useState(false)
  const [diffType, setDiffType] = useState<"word" | "block">("word")
  
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

  return (
    <section className="w-full py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Markdown Formatter
            </h1>
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
                  className="text-xs"
                >
                  Load Sample
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-[400px] lg:min-h-[500px]">
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
                <div className="flex items-center rounded-lg border border-border bg-background p-1">
                  <button
                    onClick={() => setViewMode("diff")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      viewMode === "diff"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <GitCompare className="h-3.5 w-3.5 inline-block mr-1.5" />
                    Diff
                  </button>
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      viewMode === "preview"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5 inline-block mr-1.5" />
                    Preview
                  </button>
                </div>
                
                {viewMode === "diff" && result?.hasChanges && (
                  <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
                    <button
                      onClick={() => setDiffType("word")}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        diffType === "word"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Word
                    </button>
                    <button
                      onClick={() => setDiffType("block")}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        diffType === "block"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Block
                    </button>
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-xs"
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
            
            <div className="flex-1 min-h-[400px] lg:min-h-[500px] overflow-auto">
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

        {/* Action Bar */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={runFormat}
                disabled={!content || isFormatting}
                className="bg-primary hover:bg-primary/90"
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
              
              <button
                onClick={() => setShowRules(!showRules)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
                {showRules ? "Hide rules" : "Show rules"}
                {showRules ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Rules Panel */}
          {showRules && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Applied Rules</h3>
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
                        <span className="text-xs font-medium text-foreground">{ruleId}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {allRules.filter(r => r.enabled).map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{rule.id}</span>
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
