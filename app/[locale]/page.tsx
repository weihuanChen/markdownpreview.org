"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useTranslations, useLocale } from 'next-intl'
import { Moon, Sun, GripHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarkdownPreview } from "@/components/markdown-preview"
import { Faq } from "@/components/faq"
import { Footer } from "@/components/footer"
import { LanguageSwitcher } from "@/components/language-switcher"

const CodeMirrorEditor = dynamic(() => import("@/components/code-editor"), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-muted-foreground">Loading editor...</div>,
})

// 默认 Markdown 模板映射
const DEFAULT_TEMPLATES: Record<string, string> = {
  ja: '',
  en: '',
  zh: ''
};

export default function MarkdownEditorPage() {
  const t = useTranslations()
  const locale = useLocale()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [markdown, setMarkdown] = useState("")
  const [debouncedMarkdown, setDebouncedMarkdown] = useState("")
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true)

  const [editorHeight, setEditorHeight] = useState(60) // vh units
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  // 根据语言加载默认模板
  useEffect(() => {
    async function loadTemplate() {
      try {
        setIsLoadingTemplate(true)
        const response = await fetch(`/templates/default-${locale}.md`)
        if (response.ok) {
          const template = await response.text()
          DEFAULT_TEMPLATES[locale] = template
          setMarkdown(template)
          setDebouncedMarkdown(template)
        }
      } catch (error) {
        console.error('Failed to load template:', error)
      } finally {
        setIsLoadingTemplate(false)
      }
    }
    loadTemplate()
  }, [locale])

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMarkdown(markdown)
    }, 300)

    return () => clearTimeout(timer)
  }, [markdown])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }, [])

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

      // Min: 30vh, Max: 80vh
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

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove)
      window.addEventListener("mouseup", handleDragEnd)

      return () => {
        window.removeEventListener("mousemove", handleDragMove)
        window.removeEventListener("mouseup", handleDragEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  if (isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{t("app_title")}</h1>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "light" ? t("theme_dark") : t("theme_light")}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5 text-[#0075de]" />
            ) : (
              <Sun className="h-5 w-5 text-[#0075de]" />
            )}
          </Button>

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex overflow-hidden border-b-2 border-border relative" style={{ height: `${editorHeight}vh` }}>
        {/* Editor Pane */}
        <div className="w-full md:w-1/2 border-r border-border flex flex-col h-full">
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <h2 className="text-sm font-medium text-muted-foreground">{t("editor_title")}</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeMirrorEditor value={markdown} onChange={setMarkdown} theme={theme} />
          </div>
        </div>

        {/* Preview Pane */}
        <div className="hidden md:flex md:w-1/2 flex-col h-full">
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <h2 className="text-sm font-medium text-muted-foreground">{t("preview_title")}</h2>
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

      <Faq />

      <Footer />
    </div>
  )
}
