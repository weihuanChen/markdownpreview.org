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
  Shield,
  FileCheck,
  Upload,
  Pin,
  PinOff,
} from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { RelatedTools } from "@/components/related-tools"
import { EditorPinnedBanner } from "@/components/editor-pinned-banner"
import { useFormatter, type FormatterMode } from "@/hooks/use-formatter"
import {
  getLatestFormatterHistory,
  saveFormatterHistory,
} from "@/lib/formatter-history"
import {
  allRules,
  presets,
  presetMeta,
  exportToJSON,
  exportToMarkdown,
  exportToSARIF,
  type FormatRuleId,
  type LintResult,
  type LintSeverity,
  type PresetName,
  type RuleCategory,
} from "@/lib/formatter"

// 动态导入编辑器和预览组件
const CodeMirrorEditor = dynamic(() => import("@/components/code-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  ),
})

const MarkdownPreview = dynamic(
  () => import("@/components/markdown-preview").then((mod) => mod.MarkdownPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading...
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
const RULE_CATEGORIES: { id: RuleCategory; labelKey: string; icon: string }[] = [
  { id: 'whitespace', labelKey: 'formatter_category_whitespace', icon: '⎵' },
  { id: 'heading', labelKey: 'formatter_category_heading', icon: '#' },
  { id: 'list', labelKey: 'formatter_category_list', icon: '•' },
  { id: 'blockquote', labelKey: 'formatter_category_blockquote', icon: '>' },
  { id: 'code', labelKey: 'formatter_category_code', icon: '`' },
  { id: 'writing', labelKey: 'formatter_category_writing', icon: '✍' },
]

// 预设顺序
const PRESET_ORDER: PresetName[] = ['standard', 'github', 'quality', 'writing', 'strict']

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
  writing: 'warning',
}

export function MarkdownFormatter() {
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
  const [showLintResultsPanel, setShowLintResultsPanel] = useState(true)
  const [selectedRuleIds, setSelectedRuleIds] = useState<FormatRuleId[]>([])
  const [exporting, setExporting] = useState(false)
  const [openFaqIndices, setOpenFaqIndices] = useState<Set<number>>(new Set([0, 1, 2, 3]))
  
  // 文件上传相关状态
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Pin editor 相关状态
  const [isPinned, setIsPinned] = useState(false)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  
  // 历史记录相关状态
  const hasRestoredHistory = useRef(false) // 标记是否已恢复历史记录
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // 组件加载时恢复历史记录
  useEffect(() => {
    if (hasRestoredHistory.current) return

    try {
      const latestHistory = getLatestFormatterHistory()
      if (latestHistory && latestHistory.content.trim()) {
        // 恢复内容
        setContent(latestHistory.content)
        // 恢复模式
        if (latestHistory.mode) {
          setMode(latestHistory.mode)
        }
        // 恢复预设和规则状态
        if (latestHistory.currentPreset) {
          applyPreset(latestHistory.currentPreset)
        }
        // 恢复规则状态（需要延迟执行，确保预设已应用）
        if (latestHistory.ruleStates && latestHistory.ruleStates.length > 0) {
          setTimeout(() => {
            // 创建历史记录中规则状态的映射
            const historyRuleMap = new Map(
              latestHistory.ruleStates.map((r) => [r.id, r.enabled])
            )
            // 比较当前规则状态和历史记录，只调整不同的规则
            // 注意：这里需要在下一个 tick 执行，确保 ruleStates 已更新
            setTimeout(() => {
              ruleStates.forEach((currentRule) => {
                const historyEnabled = historyRuleMap.get(currentRule.id)
                if (historyEnabled !== undefined && historyEnabled !== currentRule.enabled) {
                  toggleRule(currentRule.id)
                }
              })
            }, 50)
          }, 100)
        }
      }
      hasRestoredHistory.current = true
    } catch (err) {
      console.error("Failed to restore formatter history:", err)
      hasRestoredHistory.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 自动保存历史记录（防抖，2秒后保存）
  useEffect(() => {
    // 如果还没有恢复历史记录，不保存
    if (!hasRestoredHistory.current) return

    // 如果内容为空，不保存
    if (!content.trim()) return

    // 清除之前的定时器
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // 设置新的定时器，2秒后保存
    saveTimerRef.current = window.setTimeout(() => {
      saveFormatterHistory({
        content,
        mode,
        ruleStates,
        currentPreset,
      })
    }, 2000)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [content, mode, ruleStates, currentPreset])
  
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
  
  // 文件上传相关函数
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

  const validateFile = useCallback((file: File): string | null => {
    // 检查文件类型
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
    const isValidType =
      ALLOWED_FILE_TYPES.includes(fileExtension) ||
      file.type.startsWith("text/") ||
      file.type === "application/json"

    if (!isValidType) {
      return t("editor_upload_error_invalid_type")
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return t("editor_upload_error_too_large", { maxSize: "10MB" })
    }

    // 检查文件是否为空
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
      // 验证文件
      const validationError = validateFile(file)
      if (validationError) {
        setUploadError(validationError)
        return
      }

      // 读取文件内容
      const content = await readFileContent(file)

      // 设置内容到编辑器
      setContent(content)
      setUploadError(null)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("editor_upload_error_read_failed")
      setUploadError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [validateFile, readFileContent, setContent, t])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
      // 重置 input，允许重复选择同一文件
      e.target.value = ""
    },
    [handleFileUpload],
  )
  
  // 图钉固定功能：固定时，阻止页面滚动，但允许 editor 内部滚动
  useEffect(() => {
    if (!isPinned) return

    // 保存当前滚动位置
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    // 保存原始样式
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const originalLeft = document.body.style.left
    const originalWidth = document.body.style.width

    // 阻止页面滚动：使用 overflow hidden 和固定位置
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = `-${scrollX}px`
    document.body.style.width = "100%"

    // 缓存 rect 和滚动状态，使用节流优化性能
    let cachedRect: DOMRect | null = null
    let cachedScrollState: { canScrollUp: boolean; canScrollDown: boolean; canScrollLeft: boolean; canScrollRight: boolean } | null = null
    let lastRectUpdate = 0
    let lastScrollStateUpdate = 0
    const RECT_CACHE_DURATION = 100 // 100ms 内不重复计算 rect
    const SCROLL_STATE_CACHE_DURATION = 16 // 16ms (约 60fps) 内不重复计算滚动状态
    let cmScrollerElement: HTMLElement | null = null

    // 初始化时查找一次滚动容器，避免重复查询
    if (editorContainerRef.current) {
      cmScrollerElement = editorContainerRef.current.querySelector(".cm-scroller") as HTMLElement | null
    }

    // 获取 editor 滚动容器的滚动状态（带缓存）
    const getEditorScrollState = (): {
      canScrollUp: boolean
      canScrollDown: boolean
      canScrollLeft: boolean
      canScrollRight: boolean
    } => {
      const now = Date.now()
      
      // 如果缓存有效，直接返回
      if (cachedScrollState && now - lastScrollStateUpdate < SCROLL_STATE_CACHE_DURATION) {
        return cachedScrollState
      }

      // 如果滚动容器未找到，尝试重新查找（可能 DOM 还未准备好）
      if (!cmScrollerElement && editorContainerRef.current) {
        cmScrollerElement = editorContainerRef.current.querySelector(".cm-scroller") as HTMLElement | null
      }

      if (!cmScrollerElement) {
        return { canScrollUp: false, canScrollDown: false, canScrollLeft: false, canScrollRight: false }
      }

      // 读取滚动属性（这些是同步操作，但很快）
      const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = cmScrollerElement
      const threshold = 1 // 1px 阈值，避免浮点数精度问题

      const state = {
        canScrollUp: scrollTop > threshold,
        canScrollDown: scrollTop < scrollHeight - clientHeight - threshold,
        canScrollLeft: scrollLeft > threshold,
        canScrollRight: scrollLeft < scrollWidth - clientWidth - threshold,
      }

      // 更新缓存
      cachedScrollState = state
      lastScrollStateUpdate = now

      return state
    }

    // 获取缓存的 rect（带节流）
    const getCachedRect = (): DOMRect | null => {
      const now = Date.now()
      if (!cachedRect || now - lastRectUpdate > RECT_CACHE_DURATION) {
        if (editorContainerRef.current) {
          cachedRect = editorContainerRef.current.getBoundingClientRect()
          lastRectUpdate = now
        }
      }
      return cachedRect
    }

    // 检查鼠标是否在编辑器或预览区域内
    const isInEditorOrPreview = (clientX: number, clientY: number): boolean => {
      // 检查左侧编辑器
      const editorRect = getCachedRect()
      if (editorRect) {
        const inEditor =
          clientX >= editorRect.left &&
          clientX <= editorRect.right &&
          clientY >= editorRect.top &&
          clientY <= editorRect.bottom
        if (inEditor) return true
      }

      // 检查右侧 preview/diff 区域
      // 查找主内容区域内的所有卡片容器
      if (mainContentRef.current) {
        const cards = mainContentRef.current.querySelectorAll('.rounded-xl.border.border-border.bg-card.shadow-sm')
        for (const card of Array.from(cards)) {
          const cardRect = (card as HTMLElement).getBoundingClientRect()
          const inCard =
            clientX >= cardRect.left &&
            clientX <= cardRect.right &&
            clientY >= cardRect.top &&
            clientY <= cardRect.bottom
          if (inCard) return true
        }
      }

      return false
    }

    // 处理滚轮事件：只在 editor/preview 外部时阻止，内部允许正常滚动
    // 优化：在 editor/preview 内不阻止事件，让它们正常处理，保持流畅性
    const handleWheel = (e: WheelEvent) => {
      if (!editorContainerRef.current && !mainContentRef.current) {
        // 如果容器都不存在，阻止所有滚动
        e.preventDefault()
        return
      }

      const inEditorOrPreview = isInEditorOrPreview(e.clientX, e.clientY)

      if (inEditorOrPreview) {
        // 在 editor 或 preview 内，让它们正常处理滚动事件
        // 由于 body 是 fixed，页面本身不会滚动，所以不需要阻止事件
        // 这样可以保持滚动流畅性，避免帧率下降
        // 不阻止事件，让它们正常处理
        return
      } else {
        // 不在 editor/preview 内，阻止页面滚动
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // 处理触摸滚动事件（触控板手势）
    const handleTouchMove = (e: TouchEvent) => {
      if (!editorContainerRef.current && !mainContentRef.current) {
        e.preventDefault()
        return
      }

      const touch = e.touches[0]
      if (!touch) return

      const inEditorOrPreview = isInEditorOrPreview(touch.clientX, touch.clientY)

      if (!inEditorOrPreview) {
        // 不在 editor/preview 内，阻止页面滚动
        e.preventDefault()
      }
      // 在 editor/preview 内，允许正常滚动
    }

    // 监听 resize 事件，清除缓存
    const handleResize = () => {
      cachedRect = null
      cachedScrollState = null
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("resize", handleResize)

    return () => {
      // 恢复页面滚动样式
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.left = originalLeft
      document.body.style.width = originalWidth

      // 恢复滚动位置
      window.scrollTo(scrollX, scrollY)

      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("resize", handleResize)
    }
  }, [isPinned])
  
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
      writing: [],
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

  const autoFixMessage = t("formatter_auto_fix_message")
  const lintResults = useMemo<LintResult[]>(() => {
    if (result?.lintResults?.length) {
      return result.lintResults.map((item) => ({
        ...item,
        message: item.messageKey ? t(item.messageKey) : item.message,
      }))
    }

    if (!result?.appliedRules?.length) return []

    return result.appliedRules.map((ruleId, index) => {
      const rule = allRules.find((r) => r.id === ruleId)
      const severity = rule ? RULE_SEVERITY_BY_CATEGORY[rule.category] : 'warning'
      return {
        id: `${ruleId}-${index}`,
        ruleId,
        severity,
        message: autoFixMessage,
      }
    })
  }, [result, autoFixMessage, t])

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

  const handleExport = useCallback(async (format: 'json' | 'markdown' | 'sarif') => {
    if (!result) return
    setExporting(true)
    try {
      let content: string
      let filename: string
      let mimeType: string

      if (format === 'json') {
        content = exportToJSON(result, false)
        filename = 'markdown-formatter-report.json'
        mimeType = 'application/json'
      } else if (format === 'markdown') {
        content = exportToMarkdown(result)
        filename = 'markdown-formatter-report.md'
        mimeType = 'text/markdown'
      } else {
        // SARIF
        content = exportToSARIF(result)
        filename = 'markdown-formatter-report.sarif'
        mimeType = 'application/json'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }, [result])

  return (
    <section className="w-full py-8 px-4 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {t("formatter_title")}
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
                  {t("formatter_mode_simple")}
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
                  {t("formatter_mode_advanced")}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {t("formatter_description")}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs px-2.5 py-1 rounded-md bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20 font-medium">
              {t("formatter_safe_only")}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-medium">
              {t("formatter_tag_diff_preview")}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-medium">
              {t("formatter_tag_undo_support")}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium">
              {t("formatter_tag_lint_quality")}
            </span>
          </div>
        </div>

        {/* Core Value Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Safe Formatting */}
          <div className="rounded-lg border border-border bg-card p-4 flex flex-row md:flex-row lg:flex-col gap-3 h-full">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-tight">
                {t("formatter_value_safe_title")}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3">
                {t("formatter_value_safe_desc")}
              </p>
            </div>
          </div>

          {/* Card 2: Diff Preview */}
          <div className="rounded-lg border border-border bg-card p-4 flex flex-row md:flex-row lg:flex-col gap-3 h-full">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <GitCompare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-tight">
                {t("formatter_value_diff_title")}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3">
                {t("formatter_value_diff_desc")}
              </p>
            </div>
          </div>

          {/* Card 3: Undo & Control */}
          <div className="rounded-lg border border-border bg-card p-4 flex flex-row md:flex-row lg:flex-col gap-3 h-full">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Undo2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-tight">
                {t("formatter_value_undo_title")}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3">
                {t("formatter_value_undo_desc")}
              </p>
            </div>
          </div>

          {/* Card 4: Built-in Quality Checks */}
          <div className="rounded-lg border border-border bg-card p-4 flex flex-row md:flex-row lg:flex-col gap-3 h-full">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-tight">
                {t("formatter_value_quality_title")}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3">
                {t("formatter_value_quality_desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div ref={mainContentRef} className="space-y-4">
          {/* 固定状态提示横幅 */}
          {isPinned && (
            <EditorPinnedBanner onUnpin={() => setIsPinned(false)} />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Editor */}
          <div
            ref={editorContainerRef}
            className={`rounded-xl border border-border bg-card shadow-sm flex flex-col transition-all duration-300 ${
              isPinned
                ? "ring-2 ring-[var(--brand-blue)]/60 ring-offset-2 ring-offset-background shadow-[0_0_20px_rgba(15,118,110,0.3)]"
                : ""
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{t("formatter_input")}</h2>
                <p className="text-xs text-muted-foreground">{t("formatter_input_hint")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isPinned ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setIsPinned(!isPinned)}
                  title={isPinned ? t("editor_pin_unpin") : t("editor_pin_title")}
                  aria-label={isPinned ? t("editor_pin_unpin") : t("editor_pin_title")}
                  className={`transition-all duration-200 ${
                    isPinned
                      ? "text-[var(--brand-blue)] bg-[var(--brand-blue)]/20 hover:bg-[var(--brand-blue)]/30 shadow-[0_0_8px_rgba(15,118,110,0.4)] ring-1 ring-[var(--brand-blue)]/50"
                      : "text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10"
                  }`}
                >
                  {isPinned ? (
                    <Pin className="h-4 w-4 animate-in zoom-in-50 duration-200" />
                  ) : (
                    <PinOff className="h-4 w-4" />
                  )}
                </Button>
                {hasUnsavedChanges && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {t("formatter_unsaved")}
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(",")}
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      {t("formatter_uploading")}
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      {t("editor_upload_file")}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSample}
                  className="text-xs border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
                >
                  {t("formatter_load_sample")}
                </Button>
              </div>
            </div>
            {uploadError && (
              <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
                <p className="text-xs text-destructive">{uploadError}</p>
              </div>
            )}
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
                    {t("formatter_diff")}
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
                    {t("preview_title")}
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
                      {t("markdown_diff_highlight_word")}
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
                      {t("markdown_diff_highlight_block")}
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
                    {t("copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    {t("copy")}
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
                        <p className="text-sm font-medium text-foreground">{t("formatter_no_changes")}</p>
                        <p className="text-xs text-muted-foreground">{t("formatter_well_formatted")}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2 p-8">
                      <GitCompare className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        {t("formatter_click_format")}
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
        </div>

        {/* Advanced Mode: Rules Panel */}
        {mode === "advanced" && showAdvancedPanel && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{t("formatter_rules_config")}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t("formatter_rules_enabled", { enabled: enabledCount, total: ruleStates.length })}
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
                        title={`${t(`formatter_preset_${presetId}_desc`)} (${meta.rulesCount} ${t("formatter_rules_count", { count: "" }).trim()})`}
                      >
                        {t(`formatter_preset_${presetId}`)}
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
                    {t("formatter_enable_all")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={disableAllRules}
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    {t("formatter_disable_all")}
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
                      <span className="text-sm font-medium text-foreground">{t(category.labelKey)}</span>
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
            className="w-full border-dashed border-border text-[var(--brand-blue)] hover:text-[#0064c2]"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {t("formatter_show_config")} ({enabledCount}/{ruleStates.length})
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        )}

        {/* Lint Results Panel */}
        {mode === "advanced" && showLintResultsPanel && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{t("formatter_lint_results")}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t("formatter_lint_grouped")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded border border-border bg-muted/50">
                  {lintSummary.total} {t("formatter_lint_total")}
                </span>
                <span className="px-2 py-1 rounded border border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-300">
                  {lintSummary.bySeverity.error} {t("formatter_lint_error")}
                </span>
                <span className="px-2 py-1 rounded border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300">
                  {lintSummary.bySeverity.warning} {t("formatter_lint_warning")}
                </span>
                <span className="px-2 py-1 rounded border border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300">
                  {lintSummary.bySeverity.info} {t("formatter_lint_info")}
                </span>
                <div className="flex items-center gap-1 border-l border-border pl-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!result || exporting}
                    onClick={() => handleExport('json')}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("formatter_export_json")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!result || exporting}
                    onClick={() => handleExport('markdown')}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("formatter_export_markdown")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!result || exporting}
                    onClick={() => handleExport('sarif')}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("formatter_export_sarif")}
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLintResultsPanel(false)}
                  className="h-7 w-7 p-0 ml-2"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{t("formatter_selected")}</span>
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
                    {t("formatter_fix_all")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleFixSelected}
                    disabled={!content || isFormatting || selectedRuleIds.length === 0}
                    className="text-xs !bg-[var(--brand-blue)] !text-white hover:!bg-[#0064c2]"
                  >
                    {t("formatter_fix_selected")}
                  </Button>
                </div>
              </div>

              {lintResults.length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {result ? t("formatter_no_lint_issues") : t("formatter_run_to_lint")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result ? t("formatter_passes_rules") : t("formatter_lint_hint")}
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
                                {items.length === 1 
                                  ? t("formatter_issue_count", { count: items.length })
                                  : t("formatter_issues_count", { count: items.length })}
                              </span>
                            </div>
                            {selectedRuleIds.includes(ruleId as FormatRuleId) && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--brand-blue)]">
                                <Check className="h-3 w-3" />
                                {t("formatter_selected")}
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

        {/* Collapsed Lint Results Panel Toggle */}
        {mode === "advanced" && !showLintResultsPanel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLintResultsPanel(true)}
            className="w-full border-dashed border-border text-[var(--brand-blue)] hover:text-[#0064c2]"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t("formatter_lint_results")} ({lintSummary.total} {t("formatter_lint_total")})
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
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
                    {t("formatter_formatting")}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    {t("formatter_format")}
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
                  {t("formatter_apply")}
                </Button>
              )}
              
              <Button
                onClick={undo}
                variant="outline"
                disabled={!canUndo}
                className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
              >
                <Undo2 className="h-4 w-4 mr-2" />
                {t("formatter_undo")}
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              {stats && result?.hasChanges && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                    {stats.rulesApplied === 1 
                      ? t("formatter_rule_applied", { count: stats.rulesApplied })
                      : t("formatter_rules_applied", { count: stats.rulesApplied })}
                  </span>
                </div>
              )}
              
              {/* Mode indicator */}
              {mode === "advanced" && (
                <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  {t("formatter_rules_count", { count: `${enabledCount}/${ruleStates.length}` })}
                </span>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRules(!showRules)}
                className="text-xs border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[rgba(0,117,222,0.08)]"
              >
                <Info className="h-3.5 w-3.5 mr-1" />
                {showRules ? t("formatter_hide_applied") : t("formatter_show_applied")}
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
                  {result?.appliedRules?.length ? t("formatter_applied_rules") : t("formatter_enabled_rules")}
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
                    {t("formatter_customize_rules")}
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
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("formatter_about_title")}</h2>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">{t("formatter_what_is_title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {t("formatter_what_is_desc")}
              </p>
            </div>
            
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground">{t("formatter_who_is_for_title")}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t("formatter_who_is_for_desc")}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{t("formatter_who_is_for_li1")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{t("formatter_who_is_for_li2")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{t("formatter_who_is_for_li3")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{t("formatter_who_is_for_li4")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* How it works Section */}
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("formatter_how_it_works_title")}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t("formatter_how_it_works_intro")}
          </p>
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">{t("formatter_how_it_works_step1_title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {t("formatter_how_it_works_step1_desc")}
              </p>
            </div>
            
            <div className="border-t border-border"></div>
            
            {/* Step 2 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">{t("formatter_how_it_works_step2_title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {t("formatter_how_it_works_step2_desc")}
              </p>
            </div>
            
            <div className="border-t border-border"></div>
            
            {/* Step 3 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">{t("formatter_how_it_works_step3_title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {t("formatter_how_it_works_step3_desc")}
              </p>
            </div>
            
            <div className="border-t border-border"></div>
            
            {/* Step 4 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">{t("formatter_how_it_works_step4_title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {t("formatter_how_it_works_step4_desc")}
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-base font-semibold text-blue-600 dark:text-blue-400 leading-relaxed whitespace-pre-line text-center">
              {t("formatter_how_it_works_summary")}
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">{t("formatter_faq_title")}</h2>
          <div className="space-y-3">
            {[
              {
                q: t("formatter_faq_q1"),
                a: t("formatter_faq_a1"),
              },
              {
                q: t("formatter_faq_q2"),
                a: t("formatter_faq_a2"),
              },
              {
                q: t("formatter_faq_q3"),
                a: t("formatter_faq_a3"),
              },
              {
                q: t("formatter_faq_q4"),
                a: t("formatter_faq_a4"),
              },
            ].map((item, index) => (
              <div key={index} className="border border-border rounded-lg bg-card overflow-hidden">
                <button
                  onClick={() => {
                    setOpenFaqIndices((prev) => {
                      const newSet = new Set(prev)
                      if (newSet.has(index)) {
                        newSet.delete(index)
                      } else {
                        newSet.add(index)
                      }
                      return newSet
                    })
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-sm text-foreground pr-4">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${
                      openFaqIndices.has(index) ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaqIndices.has(index) && (
                  <div className="px-4 py-3 border-t border-border bg-muted/20">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
