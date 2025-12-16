"use client"

import type { CSSProperties } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Decoration, Diff, Hunk, markEdits, tokenize } from "react-diff-view"
import "react-diff-view/style/index.css"
import { GitCompare, Loader2, ArrowDown, ArrowUp, Copy, Share, FileDown, FileText, Upload, CheckCircle2, History, Trash2, HelpCircle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import CodeEditor from "@/components/code-editor"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDiffWorker } from "@/hooks/use-diff-worker"
import type {
  DiffWorkerOptions,
  DiffWorkerResponse,
  LineChangeRange,
} from "@/lib/workers/line-diff-worker"
import { buildAlignedText } from "@/lib/markdown-blocks"
import {
  getDiffHistory,
  saveDiffHistory,
  deleteDiffHistoryItem,
  clearDiffHistory,
  formatHistoryTime,
  getTextPreview,
  type DiffHistoryItem,
} from "@/lib/diff-history"

const getRangeSize = (start: number | null, end: number | null) => {
  if (!start || !end) return 0
  return end - start + 1
}

const countLines = (value: string) => {
  if (!value) return 0
  return value.split(/\r\n|\r|\n/).length
}

const summarizeRanges = (ranges: LineChangeRange[]) =>
  ranges.reduce(
    (acc, range) => {
      const oldCount = getRangeSize(range.oldStart, range.oldEnd)
      const newCount = getRangeSize(range.newStart, range.newEnd)

      if (range.type === "added") acc.added += newCount
      if (range.type === "removed") acc.removed += oldCount
      if (range.type === "modified") acc.modified += Math.max(oldCount, newCount)

      return acc
    },
    { added: 0, removed: 0, modified: 0 },
  )

export function MarkdownDiff() {
  const t = useTranslations()
  const locale = useLocale()
  const { theme } = useTheme()
  const { runDiff } = useDiffWorker()

  const [source, setSource] = useState("")
  const [target, setTarget] = useState("")
  const [result, setResult] = useState<DiffWorkerResponse | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<{ source?: string; target?: string }>({})
  const [isUploading, setIsUploading] = useState<{ source?: boolean; target?: boolean }>({})
  const sourceFileInputRef = useRef<HTMLInputElement>(null)
  const targetFileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<"split" | "inline" | "unified">("split")
  const [changeFilter, setChangeFilter] = useState<"all" | "added" | "removed" | "modified">(
    "all",
  )
  const [collapseUnchanged, setCollapseUnchanged] = useState(true)
  const [contextLines, setContextLines] = useState(2)
  const [diffType, setDiffType] = useState<"word" | "block">("block")
  const [options, setOptions] = useState<DiffWorkerOptions>({
    ignoreWhitespace: true,
    ignoreBlankLines: true,
    ignoreLineEndings: false,
    trimTrailingSpaces: true,
    caseInsensitive: false,
  })
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [historyItems, setHistoryItems] = useState<DiffHistoryItem[]>([])
  const [hasRunDiff, setHasRunDiff] = useState(false)

  const summary = useMemo(() => (result ? summarizeRanges(result.ranges) : null), [result])
  const hasDiff = Boolean(result && result.ranges.length > 0)
  const activeFile = result?.files?.[0]
  const hunks = activeFile?.hunks ?? []
  const filteredHunks = useMemo(() => {
    if (!hunks.length) return []

    return hunks
      .map((hunk) => {
        const hasInsert = hunk.changes.some((change) => change.type === "insert")
        const hasDelete = hunk.changes.some((change) => change.type === "delete")

        if (changeFilter === "modified" && !(hasInsert && hasDelete)) return null

        const filteredChanges =
          changeFilter === "all"
            ? hunk.changes
            : hunk.changes.filter((change) => {
                if (changeFilter === "added") return change.type === "insert"
                if (changeFilter === "removed") return change.type === "delete"
                return change.type === "insert" || change.type === "delete"
              })

        if (!filteredChanges.length) return null

        return {
          ...hunk,
          changes: filteredChanges,
        }
      })
      .filter(Boolean) as typeof hunks
  }, [changeFilter, hunks])

  const tokens = useMemo(
    () =>
      filteredHunks.length
        ? tokenize(filteredHunks, {
            enhancers: [markEdits(filteredHunks, { type: diffType })],
          })
        : null,
    [filteredHunks, diffType],
  )
  const [currentHunk, setCurrentHunk] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const optionList = useMemo(
    () =>
      [
        {
          key: "ignoreWhitespace" as const,
          title: t("markdown_diff_option_ignore_whitespace"),
          description: t("markdown_diff_option_ignore_whitespace_hint"),
          tier: "recommended",
        },
        {
          key: "ignoreBlankLines" as const,
          title: t("markdown_diff_option_ignore_blank_lines"),
          description: t("markdown_diff_option_ignore_blank_lines_hint"),
          tier: "recommended",
        },
        {
          key: "trimTrailingSpaces" as const,
          title: t("markdown_diff_option_trim_trailing_spaces"),
          description: t("markdown_diff_option_trim_trailing_spaces_hint"),
          tier: "recommended",
        },
        {
          key: "ignoreLineEndings" as const,
          title: t("markdown_diff_option_ignore_line_endings"),
          description: t("markdown_diff_option_ignore_line_endings_hint"),
          tier: "advanced",
        },
        {
          key: "caseInsensitive" as const,
          title: t("markdown_diff_option_case_insensitive"),
          description: t("markdown_diff_option_case_insensitive_hint"),
          tier: "advanced",
        },
      ],
    [t],
  )

  const diffThemeStyles = useMemo<CSSProperties>(() => {
    const lightInsert = "#e6f7ea" // additions (green, right)
    const lightDelete = "#fdecef" // deletions (red, left)
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

  const computeContext = (mode: "split" | "inline" | "unified", collapse: boolean, ctx: number) => {
    const baseContext = collapse ? ctx : 8
    return mode === "unified" ? Math.max(baseContext, 3) : baseContext
  }

  const handleCompare = async (mode = viewMode, collapse = collapseUnchanged, ctx = contextLines) => {
    setIsComparing(true)
    setError(null)

    try {
      const { normalizedOldText, normalizedNewText } = buildAlignedText(source, target, options)
      const diffResult = await runDiff({
        oldText: source,
        newText: target,
        alignedOldText: normalizedOldText,
        alignedNewText: normalizedNewText,
        options: { ...options, contextLines: computeContext(mode, collapse, ctx) },
      })
      setResult(diffResult)
      setHasRunDiff(true)
      setCurrentHunk(0)

      // 保存历史记录（仅在比对成功且有差异时保存）
      if (diffResult && diffResult.ranges.length > 0) {
        const summary = summarizeRanges(diffResult.ranges)
        saveDiffHistory({
          source,
          target,
          options,
          viewMode: mode,
          collapseUnchanged: collapse,
          contextLines: ctx,
          diffType,
          summary,
        })
        // 刷新历史记录列表
        setHistoryItems(getDiffHistory())
      }
    } catch (err) {
      console.error(err)
      setError(t("markdown_diff_error"))
    } finally {
      setIsComparing(false)
    }
  }

  const handleViewChange = (mode: "split" | "inline" | "unified") => {
    if (mode === viewMode || isComparing) return
    setViewMode(mode)

    if (result) {
      handleCompare(mode)
    }
  }

  const toggleOption = (key: keyof DiffWorkerOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const scrollToHunk = (index: number) => {
    const targetId = `hunk-${index}`
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      setCurrentHunk(index)
    }
  }

  const handlePrev = () => {
    if (!filteredHunks.length) return
    const nextIndex = (currentHunk - 1 + filteredHunks.length) % filteredHunks.length
    scrollToHunk(nextIndex)
  }

  const handleNext = () => {
    if (!filteredHunks.length) return
    const nextIndex = (currentHunk + 1) % filteredHunks.length
    scrollToHunk(nextIndex)
  }

  const diffViewType = viewMode === "split" ? "split" : "unified"
  const visibleSummary = useMemo(() => {
    if (!summary) return null
    if (changeFilter === "all") return summary
    if (changeFilter === "added") return { added: summary.added, removed: 0, modified: 0 }
    if (changeFilter === "removed") return { added: 0, removed: summary.removed, modified: 0 }
    return { added: 0, removed: 0, modified: summary.modified }
  }, [changeFilter, summary])

  const getHunkChanges = (hunk: (typeof filteredHunks)[number]) =>
    hunk.changes.reduce(
      (acc, change) => {
        if (change.type === "insert") acc.added += 1
        if (change.type === "delete") acc.removed += 1
        return acc
      },
      { added: 0, removed: 0 },
    )

  const handleChangeFilter = (type: typeof changeFilter) => {
    setChangeFilter(type)
    setCurrentHunk(0)
  }

  const handleContextChange = (value: number) => {
    setContextLines(value)
    if (result && collapseUnchanged) {
      handleCompare(viewMode, true, value)
    }
  }

  const toggleCollapse = () => {
    const next = !collapseUnchanged
    setCollapseUnchanged(next)
    if (result) {
      handleCompare(viewMode, next, contextLines)
    }
  }

  const totalFiles = result?.files.length ?? 0
  const totalBlocks = hunks.length
  const visibleBlocks = filteredHunks.length
  const hasVisibleDiff = Boolean(result && filteredHunks.length > 0)

  // 加载历史记录
  useEffect(() => {
    if (typeof window === "undefined") return
    setHistoryItems(getDiffHistory())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const hash = window.location.hash
    const prefix = "#diff="
    if (!hash.startsWith(prefix)) return
    const encoded = hash.slice(prefix.length)
    try {
      const padded = encoded.padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), "=")
      const base = padded.replace(/-/g, "+").replace(/_/g, "/")
      const json = decodeURIComponent(
        Array.from(atob(base))
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      )
      const payload = JSON.parse(json) as {
        s?: string
        t?: string
        o?: DiffWorkerOptions
        v?: typeof viewMode
        c?: boolean
        ctx?: number
        dt?: typeof diffType
      }
      setSource(payload.s ?? "")
      setTarget(payload.t ?? "")
      if (payload.o) setOptions((prev) => ({ ...prev, ...payload.o }))
      if (payload.v) setViewMode(payload.v)
      if (typeof payload.c === "boolean") setCollapseUnchanged(payload.c)
      if (typeof payload.ctx === "number") setContextLines(payload.ctx)
      if (payload.dt) setDiffType(payload.dt)
    } catch (err) {
      console.error("Failed to parse diff hash", err)
    }
  }, [])

  const encodeForHash = (payload: object) => {
    const json = JSON.stringify(payload)
    const base64 = btoa(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(Number.parseInt(p1, 16)),
      ),
    )
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
  }

  const handleShareLink = async () => {
    if (typeof window === "undefined") return
    const hash = encodeForHash({
      s: source,
      t: target,
      o: options,
      v: viewMode,
      c: collapseUnchanged,
      ctx: contextLines,
      dt: diffType,
    })
    const url = `${window.location.origin}${window.location.pathname}#diff=${hash}`
    try {
      await navigator.clipboard.writeText(url)
    } catch (err) {
      console.error("Share link copy failed", err)
    }
  }

  const copyPatch = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.diffText)
    } catch (err) {
      console.error("Copy patch failed", err)
    }
  }

  const exportFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPatch = (extension: "diff" | "patch") => {
    if (!result) return
    exportFile(result.diffText, `diff-result.${extension}`)
  }

  const exportMarkdown = () => {
    if (!result) return
    const md = ["```diff", result.diffText, "```"].join("\n")
    exportFile(md, "diff-result.md")
  }

  // 支持的文件类型
  const ALLOWED_FILE_TYPES = [
    ".md",
    ".markdown",
    ".txt",
    ".json",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".css",
    ".scss",
    ".html",
    ".htm",
    ".xml",
    ".yaml",
    ".yml",
  ]
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const validateFile = (file: File): string | null => {
    // 检查文件类型
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
    const isValidType =
      ALLOWED_FILE_TYPES.includes(fileExtension) ||
      file.type.startsWith("text/") ||
      file.type === "application/json"

    if (!isValidType) {
      return t("markdown_diff_upload_error_invalid_type")
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return t("markdown_diff_upload_error_too_large")
    }

    // 检查文件是否为空
    if (file.size === 0) {
      return t("markdown_diff_upload_error_empty")
    }

    return null
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (content === undefined || content === null) {
          reject(new Error(t("markdown_diff_upload_error_read_failed")))
        } else {
          resolve(content)
        }
      }
      reader.onerror = () => {
        reject(new Error(t("markdown_diff_upload_error_read_failed")))
      }
      reader.readAsText(file, "UTF-8")
    })
  }

  const handleFileUpload = async (
    file: File | null,
    type: "source" | "target",
  ): Promise<void> => {
    if (!file) return

    // 清除之前的错误
    setUploadError((prev) => ({ ...prev, [type]: undefined }))
    setIsUploading((prev) => ({ ...prev, [type]: true }))

    try {
      // 验证文件
      const validationError = validateFile(file)
      if (validationError) {
        setUploadError((prev) => ({ ...prev, [type]: validationError }))
        return
      }

      // 读取文件内容
      const content = await readFileContent(file)

      // 设置内容到对应的编辑器
      if (type === "source") {
        setSource(content)
      } else {
        setTarget(content)
      }

      // 清除错误状态
      setUploadError((prev) => ({ ...prev, [type]: undefined }))
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("markdown_diff_upload_error_read_failed")
      setUploadError((prev) => ({ ...prev, [type]: errorMessage }))
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }))
    }
  }

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "source" | "target",
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, type)
    }
    // 重置 input，允许重复选择同一文件
    e.target.value = ""
  }

  // 恢复历史记录
  const restoreHistory = (item: DiffHistoryItem) => {
    setSource(item.source)
    setTarget(item.target)
    setOptions(item.options)
    setViewMode(item.viewMode)
    setCollapseUnchanged(item.collapseUnchanged)
    setContextLines(item.contextLines)
    setDiffType(item.diffType)
    // 延迟触发比对，确保状态已更新
    setTimeout(() => {
      handleCompare(item.viewMode, item.collapseUnchanged, item.contextLines)
    }, 100)
  }

  // 删除历史记录
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (deleteDiffHistoryItem(id)) {
      setHistoryItems(getDiffHistory())
    }
  }

  // 清空历史记录
  const handleClearHistory = () => {
    if (clearDiffHistory()) {
      setHistoryItems([])
    }
  }

  return (
    <section
      className="w-screen py-14 px-4 bg-gradient-to-b from-background via-background to-muted/30 border-b border-border"
      style={{ marginInline: 'calc(50% - 50vw)' }}
    >
      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary/80 uppercase tracking-wide">
              {t("markdown_diff_label")}
            </p>
            <h2 className="text-3xl font-bold text-foreground">{t("markdown_diff_title")}</h2>
            <p className="text-muted-foreground max-w-3xl text-sm md:text-base leading-relaxed">
              {t("markdown_diff_description")}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/70 shadow-sm p-4 space-y-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">
              {t("markdown_diff_options_title")}
            </p>
            <p className="text-xs text-muted-foreground max-w-2xl">
              {t("markdown_diff_options_hint")}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                {t("markdown_diff_options_recommended")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {optionList
                  .filter((option) => option.tier === "recommended")
                  .map((option) => (
                    <label
                      key={option.key}
                      className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/30 px-3 py-3 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(options[option.key])}
                        onChange={() => toggleOption(option.key)}
                        className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                      />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{option.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="uppercase tracking-wide">{t("markdown_diff_options_advanced")}</span>
                {showAdvancedOptions ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showAdvancedOptions
                    ? t("markdown_diff_options_advanced_hide")
                    : t("markdown_diff_options_advanced_show")}
                </span>
              </button>
              {showAdvancedOptions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {optionList
                    .filter((option) => option.tier === "advanced")
                    .map((option) => (
                      <label
                        key={option.key}
                        className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-3 hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(options[option.key])}
                          onChange={() => toggleOption(option.key)}
                          className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                        />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{option.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                      </label>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card/70 shadow-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {t("markdown_diff_source")}
                </p>
                <p className="text-[11px] text-muted-foreground">{t("markdown_diff_source_hint")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {t("markdown_diff_line_count", { count: countLines(source) })}
                </span>
                <input
                  ref={sourceFileInputRef}
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(",")}
                  onChange={(e) => handleFileInputChange(e, "source")}
                  className="hidden"
                  disabled={isUploading.source}
                />
                <Button
                  variant="link"
                  size="sm"
                  className="cursor-pointer text-[var(--brand-blue)] p-0 hover:text-[#0064c2]"
                  onClick={() => sourceFileInputRef.current?.click()}
                  disabled={isUploading.source}
                >
                  {isUploading.source ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 cursor-pointer" />
                    </>
                  )}
                </Button>
              </div>
            </div>
            {uploadError.source && (
              <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20">
                <p className="text-xs text-destructive">{uploadError.source}</p>
              </div>
            )}
            <div className="h-[280px]">
              <CodeEditor value={source} onChange={setSource} theme={theme} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/70 shadow-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {t("markdown_diff_target")}
                </p>
                <p className="text-[11px] text-muted-foreground">{t("markdown_diff_target_hint")}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex items-center z-30">
                  <div className="group flex items-center justify-center text-muted-foreground">
                    <HelpCircle
                      className="h-4 w-4 cursor-help"
                      aria-label={t("markdown_diff_target_tip")}
                    />
                    <div className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {t("markdown_diff_target_tip")}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {t("markdown_diff_line_count", { count: countLines(target) })}
                </span>
                <input
                  ref={targetFileInputRef}
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(",")}
                  onChange={(e) => handleFileInputChange(e, "target")}
                  className="hidden"
                  disabled={isUploading.target}
                />
                <Button
                  variant="link"
                  size="sm"
                  className="cursor-pointer text-[var(--brand-blue)] p-0 hover:text-[#0064c2]"
                  onClick={() => targetFileInputRef.current?.click()}
                  disabled={isUploading.target}
                >
                  {isUploading.target ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 cursor-pointer" />
                    </>
                  )}
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className="cursor-pointer text-[var(--brand-blue)] p-0 hover:text-[#0064c2]"
                  onClick={() => handleCompare()}
                  disabled={isComparing || (!source && !target)}
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("markdown_diff_running")}
                    </>
                  ) : (
                    <>
                      <GitCompare className="h-4 w-4 cursor-pointer" />
                      {t("markdown_diff_action")}
                    </>
                  )}
                </Button>
              </div>
            </div>
            {uploadError.target && (
              <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20">
                <p className="text-xs text-destructive">{uploadError.target}</p>
              </div>
            )}
            <div className="h-[280px]">
              <CodeEditor value={target} onChange={setTarget} theme={theme} />
            </div>
          </div>
        </div>

        {hasVisibleDiff && (
          <div className="rounded-xl border border-border bg-card/70 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("markdown_diff_outline_title")}
                </p>
                <p className="text-xs text-muted-foreground">{t("markdown_diff_outline_hint")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredHunks.map((hunk, index) => {
                const changes = getHunkChanges(hunk)
                return (
                  <button
                    key={index}
                    onClick={() => scrollToHunk(index)}
                    className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-sm hover:border-[var(--brand-blue)] hover:shadow-sm transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {t("markdown_diff_outline_item", { index: index + 1 })}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {t("markdown_diff_added", { count: changes.added })} ·{" "}
                        {t("markdown_diff_removed", { count: changes.removed })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {hunk.content.replace(/^@@\s*/, "")}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card/80 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("markdown_diff_result")}</p>
              <p className="text-xs text-muted-foreground">
                {hasRunDiff ? t("markdown_diff_result_hint_active") : t("markdown_diff_result_hint")}
              </p>
            </div>
            {hasVisibleDiff && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-md border border-border bg-muted/40">
                  {t("markdown_diff_count_files", { count: totalFiles })}
                </span>
                <span className="px-2 py-1 rounded-md border border-border bg-muted/40">
                  {t("markdown_diff_count_blocks", { count: visibleBlocks })}
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {/* View: 基础视图模式，优先展示 */}
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                  {t("markdown_diff_view_label")}
                </span>
                <div className="flex items-center gap-1">
                  {([
                    { key: "split", label: t("markdown_diff_view_side_by_side") },
                    { key: "inline", label: t("markdown_diff_view_inline") },
                    { key: "unified", label: t("markdown_diff_view_unified") },
                  ] satisfies { key: typeof viewMode; label: string }[]).map((item) => (
                    <Button
                      key={item.key}
                      size="sm"
                      variant={viewMode === item.key ? "default" : "outline"}
                      className={
                        viewMode === item.key
                          ? "!bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
                          : "border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                      }
                      onClick={() => handleViewChange(item.key)}
                      disabled={isComparing}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Highlight: Block / Word 强调为第二优先 */}
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                  {t("markdown_diff_highlight_label")}
                </span>
                <div className="flex items-center gap-1">
                  {([
                    { key: "block", label: t("markdown_diff_highlight_block") },
                    { key: "word", label: t("markdown_diff_highlight_word") },
                  ] satisfies { key: typeof diffType; label: string }[]).map((item) => (
                    <Button
                      key={item.key}
                      size="sm"
                      variant={diffType === item.key ? "default" : "outline"}
                      className={
                        diffType === item.key
                          ? "!bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
                          : "border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                      }
                      onClick={() => setDiffType(item.key as "word" | "block")}
                      disabled={isComparing}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Filter: 信息密度较高，弱化为次要控制 */}
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2 py-1">
                <span className="text-[11px] font-medium uppercase text-muted-foreground">
                  {t("markdown_diff_filter_label")}
                </span>
                <div className="flex items-center gap-1">
                  {([
                    { key: "all", label: t("markdown_diff_filter_all") },
                    { key: "added", label: t("markdown_diff_filter_added") },
                    { key: "removed", label: t("markdown_diff_filter_removed") },
                    { key: "modified", label: t("markdown_diff_filter_modified") },
                  ] satisfies { key: typeof changeFilter; label: string }[]).map((item) => (
                    <Button
                      key={item.key}
                      size="sm"
                      variant={changeFilter === item.key ? "outline" : "ghost"}
                      className={
                        changeFilter === item.key
                          ? "border-[var(--brand-blue)] text-[var(--brand-blue)] bg-[rgba(0,117,222,0.06)] hover:bg-[rgba(0,117,222,0.1)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }
                      onClick={() => handleChangeFilter(item.key)}
                      disabled={isComparing}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              {hasVisibleDiff && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                    onClick={copyPatch}
                  >
                    <Copy className="h-4 w-4" />
                    {t("markdown_diff_copy_patch")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                    onClick={() => exportPatch("diff")}
                  >
                    <FileDown className="h-4 w-4" />
                    {t("markdown_diff_export_diff")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                    onClick={() => exportPatch("patch")}
                  >
                    <FileDown className="h-4 w-4" />
                    {t("markdown_diff_export_patch")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                    onClick={exportMarkdown}
                  >
                    <FileText className="h-4 w-4" />
                    {t("markdown_diff_export_markdown")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                    onClick={handleShareLink}
                  >
                    <Share className="h-4 w-4" />
                    {t("markdown_diff_share_link")}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                      >
                        <History className="h-4 w-4" />
                        {t("markdown_diff_history")}
                        {historyItems.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]">
                            {historyItems.length}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                      <DropdownMenuLabel>{t("markdown_diff_history_title")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {historyItems.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          {t("markdown_diff_history_empty")}
                        </div>
                      ) : (
                        <>
                          {historyItems.map((item) => (
                            <DropdownMenuItem
                              key={item.id}
                              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                              onClick={() => restoreHistory(item)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs text-muted-foreground">
                                  {formatHistoryTime(item.timestamp, locale)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={(e) => handleDeleteHistory(item.id, e)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-xs text-foreground line-clamp-2 w-full">
                                <span className="font-semibold">{t("markdown_diff_source")}:</span>{" "}
                                {getTextPreview(item.source, 30)}
                              </div>
                              <div className="text-xs text-foreground line-clamp-2 w-full">
                                <span className="font-semibold">{t("markdown_diff_target")}:</span>{" "}
                                {getTextPreview(item.target, 30)}
                              </div>
                              {item.summary && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-200">
                                    +{item.summary.added}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-200">
                                    -{item.summary.removed}
                                  </span>
                                  {item.summary.modified > 0 && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-200">
                                      ~{item.summary.modified}
                                    </span>
                                  )}
                                </div>
                              )}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={handleClearHistory}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("markdown_diff_history_clear")}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {summary && hasDiff && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-200 text-xs font-semibold border border-green-500/30">
                      {t("markdown_diff_added", { count: visibleSummary?.added ?? 0 })}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-700 dark:text-red-200 text-xs font-semibold border border-red-500/30">
                      {t("markdown_diff_removed", { count: visibleSummary?.removed ?? 0 })}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs font-semibold border border-amber-500/30">
                      {t("markdown_diff_modified", { count: visibleSummary?.modified ?? 0 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <label className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1">
                      <input
                        type="checkbox"
                        checked={collapseUnchanged}
                        onChange={toggleCollapse}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                      />
                      <span className="font-semibold uppercase">{t("markdown_diff_collapse")}</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1">
                      <span className="font-semibold uppercase">{t("markdown_diff_context_label")}</span>
                      <select
                        className="bg-transparent text-foreground text-xs border border-border rounded-md px-2 py-1"
                        value={contextLines}
                        onChange={(event) => handleContextChange(Number(event.target.value))}
                        disabled={isComparing}
                      >
                        {[0, 2, 4, 8].map((value) => (
                          <option key={value} value={value}>
                            {t("markdown_diff_context_option", { count: value })}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrev}
                      disabled={!filteredHunks.length}
                      className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                    >
                      <ArrowUp className="h-4 w-4 mr-1" />
                      {t("markdown_diff_prev")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={!filteredHunks.length}
                      className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                    >
                      <ArrowDown className="h-4 w-4 mr-1" />
                      {t("markdown_diff_next")}
                    </Button>
                    {filteredHunks.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {currentHunk + 1} / {filteredHunks.length}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="px-4 py-6 text-sm text-destructive">{error}</div>
          ) : !result ? (
            <div className="px-4 py-10 text-center text-muted-foreground text-sm">
              {t("markdown_diff_idle")}
            </div>
          ) : hasVisibleDiff ? (
            <div className="overflow-auto" style={diffThemeStyles} ref={containerRef}>
              <Diff
                viewType={diffViewType}
                diffType={activeFile?.type ?? "modify"}
                hunks={filteredHunks}
                className="text-sm"
                tokens={tokens ?? undefined}
              >
                {(hunksToRender) =>
                  hunksToRender.flatMap((hunk, index) => [
                    <Decoration key={`decoration-${index}`}>
                      <div id={`hunk-${index}`} className="diff-hunk-anchor" />
                    </Decoration>,
                    <Hunk
                      key={`${hunk.content}-${hunk.oldStart}-${hunk.newStart}-${index}`}
                      hunk={hunk}
                    />,
                  ])
                }
              </Diff>
            </div>
          ) : (
            <div className="px-4 py-10 text-center">
              <div className="inline-flex flex-col items-center gap-3 rounded-xl border border-green-200/50 bg-green-50/60 dark:border-green-500/20 dark:bg-green-500/8 px-8 py-10 max-w-md mx-auto shadow-sm">
                <CheckCircle2 className="h-14 w-14 text-green-500/90 dark:text-green-400/80" />
                <div className="space-y-1">
                  <p className="text-base font-semibold text-green-700 dark:text-green-300">
                    {t("markdown_diff_no_changes")}
                  </p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70">
                    {t("markdown_diff_no_changes_hint")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
