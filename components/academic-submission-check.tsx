"use client"

import type { CSSProperties } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { Diff, Decoration, Hunk, markEdits, tokenize } from "react-diff-view"
import "react-diff-view/style/index.css"
import { parse as parseDiff } from "gitdiff-parser"
import {
  Wand2,
  Check,
  Copy,
  Eye,
  GitCompare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Settings2,
  AlertTriangle,
  Upload,
  FileCheck,
} from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useFormatter, type FormatterMode } from "@/hooks/use-formatter"
import {
  formatEngine,
  academicRules,
  presets,
  presetMeta,
  initializeRules,
  type FormatRuleId,
  type LintResult,
  type LintSeverity,
  type PresetName,
} from "@/lib/formatter"

// 动态导入编辑器组件
const CodeMirrorEditor = dynamic(() => import("@/components/code-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  ),
})

// ============================================================================
// 示例内容
// ============================================================================

const SAMPLE_ACADEMIC_MARKDOWN = `# 1. Introduction

This is a sample academic paper with some formatting issues.

## 1.1 Background
The research focuses on improving document formatting.

## 1.2 Related Work

Previous studies have shown [1] that formatting matters.

## 2. Methodology

We conducted experiments to validate our approach.

Figure 1: Sample figure caption

Table 1: Sample table caption

## References

[1] Author, A. (2024). Title of the paper. Journal Name, 1(1), 1-10.`

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

// 学术预设顺序（只显示学术预设）
const ACADEMIC_PRESET_ORDER: PresetName[] = ['ieee', 'acm', 'apa']

const LINT_SEVERITY_META: Record<LintSeverity, { label: string; tone: string }> = {
  error: { label: 'Error', tone: 'text-red-600 dark:text-red-300 border-red-500/30 bg-red-500/5' },
  warning: { label: 'Warning', tone: 'text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/5' },
  info: { label: 'Info', tone: 'text-blue-700 dark:text-blue-300 border-blue-500/30 bg-blue-500/5' },
}

export function AcademicSubmissionCheck() {
  const t = useTranslations()
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
    mode,
    setMode,
    ruleStates,
    toggleRule,
    currentPreset,
    applyPreset,
  } = useFormatter({ initialContent: "" })

  // 过滤出只属于学术分类的规则
  const academicRuleIds = useMemo(() => new Set(academicRules.map(r => r.id)), [])
  const academicRuleStates = useMemo(() => {
    return ruleStates.filter(r => academicRuleIds.has(r.id))
  }, [ruleStates, academicRuleIds])

  // 只使用启用的学术规则进行格式化
  const enabledAcademicRuleIds = useMemo(() =>
    academicRuleStates.filter(r => r.enabled).map(r => r.id),
    [academicRuleStates]
  )

  // 自定义格式化函数，只使用学术规则
  const runAcademicFormat = useCallback(() => {
    return runFormatWithRules(enabledAcademicRuleIds)
  }, [runFormatWithRules, enabledAcademicRuleIds])

  // 启用所有学术规则
  const enableAllAcademicRules = useCallback(() => {
    academicRuleStates.forEach(rule => {
      if (!rule.enabled) {
        toggleRule(rule.id)
      }
    })
    // toggleRule 内部会清除预设，所以这里不需要手动清除
  }, [academicRuleStates, toggleRule])

  // 禁用所有学术规则
  const disableAllAcademicRules = useCallback(() => {
    academicRuleStates.forEach(rule => {
      if (rule.enabled) {
        toggleRule(rule.id)
      }
    })
    // toggleRule 内部会清除预设，所以这里不需要手动清除
  }, [academicRuleStates, toggleRule])

  // UI 状态
  const [viewMode, setViewMode] = useState<"diff" | "preview">("diff")
  const [showRules, setShowRules] = useState(false)
  const [copied, setCopied] = useState(false)
  const [diffType, setDiffType] = useState<"word" | "block">("word")
  const [showLintResultsPanel, setShowLintResultsPanel] = useState(true)
  const [exporting, setExporting] = useState(false)

  // 文件上传相关状态
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 确保规则已初始化
  useEffect(() => {
    initializeRules()
  }, [])

  // 默认应用 IEEE 预设（只在组件挂载时执行一次）
  useEffect(() => {
    applyPreset('ieee')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次，applyPreset 是稳定的函数

  // 解析 diff
  const diffData = useMemo(() => {
    if (!result?.hasChanges) return null

    try {
      const diffText = createUnifiedDiff(result.original, result.formatted)
      if (!diffText || diffText.trim().length === 0) {
        console.warn('Generated diff is empty')
        return null
      }
      const files = parseDiff(diffText)
      if (!files || files.length === 0) {
        console.warn('Parsed diff files is empty', { diffText })
        return null
      }
      return { files, diffText }
    } catch (error) {
      console.error('Failed to parse diff:', error, {
        original: result.original?.substring(0, 100),
        formatted: result.formatted?.substring(0, 100)
      })
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
    setContent(SAMPLE_ACADEMIC_MARKDOWN)
  }, [setContent])

  // 文件上传相关函数
  const ALLOWED_FILE_TYPES = [".md", ".markdown", ".txt"]
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const validateFile = useCallback((file: File): string | null => {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
    const isValidType = ALLOWED_FILE_TYPES.includes(fileExtension) || file.type.startsWith("text/")

    if (!isValidType) {
      return t("editor_upload_error_invalid_type")
    }

    if (file.size > MAX_FILE_SIZE) {
      return t("editor_upload_error_too_large", { maxSize: "10MB" })
    }

    if (file.size === 0) {
      return t("editor_upload_error_empty")
    }

    return null
  }, [t])

  const readFileContent = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (content === undefined || content === null) {
          reject(new Error(t("editor_upload_error_read_failed")))
        } else {
          resolve(content)
        }
      }
      reader.onerror = () => {
        reject(new Error(t("editor_upload_error_read_failed")))
      }
      reader.readAsText(file, "UTF-8")
    })
  }, [t])

  const handleFileUpload = useCallback(async (file: File | null) => {
    if (!file) return

    setUploadError(null)
    setIsUploading(true)

    try {
      const validationError = validateFile(file)
      if (validationError) {
        setUploadError(validationError)
        return
      }

      const fileContent = await readFileContent(file)
      setContent(fileContent)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t("editor_upload_error_read_failed"))
    } finally {
      setIsUploading(false)
    }
  }, [validateFile, readFileContent, setContent, t])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      handleFileUpload(file)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [handleFileUpload]
  )

  // Lint 结果统计
  const lintStats = useMemo(() => {
    if (!result?.lintResults) return null

    const bySeverity: Record<LintSeverity, number> = {
      error: 0,
      warning: 0,
      info: 0,
    }

    result.lintResults.forEach((r) => {
      const severity = r.severity ?? 'warning'
      bySeverity[severity] = (bySeverity[severity] ?? 0) + 1
    })

    return {
      total: result.lintResults.length,
      bySeverity,
    }
  }, [result])

  // 按行号分组 lint 结果
  const lintResultsByLine = useMemo(() => {
    if (!result?.lintResults) return new Map<number, LintResult[]>()

    const map = new Map<number, LintResult[]>()
    result.lintResults.forEach((r) => {
      if (r.line) {
        const existing = map.get(r.line) ?? []
        map.set(r.line, [...existing, r])
      }
    })
    return map
  }, [result])

  // 获取规则显示名称
  const getRuleDisplayName = useCallback((ruleId: FormatRuleId): string => {
    const rule = academicRules.find(r => r.id === ruleId)
    if (!rule) return ruleId
    return t(rule.name) || ruleId
  }, [t])

  return (
    <div className="space-y-6">
      {/* 预设选择器 */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">{t('formatter_presets')}</h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ACADEMIC_PRESET_ORDER.map((presetName) => {
            const preset = presets[presetName]
            const meta = presetMeta[presetName]
            const isActive = currentPreset === presetName

            return (
              <Button
                key={presetName}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset(presetName)}
                className={isActive ? "bg-[var(--brand-blue)] hover:bg-[#0064c2]" : ""}
              >
                {meta.label}
                {isActive && <CheckCircle2 className="ml-2 h-4 w-4" />}
              </Button>
            )
          })}
        </div>
        {currentPreset && (
          <p className="mt-2 text-sm text-muted-foreground">
            {presetMeta[currentPreset].description}
          </p>
        )}
      </div>

      {/* 编辑器区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左侧：编辑器 */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{t('formatter_editor')}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(",")}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {t('formatter_upload')}
                </Button>
                <Button variant="ghost" size="sm" onClick={loadSample}>
                  {t('formatter_load_sample')}
                </Button>
              </div>
            </div>
            <div className="h-[600px]">
              <CodeMirrorEditor
                value={content}
                onChange={setContent}
                language="markdown"
                theme={theme}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <Button
              onClick={runAcademicFormat}
              disabled={!content.trim() || isFormatting}
              className="flex-1 bg-[var(--brand-blue)] hover:bg-[#0064c2]"
            >
              {isFormatting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('formatter_formatting')}
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {t('formatter_format')}
                </>
              )}
            </Button>
            {result?.hasChanges && (
              <Button onClick={applyFormat} variant="outline" size="sm">
                <Check className="mr-2 h-4 w-4" />
                {t('formatter_apply')}
              </Button>
            )}
            {canUndo && (
              <Button onClick={undo} variant="outline" size="sm">
                {t('formatter_undo')}
              </Button>
            )}
          </div>
        </div>

        {/* 右侧：结果视图 */}
        <div className="space-y-4">
          {/* 视图切换 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "diff" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("diff")}
              >
                <GitCompare className="mr-2 h-4 w-4" />
                {t('formatter_diff')}
              </Button>
              <Button
                variant={viewMode === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("preview")}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('formatter_preview')}
              </Button>
            </div>
            {result?.hasChanges && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t('formatter_copied')}
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    {t('formatter_copy')}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Diff 视图 */}
          {viewMode === "diff" && (
            <>
              {result?.hasChanges && tokens && hunks.length > 0 ? (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
                    <span className="font-medium text-sm">{t('formatter_changes')}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDiffType(diffType === "word" ? "block" : "word")}
                      >
                        {diffType === "word" ? t('formatter_word_diff') : t('formatter_line_diff')}
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-auto max-h-[600px]" style={diffThemeStyles}>
                    <Diff viewType="unified" diffType={diffType} tokens={tokens}>
                      {(hunks) =>
                        hunks.map((hunk) => (
                          <Hunk key={hunk.content} hunk={hunk}>
                            {(tokens) =>
                              tokens.map((token, i) => (
                                <Decoration key={`${hunk.content}-${i}`} token={token}>
                                  {(children) => <div>{children}</div>}
                                </Decoration>
                              ))
                            }
                          </Hunk>
                        ))
                      }
                    </Diff>
                  </div>
                </div>
              ) : result && !result.hasChanges ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    {result.lintResults && result.lintResults.length > 0 ? (
                      <>
                        <AlertTriangle className="h-12 w-12 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{t('formatter_no_changes')}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('formatter_well_formatted')} {t('formatter_lint_issues_remain', { count: result.lintResults.length })}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{t('formatter_no_changes')}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t('formatter_well_formatted')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : !result ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <GitCompare className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{t('formatter_click_format')}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <FileCheck className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">{t('formatter_no_result')}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 预览视图 */}
          {viewMode === "preview" && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-3 border-b border-border bg-muted/30">
                <span className="font-medium text-sm">{t('formatter_preview')}</span>
              </div>
              <div className="p-4 overflow-auto max-h-[600px]">
                {result?.formatted || content ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-mono text-sm">{result?.formatted || content}</pre>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    {t('formatter_no_content')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lint 结果面板 */}
      {showLintResultsPanel && result?.lintResults && result.lintResults.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold">
                {t('formatter_lint_results')} ({lintStats?.total ?? 0})
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLintResultsPanel(!showLintResultsPanel)}
            >
              {showLintResultsPanel ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          <div className="mb-3 p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">
              {t('formatter_lint_description')}
            </p>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {result.lintResults.map((lint) => {
              const severity = lint.severity ?? 'warning'
              const meta = LINT_SEVERITY_META[severity]
              const ruleName = getRuleDisplayName(lint.ruleId)

              return (
                <div
                  key={lint.id}
                  className={`p-3 rounded border ${meta.tone} cursor-pointer hover:opacity-80`}
                  onClick={() => {
                    // 滚动到对应行（需要编辑器支持）
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{ruleName}</span>
                        <span className="text-xs text-muted-foreground">
                          {t('formatter_line')} {lint.line}
                        </span>
                      </div>
                      <p className="text-sm">{lint.message}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 规则配置面板 */}
      {showRules && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">{t('formatter_rules')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={enableAllAcademicRules}>
                {t('formatter_enable_all')}
              </Button>
              <Button variant="ghost" size="sm" onClick={disableAllAcademicRules}>
                {t('formatter_disable_all')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRules(!showRules)}
              >
                {showRules ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {academicRuleStates.map((ruleState) => {
              const rule = academicRules.find(r => r.id === ruleState.id)
              if (!rule) return null

              return (
                <div
                  key={ruleState.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{t(rule.name)}</div>
                    <div className="text-xs text-muted-foreground">{t(rule.description)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRule(ruleState.id)}
                  >
                    {ruleState.enabled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 规则切换按钮 */}
      {!showRules && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowRules(true)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            {t('formatter_configure_rules')}
          </Button>
        </div>
      )}

      {/* 错误提示 */}
      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600 dark:text-red-400">
          {uploadError}
        </div>
      )}
    </div>
  )
}
