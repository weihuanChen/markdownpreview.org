"use client"

import { useTranslations } from 'next-intl'

export function WhyUseMarkdownEditor() {
  const t = useTranslations()
  return (
    <section className="relative py-16 px-4">
      <div className="absolute inset-0 bg-gradient-to-l from-secondary/50 via-transparent to-card/60" />
      <div className="relative max-w-6xl mx-auto rounded-3xl border border-border/70 bg-card/80 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.55)] backdrop-blur p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3 md:max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
              {t("quickstart_label")}
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              {t("why_use_editor_title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("why_use_editor_p1")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 w-full">
            {[t("why_use_editor_li1"), t("why_use_editor_li2"), t("why_use_editor_li3"), t("why_use_editor_li4")].map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-secondary/40 to-card/80 p-4"
              >
                <span className="mt-0.5 inline-flex size-9 items-center justify-center rounded-full bg-[var(--brand-blue)]/12 text-sm font-semibold text-[var(--brand-blue)]">
                  {index + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
