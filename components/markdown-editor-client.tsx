"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { GripHorizontal, Copy, Check, Sparkles, Upload, Download, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { Link } from "@/navigation"

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
  },
)

interface MarkdownEditorClientProps {
  initialValue: string
}

const SAMPLE_MARKDOWN = `# Quick Sample

Welcome to **Markdown Preview**.

- Bullet item A
- Bullet item B

1. First
2. Second

Inline code: \`const msg = "hello"\`

\`\`\`js
function greet(name) {
  return \`Hi, \${name}!\`
}
\`\`\`

## Links

Here are some link examples:
- [Markdown Guide](https://www.markdownguide.org) - A comprehensive guide to Markdown
- [GitHub](https://github.com) - Code hosting platform
- [Example with title](https://example.com "Example Website")

## Math Formulas

Inline math: \\(E = mc^2\\) and \\(a^2 + b^2 = c^2\\)

Display math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

Quadratic formula:
$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Footnotes

This is a sentence with a footnote[^1]. You can also add multiple footnotes[^2] in the same document.

[^1]: This is the first footnote definition.
[^2]: This is the second footnote with more details about the topic.
`

export function MarkdownEditorClient({ initialValue }: MarkdownEditorClientProps) {
  const t = useTranslations()
  const { theme } = useTheme()
  const [markdown, setMarkdown] = useState(initialValue)
  const [debouncedMarkdown, setDebouncedMarkdown] = useState(initialValue)
  const [copied, setCopied] = useState(false)
  const [editorHeight, setEditorHeight] = useState(60)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedMarkdown(markdown)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [markdown])

  useEffect(() => {
    const idleWindow = window as Window &
      Partial<{ requestIdleCallback: (cb: () => void) => number; cancelIdleCallback: (handle: number) => void }>

    const idleHandle =
      idleWindow.requestIdleCallback?.(() => setIsEditorReady(true)) ??
      window.setTimeout(() => setIsEditorReady(true), 80)

    return () => {
      if (idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleHandle as number)
      } else {
        window.clearTimeout(idleHandle as number)
      }
    }
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
      }

      const textarea = document.createElement("textarea")
      textarea.value = markdown
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()

      const success = document.execCommand("copy")
      document.body.removeChild(textarea)

      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        console.error("Failed to copy using execCommand")
      }
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }, [markdown])

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)
      dragStartY.current = e.clientY
      dragStartHeight.current = editorHeight
      document.body.style.cursor = "ns-resize"
      document.body.style.userSelect = "none"
    },
    [editorHeight],
  )

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const deltaY = e.clientY - dragStartY.current
      const viewportHeight = window.innerHeight
      const deltaVh = (deltaY / viewportHeight) * 100
      const newHeight = Math.min(80, Math.max(30, dragStartHeight.current + deltaVh))
      setEditorHeight(newHeight)
    },
    [isDragging],
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [])

  const handleQuickStart = useCallback(() => {
    // 滚动到 Quick Start 区块
    setTimeout(() => {
      const quickStartSection = document.getElementById("quickstart-section")
      if (quickStartSection) {
        quickStartSection.scrollIntoView({ behavior: "smooth", block: "start" })
        // 触发高亮事件
        window.dispatchEvent(
          new CustomEvent("quickstart:highlight", {
            detail: { highlight: true },
          })
        )
        // 3秒后取消高亮
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("quickstart:highlight", {
              detail: { highlight: false },
            })
          )
        }, 3000)
      }
    }, 100)
  }, [])

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

  const validateFile = useCallback(
    (file: File): string | null => {
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
    },
    [t],
  )

  const readFileContent = useCallback(
    (file: File): Promise<string> => {
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
    },
    [t],
  )

  const handleFileUpload = useCallback(
    async (file: File | null) => {
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
        setMarkdown(content)
        setUploadError(null)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t("editor_upload_error_read_failed")
        setUploadError(errorMessage)
      } finally {
        setIsUploading(false)
      }
    },
    [validateFile, readFileContent, t],
  )

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

  const handleDownload = useCallback(() => {
    if (!markdown.trim()) return

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "markdown-document.md"
    link.click()
    URL.revokeObjectURL(url)
  }, [markdown])

  useEffect(() => {
    if (!isDragging) return

    window.addEventListener("mousemove", handleDragMove)
    window.addEventListener("mouseup", handleDragEnd)

    return () => {
      window.removeEventListener("mousemove", handleDragMove)
      window.removeEventListener("mouseup", handleDragEnd)
    }
  }, [handleDragEnd, handleDragMove, isDragging])

  return (
    <section id="editor-stage" className="relative px-4 pb-16">
      <div className="absolute inset-x-6 -top-10 h-32 bg-[radial-gradient(circle_at_20%_50%,rgba(15,118,110,0.16),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,122,83,0.16),transparent_42%)] blur-2xl" />
      <div className="relative max-w-7xl mx-auto overflow-hidden rounded-3xl border border-border/80 bg-card/90 shadow-[0_25px_90px_-45px_rgba(15,23,42,0.55)] backdrop-blur">
        <div id="markdown-editor" className="flex overflow-hidden relative" style={{ height: `${editorHeight}vh` }}>
          <div className="w-full md:w-1/2 border-r border-border/70 flex flex-col h-full bg-gradient-to-b from-card via-card/70 to-secondary/60">
            <div className="px-5 py-3 border-b border-border/70 bg-gradient-to-r from-card/90 via-secondary/40 to-card/80 flex items-center justify-between backdrop-blur">
              <h2 className="text-sm font-semibold text-foreground tracking-wide">{t("editor_title")}</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleQuickStart}
                  aria-label={t("editor_quickstart")}
                  className="border border-[var(--brand-blue)]/70 text-foreground bg-[var(--brand-blue)]/12 hover:bg-[var(--brand-blue)]/18 shadow-[0_12px_35px_-24px_rgba(15,118,110,0.75)]"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  {t("editor_quickstart")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMarkdown(SAMPLE_MARKDOWN)}
                  aria-label={t("insert_sample")}
                  className="border border-[var(--brand-blue)]/70 text-foreground bg-[var(--brand-blue)]/12 hover:bg-[var(--brand-blue)]/18 shadow-[0_12px_35px_-24px_rgba(15,118,110,0.75)]"
                >
                  {t("insert_sample")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title={t("editor_upload_file")}
                  aria-label={t("editor_upload_file")}
                  className="text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.markdown,.txt,.json,.js,.ts,.jsx,.tsx,.css,.scss,.html,.htm,.xml,.yaml,.yml,text/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleDownload}
                  disabled={!markdown.trim()}
                  title={t("editor_download_file")}
                  aria-label={t("editor_download_file")}
                  className="text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCopy}
                  title={copied ? t("copied") : t("copy")}
                  aria-label={copied ? t("copied") : t("copy")}
                  className="text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {uploadError && (
              <div className="px-5 py-2 bg-destructive/15 text-destructive text-sm border-b border-border/70">
                {uploadError}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              {isEditorReady ? (
                <CodeMirrorEditor value={markdown} onChange={setMarkdown} theme={theme} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading editor...
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex md:w-1/2 flex-col h-full bg-gradient-to-b from-card/80 via-card/60 to-secondary/50">
            <div className="px-5 py-3 border-b border-border/70 bg-gradient-to-r from-card/90 via-secondary/40 to-card/80 flex items-center justify-between backdrop-blur">
              <h2 className="text-sm font-semibold text-foreground tracking-wide">{t("preview_title")}</h2>
              <div className="size-8 rounded-full bg-[rgba(15,118,110,0.12)] border border-border/60" />
            </div>
            <div className="flex-1 overflow-auto">
              <MarkdownPreview content={debouncedMarkdown} />
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-[var(--brand-blue)]/18 transition-colors flex items-center justify-center group"
            onMouseDown={handleDragStart}
          >
            <div className="absolute inset-x-0 h-1 bg-border group-hover:bg-[var(--brand-blue)] transition-colors" />
            <GripHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-[var(--brand-blue)] transition-colors bg-background rounded-sm opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      </div>
      
      {/* Professional Writing Message */}
      <div className="relative max-w-7xl mx-auto mt-4 px-4">
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border/60 bg-muted/40 backdrop-blur text-sm text-muted-foreground">
          <span>{t("editor_professional_message")}</span>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-auto px-2 py-1 text-[var(--brand-blue)] hover:text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10"
          >
            <Link href="/formatter">
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              {t("editor_professional_link")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
