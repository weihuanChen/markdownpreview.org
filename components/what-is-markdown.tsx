"use client"

import { useTranslations } from 'next-intl'

export function WhatIsMarkdown() {
  const t = useTranslations()
  return (
    <section className="relative py-16 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-transparent to-card/60" />
      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[0.8fr,1.2fr] gap-8 items-start">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-[rgba(15,118,110,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)]">
            {t("quickstart_label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
            {t("what_is_markdown_title")}
          </h2>
          <div className="h-px w-16 bg-gradient-to-r from-[var(--brand-blue)] via-foreground/40 to-transparent" />
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/80 p-8 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.55)] backdrop-blur space-y-6">
          <p className="text-base leading-relaxed text-foreground/90">
            {t("what_is_markdown_p1")}
          </p>
          <div className="h-px bg-border/80" />
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("what_is_markdown_p2")}
          </p>
        </div>
      </div>
    </section>
  )
}
