"use client"

import { ArrowUpRight } from "lucide-react"
import { useTranslations } from 'next-intl'

export function MarkdownQuickStart() {
  const t = useTranslations()

  const cards = [
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
  ]

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-muted/20 via-background to-background border-b border-border">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-primary/80 tracking-wide uppercase">
              {t("quickstart_label")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t("quickstart_title")}</h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-3xl">
              {t("quickstart_description")}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{t("quickstart_source_prefix")}</span>{" "}
              <a
                href="https://www.markdownguide.org/basic-syntax/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
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
              className="rounded-xl border border-border bg-card/70 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                <pre className="bg-muted/50 border border-border/60 rounded-lg p-4 text-sm font-mono text-foreground whitespace-pre-wrap">
                  <code>{card.snippet}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
