"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { ArrowUpRight, Play, Plus, Copy, Check } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useEditorActions } from "@/components/editor-actions-provider"
import { Button } from "@/components/ui/button"
import { Link } from '@/navigation'

export function MarkdownQuickStart() {
  const t = useTranslations()
  const { replaceContent, insertAtCursor } = useEditorActions()
  const [copiedCard, setCopiedCard] = useState<string | null>(null)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [baseUrl, setBaseUrl] = useState<string>('https://markdownpreview.org')

  // 在客户端挂载后更新基础 URL，避免水合错误
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const cards = useMemo(() => [
    {
      key: "intro",
      title: t("quickstart_intro_title"),
      description: t("quickstart_intro_description"),
      snippet: t("quickstart_intro_snippet"),
    },
    {
      key: "paragraphs",
      title: t("quickstart_paragraphs_title"),
      description: t("quickstart_paragraphs_description"),
      snippet: t("quickstart_paragraphs_snippet"),
    },
    {
      key: "tables",
      title: t("quickstart_tables_title"),
      description: t("quickstart_tables_description"),
      snippet: t("quickstart_tables_snippet"),
    },
    {
      key: "code",
      title: t("quickstart_code_title"),
      description: t("quickstart_code_description"),
      snippet: t("quickstart_code_snippet"),
    },
    {
      key: "math",
      title: t("quickstart_math_title"),
      description: t("quickstart_math_description"),
      snippet: t("quickstart_math_snippet"),
    },
    {
      key: "lists",
      title: t("quickstart_lists_title"),
      description: t("quickstart_lists_description"),
      snippet: t("quickstart_lists_snippet"),
    },
    {
      key: "image",
      title: t("quickstart_image_title"),
      description: t("quickstart_image_description"),
      snippet: t("quickstart_image_snippet").replace('/markdownpreview-dojo.png', `${baseUrl}/markdownpreview-dojo.png`),
    },
    {
      key: "links",
      title: t("quickstart_links_title"),
      description: t("quickstart_links_description"),
      snippet: t("quickstart_links_snippet"),
    },
  ], [t, baseUrl])

  const handleCopy = useCallback(async (snippet: string, cardKey: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet)
        setCopiedCard(cardKey)
        setTimeout(() => setCopiedCard(null), 2000)
        return
      }

      const textarea = document.createElement("textarea")
      textarea.value = snippet
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()

      const success = document.execCommand("copy")
      document.body.removeChild(textarea)

      if (success) {
        setCopiedCard(cardKey)
        setTimeout(() => setCopiedCard(null), 2000)
      }
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }, [])

  useEffect(() => {
    const handleHighlight = (e: CustomEvent<{ highlight: boolean }>) => {
      setIsHighlighted(e.detail.highlight)
    }

    window.addEventListener("quickstart:highlight", handleHighlight as EventListener)

    return () => {
      window.removeEventListener("quickstart:highlight", handleHighlight as EventListener)
    }
  }, [])

  return (
    <section id="quickstart-section" className="relative py-16 md:py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(15,118,110,0.12),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(255,122,83,0.12),transparent_26%)]" />
      <div className="relative max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[var(--brand-blue)]" />
              {t("quickstart_label")}
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">{t("quickstart_title")}</h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-3xl">
              {t("quickstart_description")}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{t("quickstart_source_prefix")}</span>{" "}
              <a
                href="https://www.markdownguide.org/basic-syntax/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--brand-blue)] hover:text-[var(--brand-blue)]/80 transition-colors"
              >
                {t("quickstart_source_name")}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </p>
            <p className="text-sm text-muted-foreground">{t("quickstart_hint")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {cards.map((card) => (
            <div
              key={card.key}
              className={`relative rounded-2xl border bg-card/80 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.6)] backdrop-blur transition-all duration-200 ${
                isHighlighted
                  ? "border-[var(--brand-blue)]/80 shadow-[0_25px_80px_-55px_rgba(15,118,110,0.9)]"
                  : "border-border/70"
              }`}
            >
              <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/12"
                  onClick={() => replaceContent(card.snippet)}
                  title={t("quickstart_try_in_editor")}
                  aria-label={t("quickstart_try_in_editor")}
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/12"
                  onClick={() => insertAtCursor(card.snippet)}
                  title={t("quickstart_insert")}
                  aria-label={t("quickstart_insert")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/12"
                  onClick={() => handleCopy(card.snippet, card.key)}
                  title={copiedCard === card.key ? t("copied") : t("copy")}
                  aria-label={copiedCard === card.key ? t("copied") : t("copy")}
                >
                  {copiedCard === card.key ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-semibold text-foreground pr-20">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                <div className="relative rounded-xl border border-border/60 bg-gradient-to-br from-secondary/60 via-card/80 to-card/70 p-4">
                  <pre className="text-sm font-mono text-foreground whitespace-pre-wrap">
                    <code>{card.snippet}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-medium text-[var(--brand-blue)] hover:text-[#0b9a86] transition-colors"
          >
            <span>{t("quickstart_blog_cta_question")}</span>
            <span className="text-[#0b9a86]">{t("quickstart_blog_cta_link")}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
