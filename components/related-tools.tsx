"use client"

import Link from "next/link"
import { FileText, BookOpen, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

export function RelatedTools() {
  const t = useTranslations()

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="pt-8 pb-6">
          <div className="h-px w-full bg-border" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
          {t("related_tools_title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Card A: Markdown Preview */}
          <Link
            href="/"
            className="group flex flex-col h-full rounded-xl border border-border bg-card/70 p-6 hover:border-[var(--brand-blue)]/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[rgba(0,117,222,0.1)] flex items-center justify-center group-hover:bg-[rgba(0,117,222,0.15)] transition-colors">
                <FileText className="h-6 w-6 text-[var(--brand-blue)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-[var(--brand-blue)] transition-colors">
                  {t("related_tools_preview_title")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {t("related_tools_preview_description")}
                </p>
                <div className="flex items-center text-sm font-medium text-[var(--brand-blue)] group-hover:gap-2 transition-all">
                  <span>{t("related_tools_preview_link")}</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Card B: Blog */}
          <Link
            href="/blog"
            className="group flex flex-col h-full rounded-xl border border-border bg-card/70 p-6 hover:border-[var(--brand-blue)]/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[rgba(0,117,222,0.1)] flex items-center justify-center group-hover:bg-[rgba(0,117,222,0.15)] transition-colors">
                <BookOpen className="h-6 w-6 text-[var(--brand-blue)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-[var(--brand-blue)] transition-colors">
                  {t("related_tools_guides_title")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {t("related_tools_guides_description")}
                </p>
                <div className="flex items-center text-sm font-medium text-[var(--brand-blue)] group-hover:gap-2 transition-all">
                  <span>{t("related_tools_guides_link")}</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}

