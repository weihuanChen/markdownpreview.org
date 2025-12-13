"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { GripHorizontal, Copy, Check, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

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
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

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
    <div id="markdown-editor" className="flex overflow-hidden border-b-2 border-border relative" style={{ height: `${editorHeight}vh` }}>
      <div className="w-full md:w-1/2 border-r border-border flex flex-col h-full">
        <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">{t("editor_title")}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleQuickStart}
              aria-label={t("editor_quickstart")}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              {t("editor_quickstart")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMarkdown(SAMPLE_MARKDOWN)}
              aria-label={t("insert_sample")}
            >
              {t("insert_sample")}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              title={copied ? t("copied") : t("copy")}
              aria-label={copied ? t("copied") : t("copy")}
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
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

      <div className="hidden md:flex md:w-1/2 flex-col h-full">
        <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">{t("preview_title")}</h2>
          <div className="size-8" />
        </div>
        <div className="flex-1 overflow-auto">
          <MarkdownPreview content={debouncedMarkdown} />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-[#0075de]/20 transition-colors flex items-center justify-center group"
        onMouseDown={handleDragStart}
      >
        <div className="absolute inset-x-0 h-1 bg-border group-hover:bg-[#0075de] transition-colors" />
        <GripHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-[#0075de] transition-colors bg-background rounded-sm opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  )
}
